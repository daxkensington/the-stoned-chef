"use client";

import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { getOpeningStatus } from "@shared/openingHours";

function subscribeToClock(onChange: () => void) {
  const interval = setInterval(onChange, 60_000);
  return () => clearInterval(interval);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

export function OpenStatus() {
  const minute = useSyncExternalStore(subscribeToClock, currentMinute, serverMinute);
  if (minute === null) return null;
  const status = getOpeningStatus(new Date(minute * 60_000));

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: status.isOpen ? "oklch(0.30 0.10 145 / 0.3)" : "oklch(0.30 0.08 25 / 0.3)",
        color: status.isOpen ? "oklch(0.75 0.15 145)" : "oklch(0.75 0.10 30)",
        border: `1px solid ${status.isOpen ? "oklch(0.45 0.12 145 / 0.5)" : "oklch(0.45 0.08 25 / 0.5)"}`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: status.isOpen ? "oklch(0.65 0.20 145)" : "oklch(0.55 0.15 25)" }}
      />
      {status.isOpen ? "Open Now" : "Closed"}
      <span style={{ opacity: 0.7 }}>·</span>
      <Clock className="w-3 h-3" style={{ opacity: 0.7 }} />
      <span style={{ opacity: 0.8 }}>{status.nextOpenText}</span>
    </div>
  );
}
