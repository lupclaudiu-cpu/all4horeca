"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  ClockIcon,
  LogoutIcon,
  OrdersIcon,
  UserIcon,
} from "@/components/icons";
import { useAuth } from "@/features/auth/auth-context";

const settings = [
  { label: "Date personale", detail: "Nume, telefon și email", icon: UserIcon },
  { label: "Adrese salvate", detail: "Adresele tale de livrare", icon: ClockIcon },
  { label: "Preferințe comenzi", detail: "Alergeni și observații", icon: OrdersIcon },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  const logout = async () => {
    await signOut();
    router.replace("/");
  };

  if (loading) {
    return <main className="min-h-screen animate-pulse bg-[#fff9f3]" />;
  }

  if (!user || !profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff9f3] px-5 pb-28 text-center">
        <div>
          <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-[#fff1e9] text-[#ff5a1f]">
            <UserIcon className="size-9" />
          </div>
          <h1 className="mt-5 text-3xl font-black">Contul tău ALL4HORECA</h1>
          <p className="mt-2 text-sm text-[#7a746e]">
            Autentifică-te pentru a vedea profilul și comenzile asociate.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="rounded-xl bg-[#ff5a1f] px-5 py-3 text-sm font-black text-white">
              Autentificare
            </Link>
            <Link href="/register" className="rounded-xl bg-[#171411] px-5 py-3 text-sm font-black text-white">
              Cont nou
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initials = (profile.fullName || profile.email)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="page-enter min-h-screen bg-[#fff9f3] pb-28">
      <div className="bg-[#171411] px-5 pb-20 pt-9 text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb899]">
            {roleLabel(profile.role)}
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-[-0.05em]">Contul meu</h1>
        </div>
      </div>
      <div className="mx-auto -mt-12 max-w-3xl px-5 sm:px-8">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_rgba(24,18,12,0.12)]">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-[#ff5a1f] text-xl font-black text-white">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-black">{profile.fullName || "Utilizator"}</h2>
              <p className="mt-1 text-sm text-[#7a746e]">{profile.email}</p>
            </div>
          </div>
          {profile.role !== "customer" && (
            <Link
              href={profile.role === "super_admin" ? "/admin" : "/restaurant/dashboard"}
              className="mt-5 block rounded-xl bg-[#171411] px-4 py-3 text-center text-xs font-black text-white"
            >
              {profile.role === "super_admin" ? "Deschide Admin" : "Deschide Dashboard"}
            </Link>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-[0_14px_40px_rgba(24,18,12,0.07)]">
          {settings.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-4 p-5 text-left ${
                  index !== settings.length - 1 ? "border-b border-[#eee9e4]" : ""
                }`}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[#fff1e9] text-[#ff5a1f]">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className="mt-1 block text-xs text-[#8b8580]">{item.detail}</span>
                </span>
                <ChevronRightIcon className="size-5 text-[#aaa39d]" />
              </button>
            );
          })}
        </section>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-4 text-sm font-black text-red-700"
        >
          <LogoutIcon className="size-5" />
          Ieșire din cont
        </button>
      </div>
    </main>
  );
}

function roleLabel(role: "customer" | "restaurant_owner" | "super_admin") {
  if (role === "super_admin") return "Super Admin";
  if (role === "restaurant_owner") return "Restaurant Owner";
  return "Client ALL4HORECA";
}
