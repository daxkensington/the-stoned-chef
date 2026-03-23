"use client";

import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { Plus, Flame, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function DailySpecials() {
  const { data: specials, isLoading } = trpc.specials.list.useQuery();
  const { addItem } = useCart();

  if (isLoading) return null;
  if (!specials || specials.length === 0) return null;

  const handleAdd = (special: { id: number; title: string; priceCents: number | null }) => {
    if (!special.priceCents) {
      toast.info("Ask us about pricing for this special!", { duration: 2000 });
      return;
    }
    addItem({
      id: `special-${special.id}`,
      name: special.title,
      category: "specials",
      priceCents: special.priceCents,
    });
    toast.success(`${special.title} added!`, {
      duration: 1500,
      style: {
        background: "oklch(0.18 0.015 30)",
        border: "1px solid oklch(0.62 0.22 38 / 0.5)",
        color: "oklch(0.97 0.01 60)",
      },
    });
  };

  return (
    <section
      className="py-10 sm:py-14 border-t border-border relative overflow-hidden"
      style={{ background: "oklch(0.13 0.025 35)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.58 0.24 30 / 0.12) 0%, transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2
            className="text-4xl sm:text-5xl font-black leading-none"
            style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.04em", color: "oklch(0.97 0.01 60)" }}
          >
            Today&apos;s Specials
          </h2>
        </div>
        <p className="text-muted-foreground text-sm mb-8 ml-[52px]">
          Limited-time offers — grab them while they last!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specials.map((special) => {
            const isExpiringSoon =
              special.expiresAt &&
              new Date(special.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 24;

            return (
              <div
                key={special.id}
                className="relative rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                style={{
                  background: "linear-gradient(145deg, oklch(0.20 0.025 35) 0%, oklch(0.17 0.02 30) 100%)",
                  border: "1px solid oklch(0.62 0.22 38 / 0.30)",
                  boxShadow: "0 4px 24px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(0.62 0.22 38 / 0.15)",
                }}
              >
                <div
                  className="h-1 w-full"
                  style={{ background: "linear-gradient(to right, oklch(0.58 0.24 30), oklch(0.72 0.20 55))" }}
                />

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {special.badge && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.58 0.24 30 / 0.25), oklch(0.68 0.22 45 / 0.25))",
                          color: "oklch(0.88 0.16 50)",
                          border: "1px solid oklch(0.62 0.22 38 / 0.45)",
                        }}
                      >
                        <Flame className="w-3 h-3" />
                        {special.badge}
                      </span>
                    )}
                    {isExpiringSoon && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: "oklch(0.55 0.18 25 / 0.25)",
                          color: "oklch(0.85 0.14 30)",
                          border: "1px solid oklch(0.55 0.18 25 / 0.45)",
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        Ending Soon
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black leading-tight" style={{ color: "oklch(0.97 0.01 60)" }}>
                    {special.title}
                  </h3>

                  {special.description && (
                    <p className="text-sm leading-relaxed flex-1" style={{ color: "oklch(0.75 0.04 60)" }}>
                      {special.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span
                      className="font-black text-3xl"
                      style={{
                        fontFamily: "'Bangers', cursive",
                        letterSpacing: "0.02em",
                        color: special.priceCents ? "oklch(0.70 0.20 45)" : "oklch(0.75 0.04 60)",
                      }}
                    >
                      {special.priceCents ? `$${(special.priceCents / 100).toFixed(2)}` : "Ask us!"}
                    </span>
                    <button
                      onClick={() => handleAdd(special)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.68 0.22 45) 100%)",
                        color: "white",
                        boxShadow: "0 2px 10px oklch(0.58 0.24 30 / 0.40)",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      {special.priceCents ? "Add" : "Inquire"}
                    </button>
                  </div>

                  {special.expiresAt && (
                    <p className="text-xs" style={{ color: "oklch(0.60 0.04 60)" }}>
                      Available until{" "}
                      {new Date(special.expiresAt).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
