"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Megaphone, MessageSquare, DollarSign, TrendingUp, UserCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

type Stats = Awaited<ReturnType<typeof api.adminGetStats>>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
};

export default function AdminOverviewPage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api.adminGetStats(accessToken).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  const cards = stats ? [
    { label: "Total Users",       value: stats.totalUsers,       icon: Users,         color: "text-blue-600 bg-blue-50" },
    { label: "Creators",          value: stats.totalCreators,    icon: UserCheck,      color: "text-green-600 bg-green-50" },
    { label: "Brands",            value: stats.totalBrands,      icon: TrendingUp,     color: "text-purple-600 bg-purple-50" },
    { label: "Total Campaigns",   value: stats.totalCampaigns,   icon: Megaphone,      color: "text-orange-600 bg-orange-50" },
    { label: "Active Campaigns",  value: stats.activeCampaigns,  icon: Megaphone,      color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Messages",    value: stats.totalMessages,    icon: MessageSquare,  color: "text-pink-600 bg-pink-50" },
    { label: "Platform Revenue",  value: `$${stats.totalRevenueUsd.toFixed(2)}`, icon: DollarSign, color: "text-yellow-600 bg-yellow-50" },
  ] : [];

  return (
    <div className="p-8">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <motion.div variants={fadeUp} custom={0} className="mb-8">
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform health at a glance</p>
        </motion.div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <motion.div key={c.label} variants={fadeUp} custom={i}
                className="rounded-2xl border bg-card p-5">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-bold">{c.value}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
