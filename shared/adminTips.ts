import { z } from "zod";

export const TIPS_TIME_ZONE = "America/Toronto";
export const TIPS_EXPORT_LIMIT = 10_000;
export const TIPS_PAGE_SIZE = 25;
const calendarDate = /^\d{4}-\d{2}-\d{2}$/;
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIPS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

export function tipsDay(value: Date): string {
  const parts = dateFormatter.formatToParts(value);
  return ["year", "month", "day"].map(key => parts.find(part => part.type === key)!.value).join("-");
}

function calendarInstant(value: string): number {
  if (!calendarDate.test(value)) throw new Error("Use YYYY-MM-DD dates.");
  const instant = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0, 10) !== value || value < "2000-01-01" || value > "2100-01-01") {
    throw new Error("Enter a valid date between 2000 and 2099.");
  }
  return instant;
}

// Resolve wall-clock midnight iteratively using the zone's actual UTC offset.
export function tipsMidnightUtc(value: string): Date {
  const target = calendarInstant(value);
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIPS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = formatter.formatToParts(new Date(guess));
    const part = (key: string) => Number(parts.find(value => value.type === key)!.value);
    const wall = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
    const difference = target - wall;
    if (!difference) return new Date(guess);
    guess += difference;
  }
  throw new Error("Unable to resolve reporting midnight.");
}

export function defaultTipsDates(now = new Date()) {
  const to = tipsDay(now);
  return { from: `${to.slice(0, 7)}-01`, to };
}

export function tipsRange(input: { from: string; to: string }) {
  if (input.from > "2099-12-31" || input.to > "2099-12-31") throw new Error("Enter a valid date between 2000 and 2099.");
  const fromDay = calendarInstant(input.from);
  const toDay = calendarInstant(input.to);
  const days = (toDay - fromDay) / 86_400_000 + 1;
  if (days < 1 || days > 366) throw new Error("Choose an ordered date range of at most 366 days.");
  const nextDay = new Date(toDay + 86_400_000).toISOString().slice(0, 10);
  return { from: input.from, to: input.to, start: tipsMidnightUtc(input.from), end: tipsMidnightUtc(nextDay) };
}

export const tipsInputSchema = z.object({
  from: z.string(), to: z.string(), page: z.number().int().min(1).max(1_000_000).default(1),
}).superRefine((value, ctx) => {
  try { tipsRange(value); } catch (error) { ctx.addIssue({ code: "custom", message: (error as Error).message }); }
});

export function tipsCsvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f\u007f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export type TipsRow = { id: number | string; orderNumber: string; createdAt: Date; tipCents: number; paymentStatus?: string };
export function tipsCsv(rows: TipsRow[]): string {
  if (rows.length > TIPS_EXPORT_LIMIT) throw new Error("Export exceeds 10,000 tipped orders. Choose a shorter date range.");
  return "\uFEFF" + [
    ["Order", "Order created (America/Toronto)", "Tip (CAD)", "Payment status"],
    ...rows.map(row => [row.orderNumber, tipsDay(new Date(row.createdAt)), (row.tipCents / 100).toFixed(2), row.paymentStatus ?? "paid"]),
  ].map(row => row.map(tipsCsvCell).join(",")).join("\r\n");
}

export function positiveTipCents(value: unknown, unit: "cents" | "dollars" = "cents"): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const number = Number(value) * (unit === "dollars" ? 100 : 1);
  if (unit === "cents" && !Number.isSafeInteger(number)) return null;
  const cents = Math.round(number);
  return Number.isSafeInteger(cents) && cents > 0 && Math.abs(number - cents) < 0.000001 ? cents : null;
}
