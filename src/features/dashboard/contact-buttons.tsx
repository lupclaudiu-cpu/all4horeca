import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
} from "@/lib/contact";

export function ContactButtons() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a
        href={CONTACT_PHONE_HREF}
        className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
      >
        Sună: {CONTACT_PHONE_DISPLAY}
      </a>
      <a
        href={CONTACT_EMAIL_HREF}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-900"
      >
        {CONTACT_EMAIL}
      </a>
    </div>
  );
}
