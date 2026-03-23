"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, ChefHat, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "oklch(0.82 0.18 75)", icon: Clock },
  preparing: { label: "Preparing", color: "oklch(0.62 0.22 38)", icon: ChefHat },
  ready: { label: "Ready", color: "oklch(0.65 0.20 145)", icon: CheckCircle2 },
  completed: { label: "Done", color: "oklch(0.55 0.04 60)", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "oklch(0.55 0.18 25)", icon: XCircle },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

export default function AdminOrdersPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: orders, isLoading } = trpc.orders.recent.useQuery(undefined, { enabled: isAdmin });

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      utils.orders.recent.invalidate();
      toast.success(`Order updated to ${vars.status}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => router.push("/admin/login")}>Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div
        className="sticky top-0 z-40 border-b border-border"
        style={{ background: "oklch(0.12 0.02 30 / 0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground"
              style={{ color: "oklch(0.65 0.04 60)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <span style={{ color: "oklch(0.35 0.02 30)" }}>|</span>
            <ClipboardList className="w-4 h-4" style={{ color: "oklch(0.70 0.20 45)" }} />
            <span
              className="font-black text-lg"
              style={{ fontFamily: "var(--font-bangers), 'Bangers', cursive", letterSpacing: "0.04em", color: "oklch(0.97 0.01 60)" }}
            >
              Orders
            </span>
          </div>
        </div>
      </div>

      <div className="container py-6 max-w-3xl">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading orders...</p>
        ) : !orders || orders.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "oklch(0.16 0.02 30)", border: "1px dashed oklch(0.30 0.02 30)" }}>
            <p className="text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const nextStatus = NEXT_STATUS[order.status];

              return (
                <div
                  key={order.id}
                  className="rounded-2xl p-4"
                  style={{ background: "oklch(0.16 0.02 30)", border: "1px solid oklch(0.28 0.02 30)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground">#{order.orderNumber}</span>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: `color-mix(in oklch, ${config.color} 20%, transparent)`,
                            color: config.color,
                            border: `1px solid color-mix(in oklch, ${config.color} 40%, transparent)`,
                          }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{order.customerName} · {order.customerPhone}</p>
                      <p className="text-xs text-muted-foreground">Pickup: {order.pickupTime} · {new Date(order.createdAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className="font-black text-lg" style={{ fontFamily: "var(--font-bangers), 'Bangers', cursive", color: "oklch(0.70 0.20 45)" }}>
                      ${(order.totalCents / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    {order.items.map((item) => `${item.quantity}x ${item.itemName}`).join(" · ")}
                    {order.notes && <span className="block mt-1 text-foreground italic">Notes: {order.notes}</span>}
                  </div>

                  {nextStatus && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ orderNumber: order.orderNumber, status: nextStatus as "preparing" | "ready" | "completed" })}
                        disabled={updateStatus.isPending}
                        style={{
                          background: `linear-gradient(135deg, ${STATUS_CONFIG[nextStatus as keyof typeof STATUS_CONFIG]?.color || config.color}, ${config.color})`,
                          color: "white",
                        }}
                      >
                        Mark as {STATUS_CONFIG[nextStatus as keyof typeof STATUS_CONFIG]?.label}
                      </Button>
                      {order.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ orderNumber: order.orderNumber, status: "cancelled" })}
                          disabled={updateStatus.isPending}
                          style={{ background: "oklch(0.20 0.02 30)", color: "oklch(0.55 0.18 25)", border: "1px solid oklch(0.35 0.08 25)" }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
