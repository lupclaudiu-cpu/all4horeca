"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronRightIcon,
  ClockIcon,
  LogoutIcon,
  OrdersIcon,
  UserIcon,
} from "@/components/icons";
import { useAuth } from "@/features/auth/auth-context";
import {
  getLocalCustomerProfile,
  saveLocalCustomerProfile,
  type SavedCustomerProfile,
} from "@/services/customer-profile-service";

const settings = [
  {
    label: "Date personale",
    detail: "Nume, telefon și email",
    icon: UserIcon,
    href: "/cont/date-personale",
  },
  {
    label: "Adrese salvate",
    detail: "Adresele tale de livrare",
    icon: ClockIcon,
    href: "/cont/adrese",
  },
  {
    label: "Notificări",
    detail: "Comenzi și oferte de la restaurant",
    icon: OrdersIcon,
    href: "/cont/notificari",
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [localProfile, setLocalProfile] =
    useState<SavedCustomerProfile | null>(null);
  const [draftProfile, setDraftProfile] = useState({
    name: "",
    phone: "",
  });
  const [localProfileLoaded, setLocalProfileLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const renderLoading = !localProfileLoaded && !profile;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const profile = getLocalCustomerProfile();
      setLocalProfile(profile);
      setDraftProfile({
        name: profile?.name ?? "",
        phone: profile?.phone ?? "",
      });
      setLocalProfileLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const logout = async () => {
    await signOut();
    router.replace("/");
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.info("[DEBUG]", {
      component: "AccountPage",
      authLoading: loading,
      localProfileLoaded,
      renderLoading,
      hasLocalProfile: Boolean(localProfile),
      hasAuthProfile: Boolean(profile),
      user: user?.email ?? user?.id ?? null,
      renderedName: localProfile?.name || profile?.fullName || "Client ANTORIA",
      renderedContact:
        localProfile?.phone || localProfile?.email || profile?.email || "",
    });
  }, [
    loading,
    localProfile,
    localProfileLoaded,
    profile,
    renderLoading,
    user?.email,
    user?.id,
  ]);

  if (renderLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 pb-28 pt-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
            Profil client
          </p>
          {process.env.NODE_ENV === "development" && (
            <RenderDebugBox
              rows={[
                ["Loading", String(loading)],
                ["Render loading", String(renderLoading)],
                ["Local loaded", String(localProfileLoaded)],
                ["Local profile", String(Boolean(localProfile))],
                ["Auth profile", String(Boolean(profile))],
                ["Rendered name", "Client ANTORIA"],
                ["Rendered contact", "-"],
              ]}
            />
          )}
          <div className="mt-4 rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <p className="mt-4 text-sm font-bold text-slate-500">
              Încărcăm datele contului...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    console.warn(
      "[ANTORIA data-flow] Auth is still loading, rendering local customer profile.",
    );
  }

  const displayName =
    localProfile?.name || profile?.fullName || "Client ANTORIA";
  const displayContact =
    localProfile?.phone || localProfile?.email || profile?.email || "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const missingLocalProfile = !localProfile?.name || !localProfile?.phone;

  const saveProfile = () => {
    const nextProfile: SavedCustomerProfile = {
      name: draftProfile.name.trim(),
      phone: draftProfile.phone.trim(),
      email: localProfile?.email ?? "",
      address: localProfile?.address ?? "",
    };
    saveLocalCustomerProfile(nextProfile);
    setLocalProfile(nextProfile);
    setSavedMessage("Datele au fost salvate pentru checkout rapid.");
    window.setTimeout(() => setSavedMessage(""), 2500);
  };

  return (
    <main className="page-enter min-h-screen bg-slate-50 pb-28">
      <div className="bg-slate-950 px-5 pb-20 pt-9 text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            Profil client
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-[-0.05em]">
            Contul meu
          </h1>
        </div>
      </div>

      <div className="mx-auto -mt-12 max-w-3xl px-5 sm:px-8">
        {process.env.NODE_ENV === "development" && (
          <RenderDebugBox
            rows={[
              ["Loading", String(loading)],
              ["Render loading", String(renderLoading)],
              ["Local loaded", String(localProfileLoaded)],
              ["Local profile", String(Boolean(localProfile))],
              ["Auth profile", String(Boolean(profile))],
              ["Rendered name", displayName],
              ["Rendered contact", displayContact || "-"],
            ]}
          />
        )}
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black">{displayName}</h2>
              <p className="mt-1 truncate text-sm text-slate-500">
                {displayContact || "Completează datele pentru checkout rapid"}
              </p>
            </div>
          </div>
          {!user && (
            <p className="mt-5 rounded-xl bg-cyan-50 px-4 py-3 text-xs font-bold leading-5 text-cyan-800">
              Datele sunt păstrate pe acest dispozitiv. Autentificarea va
              sincroniza profilul pe toate dispozitivele.
            </p>
          )}
          {missingLocalProfile && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black">Completează profilul rapid</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Numele și telefonul vor fi completate automat la checkout.
              </p>
              <div className="mt-4 grid gap-3 min-[390px]:grid-cols-2">
                <label>
                  <span className="text-xs font-black text-slate-500">
                    Nume
                  </span>
                  <input
                    value={draftProfile.name}
                    onChange={(event) =>
                      setDraftProfile((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Numele tău"
                  />
                </label>
                <label>
                  <span className="text-xs font-black text-slate-500">
                    Telefon
                  </span>
                  <input
                    value={draftProfile.phone}
                    onChange={(event) =>
                      setDraftProfile((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    inputMode="tel"
                    placeholder="07..."
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={saveProfile}
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
              >
                Salvează datele
              </button>
              {savedMessage && (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  {savedMessage}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
          {settings.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-4 p-5 text-left ${
                  index !== settings.length - 1 ?
                     "border-b border-slate-200"
                    : ""
                }`}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-cyan-50 text-blue-600">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {item.detail}
                  </span>
                </span>
                <ChevronRightIcon className="size-5 text-slate-400" />
              </Link>
            );
          })}
        </section>

        {!user ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-blue-600 px-5 py-4 text-center text-sm font-black text-white"
            >
              Autentificare
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white"
            >
              Cont client
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-4 text-sm font-black text-red-700"
          >
            <LogoutIcon className="size-5" />
            Ieșire din cont
          </button>
        )}
      </div>
    </main>
  );
}

function RenderDebugBox({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-300 bg-white p-3 text-[11px] font-bold text-slate-700">
      <p className="text-xs font-black text-blue-700">RENDER DEBUG</p>
      <dl className="mt-2 grid grid-cols-2 gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-slate-400">{label}</dt>
            <dd className="truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
