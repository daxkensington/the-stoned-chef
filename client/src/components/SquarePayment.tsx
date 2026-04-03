"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CreditCard, Lock, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<SquarePayments>;
    };
  }
}

interface SquarePayments {
  card: () => Promise<SquareCard>;
}

interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
  destroy: () => void;
}

interface SquarePaymentProps {
  onToken: (token: string) => void;
  onPayAtPickup: () => void;
  disabled?: boolean;
  amountCents: number;
}

function loadSquareScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Square) { resolve(); return; }
    const existing = document.querySelector('script[src="https://web.squarecdn.com/v1/square.js"]') as HTMLScriptElement | null;
    if (existing) {
      if (window.Square) { resolve(); return; }
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://web.squarecdn.com/v1/square.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function SquarePayment({ onToken, onPayAtPickup, disabled, amountCents }: SquarePaymentProps) {
  const cardRef = useRef<SquareCard | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"card" | "pickup">("card");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  const hasCredentials = !!(appId && locationId);

  // Callback ref: fires when the container div mounts into the DOM
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (!node || cardRef.current || !hasCredentials) return;

    // Container just mounted — init the card form
    loadSquareScript().then(async () => {
      if (!mountedRef.current || cardRef.current) return;
      try {
        const payments = await window.Square!.payments(appId!, locationId!);
        const card = await payments.card();
        await card.attach("#sq-card");
        if (!mountedRef.current) { card.destroy(); return; }
        cardRef.current = card;
        setReady(true);
        setError(null);
      } catch (err) {
        console.error("[Square] Card form init error:", err);
        if (mountedRef.current) setError("Could not load payment form");
      }
    });
  }, [appId, locationId, hasCredentials]);

  useEffect(() => {
    mountedRef.current = true;
    if (!hasCredentials) setPayMethod("pickup");
    return () => {
      mountedRef.current = false;
      cardRef.current?.destroy();
      cardRef.current = null;
    };
  }, [hasCredentials]);

  const handleCardPay = useCallback(async () => {
    if (!cardRef.current || loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await cardRef.current.tokenize();
      if (result.status === "OK" && result.token) {
        onToken(result.token);
      } else {
        setError(result.errors?.[0]?.message ?? "Card was declined. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Payment failed. Please try again.");
      setLoading(false);
    }
  }, [loading, onToken]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-foreground">Payment</h2>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Payment method toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPayMethod("card")}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: payMethod === "card"
                ? "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)"
                : "var(--color-input)",
              color: payMethod === "card" ? "white" : "var(--color-muted-foreground)",
              border: payMethod === "card" ? "none" : "1px solid var(--color-border)",
            }}
          >
            Pay Now
          </button>
          <button
            type="button"
            onClick={() => setPayMethod("pickup")}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: payMethod === "pickup"
                ? "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)"
                : "var(--color-input)",
              color: payMethod === "pickup" ? "white" : "var(--color-muted-foreground)",
              border: payMethod === "pickup" ? "none" : "1px solid var(--color-border)",
            }}
          >
            Pay at Pickup
          </button>
        </div>

        {payMethod === "card" && (
          <>
            <div
              id="sq-card"
              ref={setContainerRef}
              className="rounded-xl overflow-hidden min-h-[44px]"
              style={{ background: "var(--color-input)" }}
            />

            {!ready && !error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Loading payment form...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.70 0.20 30)" }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              Secure payment powered by Square
            </div>

            <button
              type="button"
              onClick={handleCardPay}
              disabled={!ready || loading || disabled}
              className="w-full h-14 text-base font-bold rounded-2xl shadow-lg transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
                color: "white",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Pay $${(amountCents / 100).toFixed(2)} CAD`
              )}
            </button>
          </>
        )}

        {payMethod === "pickup" && (
          <>
            <p className="text-sm text-muted-foreground">
              Pay with cash or card when you pick up your order.
            </p>
            <button
              type="button"
              onClick={onPayAtPickup}
              disabled={disabled}
              className="w-full h-14 text-base font-bold rounded-2xl shadow-lg transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
                color: "white",
              }}
            >
              Place Order — Pay at Pickup
            </button>
          </>
        )}
      </div>
    </div>
  );
}
