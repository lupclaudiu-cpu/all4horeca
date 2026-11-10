import type { Metadata } from "next";
import { PasswordResetPage } from "@/features/auth/password-reset-page";

export const metadata: Metadata = { title: "Parolă nouă" };

export default function ResetPasswordPage() {
  return <PasswordResetPage mode="update" />;
}
