import Link from "next/link";
import type { LegalDocument } from "@/lib/legal-content";

export function LegalPage({
  doc,
  basePath,
}: {
  doc: LegalDocument;
  /** Pentru pagini legale ale unui restaurant: /clienti/<slug>. Fără: documentele platformei. */
  basePath?: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 text-slate-800">
      <Link href={basePath ?? "/"} className="text-sm font-bold text-cyan-800 underline">
        ← Înapoi la meniu
      </Link>
      <h1 className="mt-4 text-2xl font-black text-slate-950">{doc.title}</h1>
      <p className="mt-1 text-xs text-slate-600">Ultima actualizare: {doc.updated}</p>
      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-6">
          <h2 className="text-lg font-black text-slate-950">{section.heading}</h2>
          {section.paragraphs.map((text) => (
            <p key={text} className="mt-2 text-sm leading-6">
              {text}
            </p>
          ))}
        </section>
      ))}
      <nav aria-label="Pagini legale" className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-sm font-bold">
        <Link href={`${basePath ?? ""}/termeni`} className="underline">Termeni și condiții</Link>
        <Link href={`${basePath ?? ""}/confidentialitate`} className="underline">Confidențialitate</Link>
        <Link href={`${basePath ?? ""}/cookie-uri`} className="underline">Cookie-uri</Link>
      </nav>
    </main>
  );
}
