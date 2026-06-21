"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CloseIcon, PlusIcon } from "@/components/icons";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "all4horeca-install-dismissed";

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (standalone || window.localStorage.getItem(DISMISSED_KEY)) return;

    const iosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    const timer = window.setTimeout(() => {
      setIsIos(iosDevice);
      setVisible(true);
    }, 800);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setPromptEvent(null);
      return;
    }

    setShowHelp(true);
  };

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <aside className="fixed bottom-[86px] left-3 right-3 z-30 mx-auto max-w-md rounded-[1.5rem] border border-[#e2e8f0] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.2)]">
        <button
          onClick={dismiss}
          aria-label="Închide"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[#f1f5f9] text-[#64748b]"
        >
          <CloseIcon className="size-4" />
        </button>
        <div className="flex items-center gap-3 pr-7">
          <Image
            src="/icons/icon-192.png"
            width={48}
            height={48}
            alt=""
            className="rounded-xl"
          />
          <div>
            <p className="text-sm font-black">Instalează ALL4HORECA</p>
            <p className="mt-1 text-xs leading-4 text-[#64748b]">
              Acces rapid, direct de pe ecranul principal.
            </p>
          </div>
        </div>
        <button
          onClick={install}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-black text-white"
        >
          <PlusIcon className="size-4" />
          Adaugă pe ecranul principal
        </button>
      </aside>

      {showHelp && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-4 backdrop-blur-sm">
          <button
            className="absolute inset-0"
            onClick={() => setShowHelp(false)}
            aria-label="Închide instrucțiunile"
          />
          <section className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-[#f1f5f9]"
            >
              <CloseIcon className="size-4" />
            </button>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
              {isIos ? "iPhone / iPad" : "Android"}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              Adaugă aplicația în 3 pași
            </h2>
            {isIos ? (
              <ol className="mt-5 space-y-4 text-sm leading-6 text-[#475569]">
                <li><strong className="text-[#0f172a]">1.</strong> Deschide această pagină în Safari.</li>
                <li><strong className="text-[#0f172a]">2.</strong> Apasă butonul Partajează din bara Safari.</li>
                <li><strong className="text-[#0f172a]">3.</strong> Alege „Adăugați la ecranul principal”.</li>
              </ol>
            ) : (
              <ol className="mt-5 space-y-4 text-sm leading-6 text-[#475569]">
                <li><strong className="text-[#0f172a]">1.</strong> Deschide pagina în Chrome.</li>
                <li><strong className="text-[#0f172a]">2.</strong> Apasă meniul cu trei puncte.</li>
                <li><strong className="text-[#0f172a]">3.</strong> Alege „Instalează aplicația” sau „Adaugă pe ecranul principal”.</li>
              </ol>
            )}
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full rounded-xl bg-[#0f172a] px-4 py-3 font-black text-white"
            >
              Am înțeles
            </button>
          </section>
        </div>
      )}
    </>
  );
}
