"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { ComboSuggestion } from "@/components/ComboSuggestion";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, totalCents, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    onClose();
    router.push("/order");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
        style={{ background: "var(--color-card)", borderLeft: "1px solid var(--color-border)" }}
      >
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-foreground text-xl font-bold">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Order
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="text-6xl">🛒</div>
            <p className="text-muted-foreground text-center text-lg">Your cart is empty</p>
            <p className="text-muted-foreground text-center text-sm">
              Add some delicious items from the menu!
            </p>
            <Button
              variant="outline"
              onClick={onClose}
              className="mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--color-secondary)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-tight truncate">
                      {item.name}
                    </p>
                    {item.customizations && (
                      <p className="text-xs text-muted-foreground truncate">{item.customizations}</p>
                    )}
                    <p className="text-primary font-bold text-sm mt-0.5">
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      style={{ background: "var(--color-muted)" }}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-foreground text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      style={{ background: "var(--color-muted)" }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-2">
              <ComboSuggestion />
            </div>

            <div className="px-6 py-5 border-t border-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="text-foreground font-bold text-xl">
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Tax included · Pay online or at pickup</p>
              <Button
                onClick={handleCheckout}
                className="w-full h-12 text-base font-bold rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
                  color: "white",
                }}
              >
                Place Order — ${(totalCents / 100).toFixed(2)}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
