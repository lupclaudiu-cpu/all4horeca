"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, OrdersIcon, UserIcon } from "@/components/icons";

const items = [
  { href: "/", label: "Meniu", icon: MenuIcon },
  { href: "/comenzi", label: "Comenzi", icon: OrdersIcon },
  { href: "/cont", label: "Cont", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[#eee9e4] bg-white/95 px-4 pt-2 backdrop-blur-xl md:left-1/2 md:max-w-6xl md:-translate-x-1/2">
      <div className="mx-auto grid max-w-lg grid-cols-3">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-bold transition ${active ? "text-[#ff5a1f]" : "text-[#8b8580]"}`}>
              <Icon className="size-6" />{item.label}
              {active && <span className="absolute -top-2 h-1 w-8 rounded-full bg-[#ff5a1f]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
