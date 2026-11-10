// DRAFT legal texts (ciornă). To be reviewed by a lawyer before the first paying client.
export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDocument = { title: string; updated: string; sections: LegalSection[] };

const OPERATOR =
  "LUCANTO 2020 DISTRIBUTION SRL, care activează sub marca ALL4HORECA, cu sediul în Orăștie, str. Pricazului nr. 6, jud. Hunedoara, CUI RO43334187, J20/1255/2020, e-mail contact@all4horeca.ro, telefon 0746 322 673 („ALL4HORECA”, „noi”)";

export const termsDocument: LegalDocument = {
  title: "Termeni și condiții de utilizare",
  updated: "08.11.2026",
  sections: [
    {
      heading: "1. Cine suntem",
      paragraphs: [
        `Aplicația ALL4HORECA este operată de ${OPERATOR}. Punem la dispoziția restaurantelor o platformă prin care clienții își pot vedea meniul și pot plasa comenzi.`,
      ],
    },
    {
      heading: "2. Rolul nostru și al restaurantului",
      paragraphs: [
        "Fiecare comandă se încheie direct între tine și restaurantul ales. Restaurantul este vânzătorul: el stabilește produsele, prețurile, programul, zonele și taxele de livrare, pregătește și livrează comanda și răspunde de calitatea produselor.",
        "ALL4HORECA furnizează doar instrumentul tehnic prin care comanda ajunge la restaurant și nu este parte în contractul de vânzare.",
      ],
    },
    {
      heading: "3. Contul",
      paragraphs: [
        "Pentru a comanda ai nevoie de un cont, creat cu numărul tău de telefon. La prima autentificare, și apoi pe dispozitive noi, primești un cod prin SMS. Nu folosim parolă.",
        "Ești responsabil de numărul de telefon folosit și de accesul la dispozitivul tău. Dacă pierzi numărul sau dispozitivul, anunță-ne la contact@all4horeca.ro.",
      ],
    },
    {
      heading: "4. Plasarea comenzii, prețuri și plată",
      paragraphs: [
        "Comanda se consideră plasată când apeși butonul de trimitere și ajunge la restaurant. Ea devine obligatorie pentru restaurant abia când o acceptă; vei vedea starea comenzii în aplicație.",
        "Prețurile sunt în lei, cu TVA inclus, și sunt calculate de platformă pe baza prețurilor restaurantului. Reducerile și promoțiile se aplică automat, conform regulilor fiecărui restaurant, și se vede reducerea înainte să trimiți comanda.",
        "Metodele de plată disponibile sunt cele afișate de restaurant la finalizarea comenzii.",
      ],
    },
    {
      heading: "5. Livrare, ridicare și anulare",
      paragraphs: [
        "Timpul de livrare afișat este orientativ. Restaurantul poate refuza sau anula o comandă (de exemplu, produs epuizat sau în afara zonei de livrare) și te informează în aplicație.",
        "Poți cere anularea unei comenzi doar până când restaurantul o acceptă; după acceptare, anularea se face cu acordul restaurantului.",
        "Pentru preparate alimentare făcute la comandă sau care se pot deteriora rapid, legea nu prevede drept de retragere de 14 zile pentru contractele la distanță; dacă primești un produs greșit sau necorespunzător, contactează restaurantul.",
      ],
    },
    {
      heading: "6. Reclamații",
      paragraphs: [
        "Pentru orice problemă cu o comandă, contactează mai întâi restaurantul (datele lui sunt în aplicație). Poți scrie și nouă la contact@all4horeca.ro pentru probleme legate de aplicație.",
        "Ca consumator, te poți adresa și Autorității Naționale pentru Protecția Consumatorilor (anpc.ro).",
      ],
    },
    {
      heading: "7. Utilizare corectă",
      paragraphs: [
        "Nu poți folosi aplicația pentru comenzi false sau abuzive, pentru a încerca să obții acces la datele altor utilizatori sau pentru a o perturba. Putem suspenda conturile care încalcă aceste reguli.",
      ],
    },
    {
      heading: "8. Răspundere",
      paragraphs: [
        "Ne străduim ca aplicația să funcționeze continuu, dar nu garantăm lipsa întreruperilor. Nu răspundem pentru produsele, prețurile sau livrarea restaurantului, care sunt în responsabilitatea acestuia.",
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

export const privacyDocument: LegalDocument = {
  title: "Politica de confidențialitate",
  updated: "08.11.2026",
  sections: [
    {
      heading: "1. Cine prelucrează datele tale",
      paragraphs: [
        `Pentru datele din comenzi, operatorul este restaurantul de la care comanzi; ${OPERATOR} acționează ca împuternicit al restaurantului, furnizând platforma.`,
        "Pentru contul tău și securitatea platformei (autentificare, prevenirea abuzurilor), operatorul este LUCANTO 2020 DISTRIBUTION SRL. Contact pentru date personale: contact@all4horeca.ro.",
      ],
    },
    {
      heading: "2. Ce date prelucrăm",
      paragraphs: [
        "Numărul de telefon (cont și contact pentru comandă), numele pe care îl introduci, adresa de livrare și locația alesă pe hartă, email-ul (dacă îl completezi), istoricul comenzilor, notele către restaurant și, dacă accepți, datele necesare notificărilor din aplicație.",
        "Nu cerem și nu stocăm date de card în aplicație.",
      ],
    },
    {
      heading: "3. De ce folosim datele și pe ce temei",
      paragraphs: [
        "Pentru a crea contul și a-ți trimite codul de autentificare, a transmite și onora comanda, a-ți arăta starea comenzii: executarea contractului (art. 6 alin. 1 lit. b GDPR).",
        "Pentru obligații contabile și fiscale ale restaurantului: obligație legală (art. 6 alin. 1 lit. c).",
        "Pentru securitatea platformei și prevenirea comenzilor false: interes legitim (art. 6 alin. 1 lit. f).",
        "Notificările de stare a comenzii se trimit doar dacă le activezi (consimțământ, art. 6 alin. 1 lit. a); le poți opri oricând.",
      ],
    },
    {
      heading: "4. Cui transmitem datele",
      paragraphs: [
        "Restaurantului la care comanzi, pentru a prepara și livra comanda. Furnizorilor care ne ajută să rulăm aplicația: Supabase (baza de date, servere în Uniunea Europeană), furnizorul de hosting (Netlify sau Cloudflare), furnizorul de SMS pentru codurile de autentificare și Google (hărți pentru adrese).",
        "Nu vindem datele tale și nu le folosim pentru publicitate.",
      ],
    },
    {
      heading: "5. Cât păstrăm datele",
      paragraphs: [
        "Cât timp ai cont activ, plus termenele impuse de lege pentru documentele comerciale și fiscale ale restaurantului. Poți cere ștergerea contului oricând, la contact@all4horeca.ro; datele pe care legea ne obligă să le păstrăm rămân doar cât este necesar.",
      ],
    },
    {
      heading: "6. Drepturile tale",
      paragraphs: [
        "Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, precum și dreptul de a retrage consimțământul. Scrie-ne la contact@all4horeca.ro; răspundem în cel mult 30 de zile.",
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

export const cookiesDocument: LegalDocument = {
  title: "Politica de cookie-uri și stocare locală",
  updated: "08.11.2026",
  sections: [
    {
      heading: "Ce folosim",
      paragraphs: [
        "Folosim doar stocare strict necesară funcționării aplicației: sesiunea de autentificare, coșul de cumpărături, comenzile tale recente afișate pe acest dispozitiv, preferința de a ascunde bannerul de instalare și setările de notificări. Acestea nu necesită consimțământ.",
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
