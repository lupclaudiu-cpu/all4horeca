import type { Metadata } from "next";
import { PasswordResetPage } from "@/features/auth/password-reset-page";

export const metadata: Metadata = { title: "Parolă uitată" };

export default function ForgotPasswordPage() {
  return <PasswordResetPage mode="request" />;
}
