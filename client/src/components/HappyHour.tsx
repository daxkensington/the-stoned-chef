"use client";

import { useState, useEffect } from "react";
import { Clock, Percent } from "lucide-react";

// Happy hour: weekdays (Thu-Sun) 2pm-4pm — 10% off everything
const HAPPY_HOUR_START = 14;
const HAPPY_HOUR_END = 16;
const HAPPY_HOUR_DISCOUNT = 10; // percent
const OPEN_DAYS = [0, 4, 5, 6]; // Sun, Thu, Fri, Sat

function isHappyHour(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return OPEN_DAYS.includes(day) && hour >= HAPPY_HOUR_START && hour < HAPPY_HOUR_END;
}

function getMinutesLeft(): number {
  const now = new Date();
  return (HAPPY_HOUR_END - now.getHours()) * 60 - now.getMinutes();
}

export function useHappyHour() {
  const [active, setActive] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(0);

  useEffect(() => {
    const check = () => {
      setActive(isHappyHour());
      setMinutesLeft(getMinutesLeft());
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { active, discount: HAPPY_HOUR_DISCOUNT, minutesLeft };
}

export function HappyHourBanner() {
  const { active, discount, minutesLeft } = useHappyHour();

  if (!active) return null;

  return (
    <div
      className="py-2 px-4 text-center text-sm font-bold relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, oklch(0.55 0.24 28), oklch(0.65 0.22 45), oklch(0.55 0.24 28))",
        backgroundSize: "200% 100%",
        animation: "shimmer 3s ease-in-out infinite",
        color: "white",
      }}
    >
      <div className="container flex items-center justify-center gap-2 flex-wrap">
        <Percent className="w-4 h-4" />
        <span>Happy Hour! {discount}% off everything</span>
        <span className="opacity-70">·</span>
        <span className="flex items-center gap-1 opacity-90">
          <Clock className="w-3 h-3" />
          {minutesLeft} min left
        </span>
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

export function applyHappyHourDiscount(priceCents: number): number {
  if (!isHappyHour()) return priceCents;
  return Math.round(priceCents * (1 - HAPPY_HOUR_DISCOUNT / 100));
}
