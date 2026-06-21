"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import type { UserRole } from "@/lib/types";

export function ProtectedRoute({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const allowed = Boolean(profile && roles.includes(profile.role));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!allowed) {
      router.replace("/403");
    }
  }, [allowed, loading, profile?.role, router, user]);

  if (loading || !allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-[#2563eb]/20 border-t-[#2563eb]" />
          <p className="mt-4 text-sm font-bold text-[#64748b]">
            Verificăm accesul...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
