"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Plus, Minus, ChevronRight } from "lucide-react";
import { getCustomizations, hasCustomizations } from "@shared/customizations";
import type { MenuItem } from "@shared/menu";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface CustomizeModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

export function CustomizeModal({ item, open, onClose }: CustomizeModalProps) {
  const [selectedRemoves, setSelectedRemoves] = useState<Set<string>>(new Set());
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  if (!item) return null;

  const customizations = getCustomizations(item.category);
  const addOnTotal = customizations.addOns
    .filter((a) => selectedAddOns.has(a.id))
    .reduce((sum, a) => sum + a.priceCents, 0);
  const unitPrice = item.priceCents + addOnTotal;
  const totalPrice = unitPrice * quantity;

  const toggleRemove = (id: string) => {
    setSelectedRemoves((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const removeLabels = customizations.removes
      .filter((r) => selectedRemoves.has(r.id))
      .map((r) => r.label);
    const addOnLabels = customizations.addOns
      .filter((a) => selectedAddOns.has(a.id))
      .map((a) => a.label);
    const allMods = [...removeLabels, ...addOnLabels];
    const customizationStr = allMods.length > 0 ? allMods.join(", ") : undefined;

    // Create a unique ID based on customizations
    const customId = customizationStr
      ? `${item.id}__${[...selectedRemoves, ...selectedAddOns].sort().join("_")}`
      : item.id;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: customId,
        name: item.name,
        category: item.category,
        priceCents: unitPrice,
        customizations: customizationStr,
      });
    }

    toast.success(`${item.name} added!`, {
      duration: 1500,
      style: {
        background: "oklch(0.18 0.015 30)",
        border: "1px solid oklch(0.62 0.22 38 / 0.5)",
        color: "oklch(0.97 0.01 60)",
      },
    });

    // Reset and close
    setSelectedRemoves(new Set());
    setSelectedAddOns(new Set());
    setQuantity(1);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-0"
        style={{ background: "var(--color-card)", borderTop: "1px solid var(--color-border)" }}
      >
        <SheetHeader className="px-6 pt-6 pb-3">
          <SheetTitle className="text-xl font-bold text-foreground text-left">
            Customize {item.name}
          </SheetTitle>
          <p className="text-sm text-muted-foreground text-left">
            Base price: ${(item.priceCents / 100).toFixed(2)}
          </p>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Remove options */}
          {customizations.removes.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Remove
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {customizations.removes.map((opt) => {
                  const selected = selectedRemoves.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleRemove(opt.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                      style={{
                        background: selected ? "oklch(0.55 0.18 25 / 0.15)" : "var(--color-secondary)",
                        border: `1px solid ${selected ? "oklch(0.55 0.18 25 / 0.4)" : "var(--color-border)"}`,
                        color: selected ? "oklch(0.80 0.12 25)" : "var(--color-foreground)",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{
                          background: selected ? "oklch(0.55 0.18 25)" : "var(--color-muted)",
                          color: "white",
                        }}
                      >
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                      <span className={selected ? "line-through opacity-70" : ""}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-on options */}
          {customizations.addOns.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Add-Ons
              </h4>
              <div className="space-y-2">
                {customizations.addOns.map((opt) => {
                  const selected = selectedAddOns.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleAddOn(opt.id)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: selected
                          ? "linear-gradient(135deg, oklch(0.58 0.24 30 / 0.15), oklch(0.68 0.22 45 / 0.15))"
                          : "var(--color-secondary)",
                        border: `1px solid ${selected ? "oklch(0.62 0.22 38 / 0.4)" : "var(--color-border)"}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{
                            background: selected ? "oklch(0.62 0.22 38)" : "var(--color-muted)",
                            color: "white",
                          }}
                        >
                          {selected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-foreground">{opt.label}</span>
                      </div>
                      <span
                        className="font-bold text-sm"
                        style={{ color: "oklch(0.70 0.20 45)" }}
                      >
                        +${(opt.priceCents / 100).toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "var(--color-secondary)", color: "var(--color-foreground)" }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-lg text-foreground">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "var(--color-secondary)", color: "var(--color-foreground)" }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart button */}
          <Button
            onClick={handleAdd}
            className="w-full h-14 text-base font-bold rounded-2xl"
            style={{
              background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
              color: "white",
              boxShadow: "0 4px 20px oklch(0.58 0.24 30 / 0.4)",
            }}
          >
            Add to Cart — ${(totalPrice / 100).toFixed(2)}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
