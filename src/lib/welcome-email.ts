const APP_URL = "https://comanda.all4horeca.ro";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type WelcomeEmailInput = {
  to: string;
  name: string;
  restaurantName: string;
  trialExpiresAt: string;
};

export function buildWelcomeEmail(input: WelcomeEmailInput, guideUrl: string) {
  const name = esc(input.name || "");
  const restaurant = esc(input.restaurantName);
  const date = new Date(input.trialExpiresAt).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Bucharest",
  });
  const panelUrl = `${APP_URL}/login`;
  const steps = [
    "<b>Profil:</b> sigla, culorile, adresa, telefonul și datele firmei.",
    "<b>Program:</b> orele pe zile, sărbători, blocarea comenzilor în afara programului.",
    "<b>Livrare și plată:</b> zone, taxe, prag de livrare gratuită, comandă minimă.",
    "<b>Meniu:</b> categorii, produse cu poză, descriere, gramaj, ingrediente și alergeni, plus opțiuni extra (sosuri, garnituri).",
    "<b>Promoții și echipă:</b> reduceri, conturi pentru angajați.",
    "<b>Test:</b> trimite o comandă de test și vezi-o în „Comenzi live”. Ca client de test poți folosi telefonul 0770 111 111 și codul 123456.",
    "<b>Lansare:</b> tipărește codul QR și trimite linkul clienților.",
  ];

  const subject = `Contul tău ALL4HORECA e gata – ${input.restaurantName}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#14231D;line-height:1.55">
<div style="background:#173A2E;color:#EFE8DA;padding:22px 26px;font-size:20px;font-weight:bold;letter-spacing:2px">ALL4HORECA</div>
<div style="padding:24px 26px;background:#F7F3EA">
<p>Bună${name ? `, ${name}` : ""},</p>
<p>Contul pentru <b>${restaurant}</b> a fost creat. Ai <b>14 zile de probă gratuită</b>, până pe <b>${esc(date)}</b>, cu toate funcțiile aplicației.</p>
<p><b>Ce poți face în cont:</b></p>
<ul><li>ai meniu online, cu link și cod QR pe care le dai clienților</li><li>primești comenzile direct în panou, în timp real</li><li>îți administrezi restaurantul direct de pe telefon, fără să instalezi altceva</li></ul>
<p>În perioada de probă, comenzile reale ale clienților nu sunt active. Tu, ca administrator, poți trimite comenzi de test din meniul tău.</p>
<p><b>Cum îți pregătești restaurantul:</b></p>
<ol>${steps.map((step) => `<li>${step}</li>`).join("")}</ol>
<p>Ghidul complet, cu toți pașii explicați: <a href="${esc(guideUrl)}" style="color:#7A5620">${esc(guideUrl)}</a></p>
<p style="margin:26px 0"><a href="${panelUrl}" style="background:#173A2E;color:#EFE8DA;padding:13px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Deschide panoul</a></p>
<p>După probă, abonamentul pentru o locație costă 449 lei/lună + TVA, iar implementarea 1.900 lei + TVA. Dacă ai întrebări, răspunde la acest email sau scrie-ne la contact@all4horeca.ro.</p>
<p><b>Important:</b> costul implementării și abonamentul de după perioada de probă se aplică doar cu acordul tău și doar dacă decizi să folosești aplicația. Nu plătești nimic automat la sfârșitul probei.</p>
<p>Succes,<br>Echipa ALL4HORECA</p>
</div></div>`;

  const text = [
    `Bună${input.name ? `, ${input.name}` : ""},`,
    "",
    `Contul pentru ${input.restaurantName} a fost creat. Ai 14 zile de probă gratuită, până pe ${date}, cu toate funcțiile aplicației.`,
    "",
    "Cum îți pregătești restaurantul:",
    ...steps.map((step, index) => `${index + 1}. ${step.replace(/<[^>]+>/g, "")}`),
    "",
    `Ghidul complet: ${guideUrl}`,
    `Deschide panoul: ${panelUrl}`,
    "",
    "După probă, abonamentul costă 449 lei/lună + TVA, iar implementarea 1.900 lei + TVA.",
    "Important: costul implementării și abonamentul de după perioada de probă se aplică doar cu acordul tău și doar dacă decizi să folosești aplicația. Nu plătești nimic automat la sfârșitul probei.",
    "Întrebări: contact@all4horeca.ro",
    "",
    "Echipa ALL4HORECA",
  ].join("\n");

  return { subject, html, text };
}

/** Best-effort: never throws, never blocks registration. */
export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from =
    process.env.EMAIL_FROM || "ALL4HORECA <contact@all4horeca.ro>";
  const guideUrl =
    process.env.WELCOME_GUIDE_URL || "https://all4horeca.ro/ghid.pdf";
  const { subject, html, text } = buildWelcomeEmail(input, guideUrl);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        reply_to: "contact@all4horeca.ro",
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(6000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
