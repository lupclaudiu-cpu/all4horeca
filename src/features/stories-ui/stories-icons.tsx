import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const PlusIcon = (p: IconProps) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const MinusIcon = (p: IconProps) => <svg {...base} {...p}><path d="M5 12h14" /></svg>;
export const CloseIcon = (p: IconProps) => <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const CheckIcon = (p: IconProps) => <svg {...base} strokeWidth={3} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const ClockIcon = (p: IconProps) => <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
export const SearchIcon = (p: IconProps) => <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>;
export const PhoneIcon = (p: IconProps) => <svg {...base} {...p}><path d="M6 3h3l1.5 4.5-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2L21 15v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z" /></svg>;
export const BagIcon = (p: IconProps) => <svg {...base} {...p}><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
export const HomeIcon = (p: IconProps) => <svg {...base} {...p}><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /></svg>;
export const OrdersIcon = (p: IconProps) => <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
export const UserIcon = (p: IconProps) => <svg {...base} {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>;
export const TruckIcon = (p: IconProps) => <svg {...base} {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>;
export const WalkIcon = (p: IconProps) => <svg {...base} {...p}><circle cx="13" cy="4.5" r="1.8" /><path d="M10 21l2-6 3 3v3M8 12l2-4 4 1 2 3 3 1M12 15l-1-6" /></svg>;
export const ChevronRightIcon = (p: IconProps) => <svg {...base} {...p}><path d="M9 5l7 7-7 7" /></svg>;
export const BellIcon = (p: IconProps) => <svg {...base} {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
export const TrashIcon = (p: IconProps) => <svg {...base} {...p}><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></svg>;
