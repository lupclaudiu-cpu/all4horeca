import Link from "next/link";

export function StatusPage({
  code,
  title,
  description,
}: {
  code: "403" | "404";
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8fafc] px-5 py-12">
      <section className="w-full max-w-xl rounded-[2rem] bg-white p-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="mx-auto grid size-20 place-items-center rounded-[1.5rem] bg-[#ecfeff] text-2xl font-black text-[#2563eb]">
          {code}
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#2563eb]">
          ALL4HORECA by ANTORIA
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#64748b]">
          {description}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-[#2563eb] px-6 py-4 text-sm font-black text-white"
          >
            Aplicația client
          </Link>
          <Link
            href="/login"
            className="rounded-2xl bg-[#0f172a] px-6 py-4 text-sm font-black text-white"
          >
            Autentificare
          </Link>
        </div>
      </section>
    </main>
  );
}
