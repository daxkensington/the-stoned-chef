"use client";

import { useState, useEffect } from "react";
import { Gift, Star } from "lucide-react";

const PUNCH_KEY = "sc_punches";
const PUNCHES_NEEDED = 10;

export function getPunches(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(PUNCH_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function addPunch() {
  try {
    const current = getPunches();
    const next = current >= PUNCHES_NEEDED ? 1 : current + 1;
    localStorage.setItem(PUNCH_KEY, String(next));
  } catch {}
}

export function hasFreeItem(): boolean {
  return getPunches() >= PUNCHES_NEEDED;
}

export function redeemFreeItem() {
  try {
    localStorage.setItem(PUNCH_KEY, "0");
  } catch {}
}

export function PunchCard() {
  const [punches, setPunches] = useState(0);

  useEffect(() => {
    setPunches(getPunches());
  }, []);

  if (punches === 0) return null;

  const isFree = punches >= PUNCHES_NEEDED;

  return (
    <section className="py-8 border-t border-border">
      <div className="container">
        <div className="rounded-2xl overflow-hidden" style={{
          background: isFree
            ? "linear-gradient(135deg, oklch(0.20 0.06 145), oklch(0.16 0.04 145))"
            : "linear-gradient(145deg, oklch(0.20 0.025 35), oklch(0.17 0.02 30))",
          border: `1px solid ${isFree ? "oklch(0.45 0.12 145 / 0.4)" : "oklch(0.62 0.22 38 / 0.25)"}`,
        }}>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isFree
                    ? "linear-gradient(135deg, oklch(0.45 0.15 145), oklch(0.55 0.15 145))"
                    : "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
                }}
              >
                {isFree ? <Gift className="w-5 h-5 text-white" /> : <Star className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">
                  {isFree ? "Free Item Unlocked!" : "Loyalty Card"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isFree
                    ? "You've earned a free item! Mention it at the truck."
                    : `${punches}/${PUNCHES_NEEDED} punches — ${PUNCHES_NEEDED - punches} more to earn a free item`}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5">
              {Array.from({ length: PUNCHES_NEEDED }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-3 rounded-full transition-all"
                  style={{
                    background: i < punches
                      ? isFree
                        ? "linear-gradient(135deg, oklch(0.55 0.18 145), oklch(0.65 0.15 145))"
                        : "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))"
                      : "oklch(0.25 0.02 30)",
                    boxShadow: i < punches ? "0 1px 4px oklch(0 0 0 / 0.3)" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
