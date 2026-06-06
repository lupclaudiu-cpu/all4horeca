"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/icons";
import { useAuth } from "@/features/auth/auth-context";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f4f2]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#171411] px-4 py-4 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-lg font-black">
              ALL4HORECA Admin
            </Link>
            <p className="mt-1 text-[11px] text-white/50">
              {profile?.fullName || profile?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/restaurant/dashboard"
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff5a1f] px-3 py-2 text-xs font-black"
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
