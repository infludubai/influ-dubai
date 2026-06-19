"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

const DASHBOARD_BY_ROLE: Record<string, { href: string; label: string }> = {
  CREATOR: { href: "/wireframes/creator-dashboard", label: "Creator Dashboard" },
  BRAND: { href: "/wireframes/brand-dashboard", label: "Brand Dashboard" },
  AGENCY: { href: "/wireframes/brand-dashboard", label: "Agency Dashboard" },
  ADMIN: { href: "/wireframes/brand-dashboard", label: "Admin Dashboard" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, user, clearSession } = useAuthStore();
  const [status, setStatus] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    api
      .me(accessToken)
      .then((me) => setStatus(me.status))
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [accessToken, router, clearSession]);

  if (!accessToken || !user) return null;

  const targetDashboard = DASHBOARD_BY_ROLE[user.role];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-lg font-bold">InfluDubai AI</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearSession();
            router.push("/");
          }}
        >
          Log out
        </Button>
      </div>

      {status === "PENDING_VERIFICATION" && (
        <Card className="mb-4 border-dashed">
          <CardContent className="flex items-center justify-between gap-4 pt-6 text-sm">
            <span>Your email isn&apos;t verified yet — some features are limited.</span>
            <Button
              size="sm"
              variant="outline"
              disabled={resent}
              onClick={async () => {
                await api.resendVerification(user.email);
                setResent(true);
              }}
            >
              {resent ? "Sent" : "Resend email"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <Badge variant="secondary" className="mb-2 w-fit">
            {user.role}
          </Badge>
          <CardTitle>Welcome back, {user.displayName ?? user.email} 👋</CardTitle>
          <CardDescription>
            Phase 2 authentication is live — full dashboard functionality lands in Phase 3/4.
            For now, here&apos;s the wireframe of where you&apos;re headed:
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {targetDashboard && (
            <Link href={targetDashboard.href} className="flex-1">
              <Button className="w-full">View {targetDashboard.label}</Button>
            </Link>
          )}
          <Link href="/onboarding" className="flex-1">
            <Button variant="outline" className="w-full">
              Edit profile setup
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
