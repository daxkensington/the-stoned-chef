"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "./CartDrawer";
import { ShoppingBag, MapPin, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems, totalCents } = useCart();
  const router = useRouter();
  const { isAdmin } = useAuth();

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: "oklch(0.15 0.015 30 / 0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.push("/")} className="flex items-center gap-2 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.68 0.22 45) 100%)",
                  boxShadow: "0 2px 10px oklch(0.58 0.24 30 / 0.45)",
                }}
              >
                👨‍🍳
              </div>
              <div className="leading-tight">
                <div
                  className="font-black tracking-wide"
                  style={{
                    fontFamily: "'Bangers', cursive",
                    letterSpacing: "0.06em",
                    fontSize: "1.15rem",
                    background: "linear-gradient(135deg, oklch(0.82 0.18 52) 0%, oklch(0.62 0.24 32) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  THE STONED CHEF
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Deseronto, ON · Where we cure the munchies
                </div>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Thu–Sun · 11am–7pm
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                45 Dundas St, Deseronto
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={() => router.push("/admin/specials")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{
                  background: "oklch(0.62 0.22 38 / 0.15)",
                  color: "oklch(0.82 0.16 48)",
                  border: "1px solid oklch(0.62 0.22 38 / 0.30)",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Manage Specials
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
                color: "white",
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">
                {totalItems > 0 ? `$${(totalCents / 100).toFixed(2)}` : "Cart"}
              </span>
              {totalItems > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-black flex items-center justify-center"
                  style={{ background: "oklch(0.97 0.01 60)", color: "oklch(0.13 0.01 30)" }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
