"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign, Users, Star, Sparkles, ClipboardList } from "lucide-react";

export default function DashboardPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  const { data: stats } = trpc.dashboard.stats.useQuery({ daysBack: 7 }, { enabled: isAdmin });
  const { data: subCount } = trpc.dashboard.subscriberCount.useQuery(undefined, { enabled: isAdmin });

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Admin access required.</p>
          <Button onClick={() => router.push("/admin/login")}>Login</Button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Orders (7 days)",
      value: stats?.totalOrders ?? 0,
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "oklch(0.62 0.22 38)",
    },
    {
      label: "Revenue (7 days)",
      value: `$${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "oklch(0.65 0.20 145)",
    },
    {
      label: "Email Subscribers",
      value: subCount ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: "oklch(0.60 0.18 260)",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div
        className="sticky top-0 z-40 border-b border-border"
        style={{ background: "oklch(0.12 0.02 30 / 0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground"
              style={{ color: "oklch(0.65 0.04 60)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span style={{ color: "oklch(0.35 0.02 30)" }}>|</span>
            <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.70 0.20 45)" }} />
            <span
              className="font-black text-lg"
              style={{ fontFamily: "var(--font-bangers), 'Bangers', cursive", letterSpacing: "0.04em", color: "oklch(0.97 0.01 60)" }}
            >
              Dashboard
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push("/admin/orders")}
              style={{ background: "oklch(0.20 0.02 30)", color: "oklch(0.75 0.04 60)", border: "1px solid oklch(0.30 0.02 30)" }}>
              <ClipboardList className="w-4 h-4 mr-1" /> Orders
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/admin/specials")}
              style={{ background: "oklch(0.20 0.02 30)", color: "oklch(0.75 0.04 60)", border: "1px solid oklch(0.30 0.02 30)" }}>
              <Sparkles className="w-4 h-4 mr-1" /> Specials
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-4xl">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-5"
              style={{ background: "oklch(0.16 0.02 30)", border: "1px solid oklch(0.28 0.02 30)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `color-mix(in oklch, ${card.color} 20%, transparent)`, color: card.color }}
                >
                  {card.icon}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</span>
              </div>
              <p className="text-3xl font-black" style={{ fontFamily: "var(--font-bangers), 'Bangers', cursive", color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Daily breakdown */}
        {stats?.dailyStats && stats.dailyStats.length > 0 && (
          <div className="rounded-2xl p-5 mb-8" style={{ background: "oklch(0.16 0.02 30)", border: "1px solid oklch(0.28 0.02 30)" }}>
            <h3 className="font-bold text-foreground mb-4">Daily Breakdown</h3>
            <div className="space-y-2">
              {stats.dailyStats.map((day) => (
                <div key={day.date} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(day.date + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground font-semibold">{day.orders} orders</span>
                    <span className="font-bold" style={{ color: "oklch(0.65 0.20 145)" }}>${(day.revenue / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular items */}
        {stats?.popularItems && stats.popularItems.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: "oklch(0.16 0.02 30)", border: "1px solid oklch(0.28 0.02 30)" }}>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: "oklch(0.82 0.18 75)" }} />
              Top Sellers (7 days)
            </h3>
            <div className="space-y-2">
              {stats.popularItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                      style={{
                        background: i < 3 ? "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))" : "oklch(0.25 0.02 30)",
                        color: i < 3 ? "white" : "oklch(0.65 0.04 60)",
                      }}>
                      {i + 1}
                    </span>
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold text-muted-foreground">{item.count} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
