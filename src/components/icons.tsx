import type { SVGProps } from "react";
type IconProps = SVGProps<SVGSVGElement>;
const base = {
  fill: "none", stroke: "currentColor", strokeWidth: 2,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24",
};
export const MenuIcon = (props: IconProps) => <svg {...base} {...props}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
export const OrdersIcon = (props: IconProps) => <svg {...base} {...props}><path d="M9 5h6M9 3h6v4H9zM7 5H5v16h14V5h-2M8 12l2 2 5-5M8 18h8" /></svg>;
export const UserIcon = (props: IconProps) => <svg {...base} {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const CartIcon = (props: IconProps) => <svg {...base} {...props}><path d="M3 4h2l2 11h10l3-8H6M9 20h.01M17 20h.01" /></svg>;
export const PlusIcon = (props: IconProps) => <svg {...base} {...props}><path d="M12 5v14M5 12h14" /></svg>;
export const MinusIcon = (props: IconProps) => <svg {...base} {...props}><path d="M5 12h14" /></svg>;
export const CloseIcon = (props: IconProps) => <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
export const ArrowLeftIcon = (props: IconProps) => <svg {...base} {...props}><path d="m15 18-6-6 6-6" /></svg>;
export const ClockIcon = (props: IconProps) => <svg {...base} {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const StarIcon = (props: IconProps) => <svg {...base} {...props}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>;
export const ChevronRightIcon = (props: IconProps) => <svg {...base} {...props}><path d="m9 18 6-6-6-6" /></svg>;
export const DashboardIcon = (props: IconProps) => <svg {...base} {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
export const HistoryIcon = (props: IconProps) => <svg {...base} {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>;
export const ProductsIcon = (props: IconProps) => <svg {...base} {...props}><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 17l8 4 8-4" /></svg>;
export const ChartIcon = (props: IconProps) => <svg {...base} {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
export const PhoneIcon = (props: IconProps) => <svg {...base} {...props}><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-4-2-2 2c-3.5-1.5-6.5-4.5-8-8l2-2-2-4Z" /></svg>;
export const MapPinIcon = (props: IconProps) => <svg {...base} {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></svg>;
export const LogoutIcon = (props: IconProps) => <svg {...base} {...props}><path d="M10 17l5-5-5-5M15 12H3M15 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" /></svg>;
export const SettingsIcon = (props: IconProps) => <svg {...base} {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>;
export const EyeIcon = (props: IconProps) => <svg {...base} {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
