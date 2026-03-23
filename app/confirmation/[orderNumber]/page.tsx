"use client";

import { use, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MapPin, Phone, ChevronRight, Loader2, ChefHat, Share2 } from "lucide-react";
import { toast } from "sonner";
import { OrderQR } from "@/components/OrderQR";

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = trpc.orders.get.useQuery(
    { orderNumber: orderNumber ?? "" },
    {
      enabled: !!orderNumber,
      refetchInterval: (query) => {
        const status = query.state.data?.order?.status;
        if (status === "completed" || status === "cancelled") return false;
        return 10_000; // Poll every 10s while active
      },
    }
  );

  const { data: pendingCount } = trpc.orders.pendingCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  // Sound + vibration on status change
  const prevStatus = useRef<string | null>(null);
  useEffect(() => {
    if (!data?.order) return;
    const status = data.order.status;
    if (prevStatus.current && prevStatus.current !== status) {
      // Vibrate on status change
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      // Show toast
      if (status === "preparing") {
        toast("Your order is being prepared!", {
          icon: "👨‍🍳",
          style: { background: "oklch(0.18 0.015 30)", border: "1px solid oklch(0.62 0.22 38 / 0.5)", color: "oklch(0.97 0.01 60)" },
        });
      } else if (status === "ready") {
        toast.success("Your order is ready for pickup!", {
          icon: "✅",
          duration: 10000,
          style: { background: "oklch(0.18 0.015 30)", border: "1px solid oklch(0.45 0.15 145 / 0.5)", color: "oklch(0.97 0.01 60)" },
        });
      }
    }
    prevStatus.current = status;
  }, [data?.order?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-bold text-foreground">Order not found</h2>
        <Button
          onClick={() => router.push("/")}
          style={{
            background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
            color: "white",
          }}
          className="rounded-xl h-11 px-6 font-bold"
        >
          Back to Menu
        </Button>
      </div>
    );
  }

  const { order, items } = data;

  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--color-background)" }}>
      <div
        className="py-10 px-4 text-center"
        style={{
          background: "linear-gradient(160deg, oklch(0.16 0.03 30) 0%, oklch(0.12 0.02 25) 100%)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: "oklch(0.62 0.22 38 / 0.15)",
            border: "2px solid oklch(0.62 0.22 38 / 0.4)",
          }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: "oklch(0.62 0.22 38)" }} />
        </div>
        <h1
          className="text-3xl sm:text-4xl font-black mb-2"
          style={{
            fontFamily: "var(--font-bangers), 'Bangers', cursive",
            letterSpacing: "0.04em",
            color: "oklch(0.97 0.01 60)",
          }}
        >
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground text-base mb-1">
          Thanks, <span className="text-foreground font-semibold">{order.customerName}</span>! Your
          order is being prepared.
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mt-3"
          style={{
            background: "oklch(0.62 0.22 38 / 0.15)",
            color: "oklch(0.80 0.15 45)",
            border: "1px solid oklch(0.62 0.22 38 / 0.3)",
          }}
        >
          Order #{order.orderNumber}
        </div>

        {/* Live Status Tracker */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {(["pending", "preparing", "ready"] as const).map((step, i) => {
            const steps = ["pending", "preparing", "ready"];
            const currentIdx = steps.indexOf(order.status);
            const stepIdx = i;
            const isActive = stepIdx <= currentIdx;
            const isCurrent = step === order.status;
            const icons = { pending: Clock, preparing: ChefHat, ready: CheckCircle2 };
            const labels = { pending: "Received", preparing: "Preparing", ready: "Ready!" };
            const Icon = icons[step];

            return (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && (
                  <div className="w-8 h-0.5 rounded-full" style={{ background: isActive ? "oklch(0.62 0.22 38)" : "oklch(0.28 0.02 30)" }} />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isCurrent ? "animate-pulse" : ""}`}
                    style={{
                      background: isActive
                        ? step === "ready" ? "oklch(0.45 0.15 145)" : "oklch(0.62 0.22 38)"
                        : "oklch(0.22 0.02 30)",
                      color: isActive ? "white" : "oklch(0.50 0.04 60)",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold" style={{ color: isActive ? "oklch(0.85 0.04 60)" : "oklch(0.50 0.04 60)" }}>
                    {labels[step]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated wait */}
        {order.status !== "ready" && order.status !== "completed" && pendingCount != null && pendingCount > 0 && (
          <p className="text-sm mt-4" style={{ color: "oklch(0.75 0.04 60)" }}>
            Estimated wait: ~{Math.max(5, pendingCount * 8)} min ({pendingCount} order{pendingCount > 1 ? "s" : ""} ahead)
          </p>
        )}
      </div>

      <div className="container py-6">
        <div className="max-w-lg mx-auto space-y-5">
          <div
            className="rounded-2xl p-5"
            style={{
              background: "oklch(0.62 0.22 38 / 0.1)",
              border: "1px solid oklch(0.62 0.22 38 / 0.3)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5" style={{ color: "oklch(0.62 0.22 38)" }} />
              <h2 className="font-bold text-foreground">Pickup Details</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup Time</span>
                <span className="font-bold text-foreground">{order.pickupTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-foreground">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-semibold text-foreground">{order.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <OrderQR orderNumber={order.orderNumber} />

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-bold text-foreground">Your Order</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-foreground">
                    <span className="font-semibold text-primary mr-1">{item.quantity}x</span>
                    {item.itemName}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
              {order.notes && (
                <div className="pt-2 border-t border-border text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Notes: </span>
                  {order.notes}
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-black text-xl" style={{ color: "oklch(0.62 0.22 38)" }}>
                  ${(order.totalCents / 100).toFixed(2)} CAD
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Payment due at pickup</p>
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.62 0.22 38 / 0.15)", color: "oklch(0.62 0.22 38)" }}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground mb-0.5">Pick Up At</p>
                <p className="text-muted-foreground text-sm">45 Dundas Street, Deseronto, ON</p>
                <p className="text-muted-foreground text-sm">Thu–Sun · 11:00 AM – 7:00 PM</p>
                <a
                  href="https://maps.google.com/?q=45+Dundas+Street+Deseronto+Ontario"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:underline"
                  style={{ color: "oklch(0.62 0.22 38)" }}
                >
                  Get Directions
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.62 0.22 38 / 0.15)", color: "oklch(0.62 0.22 38)" }}
              >
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Questions about your order?</p>
                <p className="text-muted-foreground text-sm">(613) 328-4766</p>
              </div>
            </div>
            <a
              href="tel:6133284766"
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: "oklch(0.62 0.22 38 / 0.15)",
                color: "oklch(0.80 0.15 45)",
                border: "1px solid oklch(0.62 0.22 38 / 0.3)",
              }}
            >
              Call
            </a>
          </div>

          {/* Share */}
          <button
            onClick={async () => {
              const text = `Just ordered from The Stoned Chef! 🍔🔥 Best chip truck in Deseronto. Order #${order.orderNumber}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: "The Stoned Chef", text });
                } catch {}
              } else {
                await navigator.clipboard.writeText(text);
                toast.success("Copied to clipboard!");
              }
            }}
            className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{
              background: "oklch(0.62 0.22 38 / 0.12)",
              color: "oklch(0.80 0.15 45)",
              border: "1px solid oklch(0.62 0.22 38 / 0.3)",
            }}
          >
            <Share2 className="w-4 h-4" />
            Share Your Order
          </button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full h-12 rounded-xl font-bold border-border text-foreground hover:bg-secondary"
          >
            Order Something Else
          </Button>
        </div>
      </div>
    </div>
  );
}
