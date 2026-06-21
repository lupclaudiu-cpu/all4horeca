"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/icons";
import { useAuth } from "@/features/auth/auth-context";
import { AntoriaBrand } from "@/components/antoria-brand";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="antoria-gradient sticky top-0 z-40 border-b border-white/5 px-4 py-4 text-white shadow-xl shadow-slate-950/10 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <Link href="/admin"><AntoriaBrand inverse /></Link>
            <p className="mt-1 text-[11px] text-white/50">
              {profile?.fullName || profile?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/restaurant/dashboard"
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur transition hover:bg-white/15"
            >
              Panou restaurant
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-2 text-xs font-black shadow-lg shadow-blue-950/20"
            >
              <LogoutIcon className="size-4" />
              Ieșire
            </button>
          </div>
        </div>
      </header>
      <main className="px-4 py-7 sm:px-8">{children}</main>
    </div>
  );
}
