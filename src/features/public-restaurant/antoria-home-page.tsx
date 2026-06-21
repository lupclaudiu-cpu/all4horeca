"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ChartIcon,
  DashboardIcon,
  OrdersIcon,
  PhoneIcon,
  ProductsIcon,
  StarIcon,
} from "@/components/icons";
import { AntoriaBrand } from "@/components/antoria-brand";

const benefits = [
  {
    title: "Aplicație proprie restaurant",
    text: "Fiecare restaurant primește propriul link, propria experiență client și branding dedicat.",
    icon: DashboardIcon,
  },
  {
    title: "Comenzi online directe",
    text: "Primești comenzi fără marketplace și fără comision pe fiecare comandă.",
    icon: OrdersIcon,
  },
  {
    title: "Promoții și notificări",
    text: "Activezi campanii, oferte și notificări pentru clienții restaurantului.",
    icon: StarIcon,
  },
  {
    title: "Rapoarte și statistici",
    text: "Vezi vânzări, produse populare, clienți recurenți și performanță operațională.",
    icon: ChartIcon,
  },
  {
    title: "QR Menu",
    text: "Generezi QR pentru mese, vitrină, social media sau materiale print.",
    icon: ProductsIcon,
  },
  {
    title: "Livrare și pickup",
    text: "Configurezi zone de livrare, praguri gratuite, ridicare din locație și program.",
    icon: PhoneIcon,
  },
];

const steps = [
  "Creezi cont restaurant",
  "Configurezi meniul",
  "Primești comenzi",
  "Crești vânzările",
];

const featureCards = [
  "Aplicație client",
  "Dashboard owner",
  "Promoții",
  "Rapoarte",
  "Administrare produse",
  "Gestionare comenzi",
];

const faqs = [
  {
    question: "Cum funcționează?",
    answer:
      "Restaurantul primește o aplicație proprie pentru comenzi online, iar comenzile ajung direct în dashboard.",
  },
  {
    question: "Pot folosi propriul meu domeniu?",
    answer:
      "Da. Platforma este pregătită pentru domeniu sau subdomeniu dedicat restaurantului.",
  },
  {
    question: "Există perioadă de test?",
    answer:
      "Da. Poți începe cu trial gratuit 7 zile, fără obligații și fără comisioane pe comandă.",
  },
  {
    question: "Pot primi comenzi fără Glovo?",
    answer:
      "Da. ALL4HORECA este gândit pentru comenzi directe, unde clientul comandă de la restaurant.",
  },
  {
    question: "Cum configurez meniul?",
    answer:
      "Adaugi categorii, produse, poze, prețuri, promoții și opțiuni direct din dashboard.",
  },
];

export function AntoriaHomePage() {
  const [submitted, setSubmitted] = useState(false);

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <AntoriaBrand inverse />
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-300 md:flex">
            <a href="#beneficii" className="hover:text-white">
              Beneficii
            </a>
            <a href="#preturi" className="hover:text-white">
              Prețuri
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </nav>
          <Link
            href="/owner/register"
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 px-4 py-2.5 text-xs font-black shadow-lg shadow-blue-950/30 transition hover:brightness-110"
          >
            Începe gratuit
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:py-24">
        <div className="absolute -right-24 top-10 size-96 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -left-24 bottom-0 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              ALL4HORECA <span className="text-white/45">by ANTORIA</span>
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.06em] min-[390px]:text-5xl sm:text-6xl lg:text-7xl">
              Primește comenzi direct. Fără comisioane pe comandă.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              ALL4HORECA este platforma completă pentru restaurante: comenzi
              online, aplicație client, dashboard, promoții și rapoarte.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
              <Link
                href="/owner/register"
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 px-6 py-4 text-center text-sm font-black shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Începe gratuit 7 zile
              </Link>
              <Link
                href="/demo/restaurante"
                className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center text-sm font-black backdrop-blur transition hover:bg-white/15"
              >
                Vezi demonstrația
              </Link>
            </div>
            <p className="mt-5 text-sm font-bold text-slate-400">
              Pentru fast-food, burger, pizza, cafenele, bistro și takeaway.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-blue-950/30 backdrop-blur sm:rounded-[2.4rem] sm:p-4">
            <div className="rounded-[2rem] bg-slate-100 p-4 text-slate-950">
              <div className="rounded-[1.6rem] bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-blue-600">
                      Comenzi azi
                    </p>
                    <p className="mt-1 text-3xl font-black">48</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">
                    +22%
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-4 items-end gap-2">
                  {[38, 64, 46, 82, 55, 90, 72, 100].map((height, index) => (
                    <span
                      key={index}
                      className="rounded-t-xl bg-gradient-to-t from-blue-700 to-cyan-300"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MockCard title="Comandă nouă" value="127 RON" />
                <MockCard title="Top produs" value="Burger Crispy" />
                <MockCard title="Livrare" value="32 min" />
                <MockCard title="Promoții active" value="4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficii" className="bg-white px-5 py-16 text-slate-950 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Beneficii"
            title="Tot ce ai nevoie ca să vinzi direct."
            text="Platformă completă pentru restaurante care vor control, date și relație directă cu clientul."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article
                  key={benefit.title}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:border-blue-200"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-600/20">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-black">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {benefit.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            inverse
            eyebrow="Cum funcționează"
            title="Din prima zi la comenzi directe."
            text="Proces simplu, gândit pentru restaurante care vor să se miște rapid."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <article
                key={step}
                className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-xl shadow-slate-950/10"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-cyan-400 text-sm font-black text-slate-950">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-black">{step}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-16 text-slate-950 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Funcționalități"
            title="O suită completă pentru operațiuni și creștere."
            text="Website-ul clientului, dashboard-ul restaurantului și instrumentele comerciale lucrează împreună."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <article
                key={feature}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]"
              >
                <div className="h-44 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-700 p-5">
                  <div className="h-full rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="h-3 w-24 rounded-full bg-cyan-300/70" />
                    <div className="mt-5 grid gap-2">
                      <div className="h-7 rounded-xl bg-white/20" />
                      <div className="h-7 w-3/4 rounded-xl bg-white/10" />
                      <div className="h-7 w-1/2 rounded-xl bg-white/10" />
                    </div>
                    <span className="mt-5 block h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-300" />
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                    Modul {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-black">{feature}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="preturi" className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionTitle
            inverse
            eyebrow="Prețuri"
            title="Cost predictibil. Zero comision pe comandă."
            text="Model simplu pentru restaurante care vor să păstreze marja în business."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PriceCard title="Trial gratuit" price="7 zile" text="Testezi platforma cu meniu, comenzi și dashboard." />
            <PriceCard title="Implementare" price="499 lei" text="Configurare inițială, structură și lansare restaurant." highlighted />
            <PriceCard title="Abonament" price="299 lei/lună" text="Platformă completă, fără comisioane pe comandă." />
          </div>
          <p className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-center text-sm font-black text-cyan-100">
            Fără comisioane pe comandă.
          </p>
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-slate-950 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <SectionTitle
            eyebrow="Întrebări frecvente"
            title="Clar înainte să începi."
            text="Răspunsuri rapide pentru proprietari și manageri de restaurant."
          />
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="font-black">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Contact
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              Solicită o demonstrație pentru restaurantul tău.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              Completează datele și echipa ANTORIA te poate ajuta să vezi cum
              ar arăta aplicația restaurantului tău în ALL4HORECA.
            </p>
          </div>
          <form
            onSubmit={submitLead}
            className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <LeadField label="Nume" name="name" />
              <LeadField label="Restaurant" name="restaurant" />
              <LeadField label="Telefon" name="phone" type="tel" />
              <LeadField label="Email" name="email" type="email" />
            </div>
            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:brightness-110"
            >
              Solicită o demonstrație
            </button>
            {submitted && (
              <p className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200">
                Cererea a fost pregătită. Integrarea cu CRM/email poate fi
                conectată în etapa următoare.
              </p>
            )}
          </form>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AntoriaBrand inverse />
          <p className="text-sm font-bold text-slate-400">
            ALL4HORECA by ANTORIA · Software pentru restaurante independente.
          </p>
        </div>
      </footer>
    </main>
  );
}

function MockCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  text,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  inverse?: boolean;
}) {
  return (
    <div>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${inverse ? "text-cyan-300" : "text-blue-600"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-5xl ${inverse ? "text-white" : "text-slate-950"}`}>
        {title}
      </h2>
      <p className={`mt-4 max-w-2xl text-sm leading-7 ${inverse ? "text-slate-300" : "text-slate-500"}`}>
        {text}
      </p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  text,
  highlighted = false,
}: {
  title: string;
  price: string;
  text: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`rounded-[2rem] p-6 shadow-xl ${
        highlighted
          ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-blue-950/30"
          : "border border-white/10 bg-white/[0.07] text-white"
      }`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-4 text-4xl font-black tracking-[-0.05em]">{price}</p>
      <p className={`mt-4 text-sm leading-6 ${highlighted ? "text-blue-50" : "text-slate-300"}`}>
        {text}
      </p>
    </article>
  );
}

function LeadField({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
      />
    </label>
  );
}
