// Pickup slots: 11:00 AM – 6:30 PM in 15-minute steps. Shared so the order
// page dropdown and the server-side validator can never drift apart.
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 11; h <= 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 18 && m > 30) break;
      const hour12 = h > 12 ? h - 12 : h;
      const meridiem = h >= 12 ? "PM" : "AM";
      const minStr = m === 0 ? "00" : String(m);
      slots.push(`${hour12}:${minStr} ${meridiem}`);
    }
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();
export const VALID_PICKUP_TIMES = new Set(TIME_SLOTS);

// Minutes since midnight in Eastern time for "now" — used to hide slots the
// customer can no longer make.
export function easternMinutesNow(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return (h % 24) * 60 + m;
}

export function slotToMinutes(slot: string): number {
  const [time, meridiem] = slot.split(" ");
  const [hStr, mStr] = (time ?? "12:00").split(":");
  let h = parseInt(hStr ?? "12", 10);
  const m = parseInt(mStr ?? "0", 10);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// Slots still orderable today (with prep lead time). If the truck is closed
// or it's past the last slot, all slots are returned for a next-open-day order.
export function availableSlots(leadMinutes = 15, now = new Date()): string[] {
  const cutoff = easternMinutesNow(now) + leadMinutes;
  const future = TIME_SLOTS.filter((s) => slotToMinutes(s) >= cutoff);
  return future.length > 0 ? future : TIME_SLOTS;
}
