// Texte legale pentru CLIENȚII unui restaurant: vânzătorul și operatorul datelor este restaurantul
// (completat automat din profilul lui); ALL4HORECA apare doar ca furnizor tehnic al platformei.
// DRAFT: de revizuit juridic înainte de primul client plătitor.
import type { LegalDocument } from "@/lib/legal-content";

export type RestaurantLegalParty = {
  name: string;
  company?: string | null;
  vatCui?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
};

const PLATFORM =
  "LUCANTO 2020 DISTRIBUTION SRL (marca ALL4HORECA), cu sediul în Orăștie, jud. Hunedoara, CUI RO43334187, e-mail contact@all4horeca.ro";

export const LEGAL_UPDATED = "13.11.2026";

export function describeRestaurant(p: RestaurantLegalParty): string {
  const company = p.company?.trim();
  const name = p.name.trim();
  const parts: string[] = [];
  parts.push(company && company !== name ? `${company} (restaurantul „${name}”)` : name);
  if (p.vatCui?.trim()) parts.push(`CUI ${p.vatCui.trim()}`);
  const place = [p.address?.trim(), p.city?.trim()].filter(Boolean).join(", ");
  if (place) parts.push(`sediul/adresa: ${place}`);
  if (p.email?.trim()) parts.push(`e-mail ${p.email.trim()}`);
  if (p.phone?.trim()) parts.push(`telefon ${p.phone.trim()}`);
  return parts.join(", ");
}

function contactLine(p: RestaurantLegalParty): string {
  const channels = [p.phone?.trim() && `telefon ${p.phone.trim()}`, p.email?.trim() && `e-mail ${p.email.trim()}`]
    .filter(Boolean)
    .join(" sau ");
  return channels || "datele de contact afișate în meniul restaurantului";
}

export function buildRestaurantTerms(p: RestaurantLegalParty): LegalDocument {
  const who = describeRestaurant(p);
  const contact = contactLine(p);
  return {
    title: "Termeni și condiții de comandă",
    updated: LEGAL_UPDATED,
    sections: [
      {
        heading: "1. Cine suntem",
        paragraphs: [
          `Comenzile făcute în această aplicație se încheie cu ${who} („Restaurantul”, „noi”). Comanda se transmite prin platforma tehnică ALL4HORECA.`,
        ],
      },
      {
        heading: "2. Rolul Restaurantului și al platformei",
        paragraphs: [
          "Restaurantul este vânzătorul: stabilește produsele, prețurile, programul, zonele și taxele de livrare, pregătește și livrează comanda și răspunde de calitatea produselor.",
          `Platforma tehnică este furnizată de ${PLATFORM}, care oferă doar instrumentul prin care comanda ajunge la Restaurant și nu este parte în contractul de vânzare.`,
        ],
      },
      {
        heading: "3. Contul",
        paragraphs: [
          "Pentru a comanda ai nevoie de un cont, creat cu numărul tău de telefon. La prima autentificare, și apoi pe dispozitive noi, primești un cod prin SMS. Nu folosim parolă.",
          "Ești responsabil de numărul de telefon folosit și de accesul la dispozitivul tău. Dacă pierzi numărul sau dispozitivul, anunță Restaurantul sau furnizorul platformei (contact@all4horeca.ro).",
        ],
      },
      {
        heading: "4. Plasarea comenzii, prețuri și plată",
        paragraphs: [
          "Comanda se consideră plasată când apeși butonul de trimitere și ajunge la Restaurant. Ea devine obligatorie pentru Restaurant abia când o acceptă; vei vedea starea comenzii în aplicație.",
          "Prețurile sunt în lei și sunt calculate de platformă pe baza prețurilor Restaurantului. Reducerile și promoțiile se aplică automat, conform regulilor Restaurantului, și vezi reducerea înainte să trimiți comanda.",
          "Metodele de plată disponibile sunt cele afișate de Restaurant la finalizarea comenzii.",
        ],
      },
      {
        heading: "5. Livrare, ridicare și anulare",
        paragraphs: [
          "Timpul de livrare afișat este orientativ. Restaurantul poate refuza sau anula o comandă (de exemplu, produs epuizat sau în afara zonei de livrare) și te informează în aplicație.",
          "Poți cere anularea unei comenzi doar până când Restaurantul o acceptă; după acceptare, anularea se face cu acordul Restaurantului.",
          "Pentru preparate alimentare făcute la comandă sau care se pot deteriora rapid, legea nu prevede drept de retragere de 14 zile pentru contractele la distanță; dacă primești un produs greșit sau necorespunzător, contactează Restaurantul.",
        ],
      },
      {
        heading: "6. Reclamații",
        paragraphs: [
          `Pentru orice problemă cu o comandă, contactează Restaurantul: ${contact}. Pentru probleme tehnice ale aplicației poți scrie și la contact@all4horeca.ro.`,
          "Ca consumator, te poți adresa și Autorității Naționale pentru Protecția Consumatorilor (anpc.ro).",
        ],
      },
      {
        heading: "7. Utilizare corectă",
        paragraphs: [
          "Nu poți folosi aplicația pentru comenzi false sau abuzive, pentru a încerca să obții acces la datele altor utilizatori sau pentru a o perturba. Conturile care încalcă aceste reguli pot fi suspendate.",
        ],
      },
      {
        heading: "8. Răspundere",
        paragraphs: [
          "Ne străduim ca aplicația să funcționeze continuu, dar nu garantăm lipsa întreruperilor. Produsele, prețurile și livrarea sunt în responsabilitatea Restaurantului.",
        ],
      },
      {
        heading: "9. Date personale",
        paragraphs: ["Cum prelucrăm datele tale este explicat în Politica de confidențialitate."],
      },
      {
        heading: "10. Modificări și legea aplicabilă",
        paragraphs: [
          "Putem actualiza acești termeni; versiunea în vigoare este cea publicată aici, cu data ultimei actualizări. Se aplică legea română.",
        ],
      },
    ],
  };
}

export function buildRestaurantPrivacy(p: RestaurantLegalParty): LegalDocument {
  const who = describeRestaurant(p);
  const contact = contactLine(p);
  return {
    title: "Politica de confidențialitate",
    updated: LEGAL_UPDATED,
    sections: [
      {
        heading: "1. Cine prelucrează datele tale",
        paragraphs: [
          `Pentru datele din comenzi, operatorul este ${who}. Platforma tehnică este furnizată de ${PLATFORM}, care acționează ca împuternicit al Restaurantului.`,
          "Pentru securitatea autentificării în platformă (cod SMS, prevenirea abuzurilor), furnizorul platformei prelucrează numărul tău de telefon. Contact pentru date personale la furnizorul platformei: contact@all4horeca.ro.",
        ],
      },
      {
        heading: "2. Ce date prelucrăm",
        paragraphs: [
          "Numărul de telefon (cont și contact pentru comandă), numele pe care îl introduci, adresa de livrare și locația aleasă pe hartă, email-ul (dacă îl completezi), istoricul comenzilor, notele către Restaurant și, dacă accepți, datele necesare notificărilor din aplicație.",
          "Nu cerem și nu stocăm date de card în aplicație.",
        ],
      },
      {
        heading: "3. De ce folosim datele și pe ce temei",
        paragraphs: [
          "Pentru a crea contul și a-ți trimite codul de autentificare, a transmite și onora comanda, a-ți arăta starea comenzii: executarea contractului (art. 6 alin. 1 lit. b GDPR).",
          "Pentru obligații contabile și fiscale ale Restaurantului: obligație legală (art. 6 alin. 1 lit. c).",
          "Pentru securitatea platformei și prevenirea comenzilor false: interes legitim (art. 6 alin. 1 lit. f).",
          "Notificările de stare a comenzii se trimit doar dacă le activezi (consimțământ, art. 6 alin. 1 lit. a); le poți opri oricând.",
        ],
      },
      {
        heading: "4. Cui transmitem datele",
        paragraphs: [
          "Restaurantului la care comanzi, pentru a prepara și livra comanda. Furnizorilor care rulează aplicația: Supabase (baza de date, servere în Uniunea Europeană), furnizorul de hosting, furnizorul de SMS pentru codurile de autentificare și Google (hărți pentru adrese).",
          "Nu vindem datele tale și nu le folosim pentru publicitate.",
        ],
      },
      {
        heading: "5. Cât păstrăm datele",
        paragraphs: [
          `Cât timp ai cont activ, plus termenele impuse de lege pentru documentele comerciale și fiscale ale Restaurantului. Poți cere ștergerea contului oricând, la ${contact}; datele pe care legea ne obligă să le păstrăm rămân doar cât este necesar.`,
        ],
      },
      {
        heading: "6. Drepturile tale",
        paragraphs: [
          `Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, precum și dreptul de a retrage consimțământul. Scrie Restaurantului la ${contact} (poți scrie și la contact@all4horeca.ro); răspundem în cel mult 30 de zile.`,
          "Ai dreptul să depui plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (dataprotection.ro).",
        ],
      },
      {
        heading: "7. Securitate",
        paragraphs: [
          "Datele sunt transmise criptat, iar accesul este limitat prin reguli de securitate: fiecare restaurant vede doar comenzile lui, iar tu îți vezi doar propriile date.",
        ],
      },
    ],
  };
}

export function buildRestaurantCookies(p: RestaurantLegalParty): LegalDocument {
  return {
    title: "Politica de cookie-uri și stocare locală",
    updated: LEGAL_UPDATED,
    sections: [
      {
        heading: "Ce folosim",
        paragraphs: [
          `Aplicația restaurantului ${p.name.trim()} folosește doar stocare strict necesară funcționării: sesiunea de autentificare, coșul de cumpărături, comenzile tale recente afișate pe acest dispozitiv, preferința de a ascunde bannerul de instalare și setările de notificări. Acestea nu necesită consimțământ.`,
          "Nu folosim cookie-uri de publicitate sau de urmărire.",
        ],
      },
      {
        heading: "Servicii terțe",
        paragraphs: [
          "Hărțile Google (alegerea adresei de livrare) pot stoca date tehnice conform politicii Google. Dacă vom adăuga în viitor statistici de utilizare, te vom întreba înainte.",
        ],
      },
      {
        heading: "Cum le ștergi",
        paragraphs: [
          "Poți șterge stocarea locală din setările browserului. Vei fi deconectat și coșul se golește.",
        ],
      },
    ],
  };
}
