"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface PastOrder {
  orderNumber: string;
  items: { id: string; name: string; category: string; priceCents: number; quantity: number }[];
  totalCents: number;
  date: string;
}

const HISTORY_KEY = "sc_order_history";

export function saveOrderToHistory(order: PastOrder) {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const history: PastOrder[] = stored ? JSON.parse(stored) : [];
    history.unshift(order);
    if (history.length > 20) history.length = 20;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function OrderHistory() {
  const [history, setHistory] = useState<PastOrder[]>([]);
  const [expanded, setExpanded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  if (history.length === 0) return null;

  const reorder = (order: PastOrder) => {
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        addItem({ id: item.id, name: item.name, category: item.category, priceCents: item.priceCents });
      }
    }
    toast.success("Items added to cart!", {
      duration: 2000,
      style: {
        background: "oklch(0.18 0.015 30)",
        border: "1px solid oklch(0.62 0.22 38 / 0.5)",
        color: "oklch(0.97 0.01 60)",
      },
    });
  };

  const shown = expanded ? history : history.slice(0, 2);

  return (
    <section className="py-8 border-t border-border">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-2xl font-black"
            style={{
              fontFamily: "var(--font-bangers), 'Bangers', cursive",
              letterSpacing: "0.04em",
              color: "oklch(0.97 0.01 60)",
            }}
          >
            Order Again
          </h2>
          {history.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? "Show Less" : `Show All (${history.length})`}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shown.map((order, i) => (
            <div
              key={`${order.orderNumber}-${i}`}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ${(order.totalCents / 100).toFixed(2)} · {order.date}
                </p>
              </div>
              <button
                onClick={() => reorder(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 ml-3 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
                  color: "white",
                }}
              >
                <RotateCcw className="w-3 h-3" />
                Reorder
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
