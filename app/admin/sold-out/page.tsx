"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, Check } from "lucide-react";
import { MENU_CATEGORIES } from "@shared/menu";
import { toast } from "sonner";

export default function SoldOutPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: soldOutIds = [] } = trpc.soldOut.list.useQuery(undefined, { enabled: isAdmin });

  const setSoldOut = trpc.soldOut.set.useMutation({
    onSuccess: () => {
      utils.soldOut.list.invalidate();
      toast.success("Marked as sold out");
    },
  });

  const removeSoldOut = trpc.soldOut.remove.useMutation({
    onSuccess: () => {
      utils.soldOut.list.invalidate();
      toast.success("Back in stock!");
    },
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
        <div className="container flex items-center h-16 gap-3">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground"
            style={{ color: "oklch(0.65 0.04 60)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <span style={{ color: "oklch(0.35 0.02 30)" }}>|</span>
          <Ban className="w-4 h-4" style={{ color: "oklch(0.70 0.20 45)" }} />
          <span
            className="font-black text-lg"
            style={{ fontFamily: "var(--font-bangers), 'Bangers', cursive", letterSpacing: "0.04em", color: "oklch(0.97 0.01 60)" }}
          >
            Sold Out Items
          </span>
        </div>
      </div>

      <div className="container py-6 max-w-3xl">
        {MENU_CATEGORIES.map((cat) => (
          <div key={cat.id} className="mb-8">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <span>{cat.emoji}</span> {cat.name}
            </h3>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const isSoldOut = soldOutIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      background: isSoldOut ? "oklch(0.55 0.18 25 / 0.08)" : "oklch(0.16 0.02 30)",
                      border: `1px solid ${isSoldOut ? "oklch(0.55 0.18 25 / 0.25)" : "oklch(0.28 0.02 30)"}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {isSoldOut && <Ban className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.55 0.18 25)" }} />}
                      <div>
                        <span className={`text-sm font-medium ${isSoldOut ? "line-through opacity-60" : ""} text-foreground`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ${(item.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        isSoldOut
                          ? removeSoldOut.mutate({ menuItemId: item.id })
                          : setSoldOut.mutate({ menuItemId: item.id })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: isSoldOut
                          ? "oklch(0.35 0.10 145 / 0.3)"
                          : "oklch(0.55 0.18 25 / 0.15)",
                        color: isSoldOut
                          ? "oklch(0.70 0.15 145)"
                          : "oklch(0.70 0.12 25)",
                        border: `1px solid ${isSoldOut ? "oklch(0.45 0.12 145 / 0.4)" : "oklch(0.55 0.18 25 / 0.3)"}`,
                      }}
                    >
                      {isSoldOut ? (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Restock</span>
                      ) : (
                        <span className="flex items-center gap-1"><Ban className="w-3 h-3" /> Sold Out</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
