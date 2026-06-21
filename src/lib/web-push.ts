import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
} from "node:crypto";

export type WebPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
};

export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: WebPushPayload,
) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@antoria.ro";
  if (!publicKey || !privateKey) {
    throw new Error(
      "Lipsesc NEXT_PUBLIC_VAPID_PUBLIC_KEY sau VAPID_PRIVATE_KEY.",
    );
  }

  const audience = new URL(subscription.endpoint).origin;
  const authorization = createVapidAuthorization({
    audience,
    subject,
    publicKey,
    privateKey,
  });
  const body = encryptPayload(
    Buffer.from(JSON.stringify(payload)),
    subscription,
  );
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "normal",
    },
    body,
  });

  return {
    ok: response.ok,
    status: response.status,
    expired: response.status === 404 || response.status === 410,
  };
}

function encryptPayload(
  payload: Buffer,
  subscription: WebPushSubscription,
) {
  const clientPublicKey = fromBase64Url(subscription.p256dh);
  const authSecret = fromBase64Url(subscription.auth);
  const serverKeys = createECDH("prime256v1");
  serverKeys.generateKeys();
  const serverPublicKey = serverKeys.getPublicKey();
  const sharedSecret = serverKeys.computeSecret(clientPublicKey);

  const authPrk = hmac(authSecret, sharedSecret);
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0"),
    clientPublicKey,
    serverPublicKey,
  ]);
  const inputKeyMaterial = hkdfExpand(authPrk, keyInfo, 32);
  const salt = randomBytes(16);
  const prk = hmac(salt, inputKeyMaterial);
  const contentEncryptionKey = hkdfExpand(
    prk,
    Buffer.from("Content-Encoding: aes128gcm\0"),
    16,
  );
  const nonce = hkdfExpand(
    prk,
    Buffer.from("Content-Encoding: nonce\0"),
    12,
  );
  const plaintext = Buffer.concat([payload, Buffer.from([2])]);
  const cipher = createCipheriv("aes-128-gcm", contentEncryptionKey, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);

  return Buffer.concat([
    salt,
    recordSize,
    Buffer.from([serverPublicKey.length]),
    serverPublicKey,
    ciphertext,
  ]);
}

function createVapidAuthorization({
  audience,
  subject,
  publicKey,
  privateKey,
}: {
  audience: string;
  subject: string;
  publicKey: string;
  privateKey: string;
}) {
  const publicBytes = fromBase64Url(publicKey);
  const privateBytes = fromBase64Url(privateKey);
  if (publicBytes.length !== 65 || privateBytes.length !== 32) {
    throw new Error("Cheile VAPID nu au formatul corect.");
  }
  const header = toBase64Url(
    Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })),
  );
  const claims = toBase64Url(
    Buffer.from(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );
  const unsignedToken = `${header}.${claims}`;
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: toBase64Url(publicBytes.subarray(1, 33)),
      y: toBase64Url(publicBytes.subarray(33, 65)),
      d: toBase64Url(privateBytes),
    },
    format: "jwk",
  });
  const signature = sign("sha256", Buffer.from(unsignedToken), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `vapid t=${unsignedToken}.${toBase64Url(signature)}, k=${publicKey}`;
}

function hkdfExpand(prk: Buffer, info: Buffer, length: number) {
  return hmac(prk, Buffer.concat([info, Buffer.from([1])])).subarray(
    0,
    length,
  );
}

function hmac(key: Buffer, value: Buffer) {
  return createHmac("sha256", key).update(value).digest();
}

function fromBase64Url(value: string) {
  return Buffer.from(
    value.replaceAll("-", "+").replaceAll("_", "/"),
    "base64",
  );
}

function toBase64Url(value: Buffer) {
  return value
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
