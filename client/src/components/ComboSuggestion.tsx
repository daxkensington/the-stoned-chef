"use client";

import { useCart } from "@/contexts/CartContext";
import { MENU_CATEGORIES } from "@shared/menu";
import { Zap, Plus } from "lucide-react";
import { toast } from "sonner";

const ALL_ITEMS = MENU_CATEGORIES.flatMap((cat) => cat.items);

function menuItem(id: string) {
  const item = ALL_ITEMS.find((i) => i.id === id);
  if (!item) return null;
  return { id: item.id, name: item.name, priceCents: item.priceCents, category: item.category };
}

const COMBOS = [
  {
    trigger: ["burgers"],
    suggest: menuItem("fries-small"),
    message: "Add fries to your burger?",
  },
  {
    trigger: ["burgers", "chicken"],
    suggest: menuItem("drink-pop"),
    message: "Add a drink?",
  },
  {
    trigger: ["fish-chips"],
    suggest: menuItem("onion-rings"),
    message: "Onion rings with your fish?",
  },
].filter((c): c is typeof c & { suggest: NonNullable<ReturnType<typeof menuItem>> } => c.suggest !== null);

export function ComboSuggestion() {
  const { items, addItem } = useCart();

  if (items.length === 0) return null;

  const cartCategories = new Set(items.map((i) => i.category));
  const cartItemIds = new Set(items.map((i) => i.id));

  const suggestion = COMBOS.find(
    (combo) =>
      combo.trigger.some((cat) => cartCategories.has(cat)) &&
      !cartItemIds.has(combo.suggest.id)
  );

  if (!suggestion) return null;

  const handleAdd = () => {
    addItem(suggestion.suggest);
    toast.success(`${suggestion.suggest.name} added!`, {
      duration: 1500,
      style: {
        background: "oklch(0.18 0.015 30)",
        border: "1px solid oklch(0.62 0.22 38 / 0.5)",
        color: "oklch(0.97 0.01 60)",
      },
    });
  };

  return (
    <div
      className="rounded-xl p-3 flex items-center justify-between gap-3"
      style={{
        background: "linear-gradient(135deg, oklch(0.20 0.04 45 / 0.5), oklch(0.18 0.03 35 / 0.5))",
        border: "1px solid oklch(0.62 0.22 38 / 0.25)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.82 0.18 75)" }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{suggestion.message}</p>
          <p className="text-xs text-muted-foreground">
            +${(suggestion.suggest.priceCents / 100).toFixed(2)}
          </p>
        </div>
      </div>
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
          color: "white",
        }}
      >
        <Plus className="w-3 h-3" />
        Add
      </button>
    </div>
  );
}
