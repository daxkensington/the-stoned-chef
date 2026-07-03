"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ShoppingBag, Clock, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { ComboSuggestion } from "@/components/ComboSuggestion";
import { saveOrderToHistory } from "@/components/OrderHistory";
import { addPunch } from "@/components/PunchCard";
import { TipSelector } from "@/components/TipSelector";
import { SquarePayment } from "@/components/SquarePayment";

import { availableSlots } from "@shared/pickup";

// Error keys → input element ids, for scrolling the first error into view
const ERROR_FIELD_IDS: Record<string, string> = {
  customerName: "name",
  customerPhone: "phone",
  pickupTime: "pickup",
};

export default function OrderPage() {
  const { items, totalCents, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupTime: "",
    notes: "",
    smsOptIn: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tipCents, setTipCents] = useState(0);
  const grandTotal = totalCents + tipCents;

  // Pickup slots the customer can still make today (computed once per visit)
  const timeSlots = useMemo(() => availableSlots(), []);

  // One idempotency key per checkout attempt: lets the server dedupe
  // double-submits without double-charging. Regenerated whenever the order
  // contents change so Square never sees the same key with a new payload.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, [grandTotal, form.customerName, form.customerPhone, form.customerEmail, form.pickupTime, form.notes]);

  const placeOrder = trpc.orders.place.useMutation({
    onSuccess: (data) => {
      saveOrderToHistory({
        orderNumber: data.orderNumber,
        items: items.map((i) => ({ id: i.id, name: i.name, category: i.category, priceCents: i.priceCents, quantity: i.quantity })),
        totalCents: data.totalCents,
        date: new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      });
      addPunch();
      clearCart();
      router.push(`/confirmation/${data.orderNumber}`);
    },
    onError: (err) => {
      // Fresh key for the next attempt (a new card token changes the payload,
      // which Square rejects under a reused key) — EXCEPT when the charge
      // already went through; then the key must survive so a resubmit can't
      // double-charge.
      if (!err.message.includes("do NOT submit")) {
        setIdempotencyKey(crypto.randomUUID());
      }
      // The server message may say the payment already went through — don't
      // blanket-advise retrying.
      toast.error("Couldn't place your order", {
        description: err.message,
        style: {
          background: "oklch(0.18 0.015 30)",
          border: "1px solid oklch(0.55 0.22 25)",
          color: "oklch(0.97 0.01 60)",
        },
      });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.customerName.trim()) newErrors.customerName = "Name is required";
    if (!form.customerPhone.trim()) newErrors.customerPhone = "Phone number is required";
    else if (!/^[\d\s\-\(\)\+]{7,}$/.test(form.customerPhone))
      newErrors.customerPhone = "Enter a valid phone number";
    if (!form.pickupTime) newErrors.pickupTime = "Please select a pickup time";
    return newErrors;
  };

  // Runs before card tokenization; scrolls the first invalid field into view
  // (the payment form sits at the bottom, far from the inputs).
  const validateBeforePay = () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    const firstError = Object.keys(validationErrors)[0];
    if (firstError) {
      document
        .getElementById(ERROR_FIELD_IDS[firstError] ?? "")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const submitOrder = (paymentToken: string) => {
    placeOrder.mutate({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      pickupTime: form.pickupTime,
      notes: form.notes.trim() || undefined,
      tipCents: tipCents,
      smsOptIn: form.smsOptIn,
      paymentToken,
      idempotencyKey,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        priceCents: i.priceCents,
        quantity: i.quantity,
      })),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-6xl">🛒</div>
        <h2 className="text-2xl font-bold text-foreground">Your cart is empty</h2>
        <p className="text-muted-foreground text-center">
          Add some items from the menu before placing an order.
        </p>
        <Button
          onClick={() => router.push("/")}
          style={{
            background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
            color: "white",
          }}
          className="h-12 px-6 rounded-xl font-bold"
        >
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--color-background)" }}>
      <div
        className="border-b border-border"
        style={{ background: "oklch(0.20 0.015 30 / 0.95)" }}
      >
        <div className="container">
          <div className="flex items-center gap-3 h-16">
            <button
              onClick={() => router.push("/")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1
              className="font-black text-xl text-foreground"
              style={{ fontFamily: "var(--font-bangers), 'Bangers', cursive", letterSpacing: "0.04em" }}
            >
              Complete Your Order
            </h1>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="max-w-lg mx-auto space-y-6">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">Order Summary</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-foreground">
                    <span className="font-semibold text-primary mr-1">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-black text-xl" style={{ color: "oklch(0.62 0.22 38)" }}>
                  ${(totalCents / 100).toFixed(2)} CAD
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Tax included</p>
            </div>
          </div>

          {/* Combo Suggestion */}
          <ComboSuggestion />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">Your Details</h2>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-foreground font-semibold text-sm">
                    Full Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Jane Smith"
                    aria-required="true"
                    aria-invalid={!!errors.customerName}
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    className="h-11 rounded-xl"
                    style={{
                      background: "var(--color-input)",
                      border: errors.customerName
                        ? "1px solid oklch(0.55 0.22 25)"
                        : "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                    }}
                  />
                  {errors.customerName && (
                    <p className="text-xs" style={{ color: "oklch(0.70 0.20 30)" }}>
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-foreground font-semibold text-sm">
                    Phone Number <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(613) 555-0100"
                      aria-required="true"
                      aria-invalid={!!errors.customerPhone}
                      value={form.customerPhone}
                      onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                      className="h-11 rounded-xl pl-9"
                      style={{
                        background: "var(--color-input)",
                        border: errors.customerPhone
                          ? "1px solid oklch(0.55 0.22 25)"
                          : "1px solid var(--color-border)",
                        color: "var(--color-foreground)",
                      }}
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="text-xs" style={{ color: "oklch(0.70 0.20 30)" }}>
                      {errors.customerPhone}
                    </p>
                  )}
                </div>

                {/* Email (optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground font-semibold text-sm">
                    Email <span className="text-muted-foreground font-normal">(for order updates)</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@email.com"
                      value={form.customerEmail}
                      onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                      className="h-11 rounded-xl pl-9"
                      style={{
                        background: "var(--color-input)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-foreground)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">We&apos;ll notify you when your order is ready</p>
                </div>

                {/* SMS Opt-in */}
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={form.smsOptIn}
                    onChange={(e) => setForm((f) => ({ ...f, smsOptIn: e.target.checked }))}
                    className="w-5 h-5 rounded accent-[oklch(0.58_0.24_30)]"
                  />
                  <span className="text-sm text-foreground">
                    Text me when my order is ready
                  </span>
                </label>
              </div>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">Pickup Time</h2>
              </div>
              <div className="px-5 py-5">
                <Label htmlFor="pickup" className="text-foreground font-semibold text-sm mb-1.5 block">
                  When would you like to pick up? <span className="text-primary">*</span>
                </Label>
                <Select
                  value={form.pickupTime}
                  onValueChange={(val) => setForm((f) => ({ ...f, pickupTime: val }))}
                >
                  <SelectTrigger
                    id="pickup"
                    className="h-11 rounded-xl w-full"
                    style={{
                      background: "var(--color-input)",
                      border: errors.pickupTime
                        ? "1px solid oklch(0.55 0.22 25)"
                        : "1px solid var(--color-border)",
                      color: form.pickupTime
                        ? "var(--color-foreground)"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    <SelectValue placeholder="Select a time..." />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {timeSlots.map((slot) => (
                      <SelectItem
                        key={slot}
                        value={slot}
                        className="text-foreground hover:bg-secondary"
                      >
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pickupTime && (
                  <p className="text-xs mt-1" style={{ color: "oklch(0.70 0.20 30)" }}>
                    {errors.pickupTime}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Open Every Day · 11:00 AM – 7:00 PM · 45 Dundas St, Deseronto
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="px-5 py-5">
                <Label htmlFor="notes" className="text-foreground font-semibold text-sm mb-1.5 block">
                  Special Instructions{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Allergies, special requests, etc."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="rounded-xl resize-none"
                  style={{
                    background: "var(--color-input)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>
            </div>

            {/* Tip */}
            <TipSelector
              subtotalCents={totalCents}
              tipCents={tipCents}
              onTipChange={setTipCents}
            />

            {/* Total with tip */}
            {tipCents > 0 && (
              <div
                className="rounded-xl p-4 flex justify-between items-center"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
              >
                <div className="text-sm">
                  <p className="text-muted-foreground">Subtotal: ${(totalCents / 100).toFixed(2)}</p>
                  <p className="text-muted-foreground">Tip: ${(tipCents / 100).toFixed(2)}</p>
                </div>
                <span className="font-black text-xl" style={{ color: "oklch(0.62 0.22 38)" }}>
                  ${(grandTotal / 100).toFixed(2)}
                </span>
              </div>
            )}

            {/* Payment */}
            <SquarePayment
              amountCents={grandTotal}
              disabled={placeOrder.isPending}
              validateBeforePay={validateBeforePay}
              onToken={(token) => submitOrder(token)}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
