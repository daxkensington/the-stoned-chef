"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

// Thu=4, Fri=5, Sat=6, Sun=0 — 11am to 7pm ET
const OPEN_DAYS = [0, 4, 5, 6]; // Sunday, Thursday, Friday, Saturday
const OPEN_HOUR = 11;
const CLOSE_HOUR = 19;

function getStatus() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const min = now.getMinutes();

  const isOpenDay = OPEN_DAYS.includes(day);
  const isOpenTime = hour >= OPEN_HOUR && hour < CLOSE_HOUR;
  const isOpen = isOpenDay && isOpenTime;

  let nextOpenText = "";
  if (!isOpen) {
    if (isOpenDay && hour < OPEN_HOUR) {
      nextOpenText = `Opens today at ${OPEN_HOUR}:00 AM`;
    } else if (isOpenDay && hour >= CLOSE_HOUR) {
      // Find next open day
      nextOpenText = getNextOpenDay(day);
    } else {
      nextOpenText = getNextOpenDay(day);
    }
  } else {
    const minsLeft = (CLOSE_HOUR - hour) * 60 - min;
    if (minsLeft <= 60) {
      nextOpenText = `Closing in ${minsLeft} min`;
    } else {
      nextOpenText = `Open until 7:00 PM`;
    }
  }

  return { isOpen, nextOpenText };
}

function getNextOpenDay(currentDay: number): string {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (let i = 1; i <= 7; i++) {
    const check = (currentDay + i) % 7;
    if (OPEN_DAYS.includes(check)) {
      return `Opens ${dayNames[check]} at ${OPEN_HOUR}:00 AM`;
    }
  }
  return "Check back soon";
}

export function OpenStatus() {
  const [status, setStatus] = useState({ isOpen: false, nextOpenText: "" });

  useEffect(() => {
    setStatus(getStatus());
    const interval = setInterval(() => setStatus(getStatus()), 60_000);
    return () => clearInterval(interval);
  }, []);

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
