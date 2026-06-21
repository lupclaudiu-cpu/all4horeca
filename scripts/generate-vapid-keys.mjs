import { createECDH } from "node:crypto";

const keys = createECDH("prime256v1");
keys.generateKeys();

const toBase64Url = (value) =>
  value
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${toBase64Url(keys.getPublicKey())}`);
console.log(`VAPID_PRIVATE_KEY=${toBase64Url(keys.getPrivateKey())}`);
console.log("VAPID_SUBJECT=mailto:contact@antoria.ro");
