// Mirrors buildPickupAt in server/square.ts for offline verification.
const PICKUP_TZ = "America/Toronto";

function easternDateParts(d) {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: PICKUP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d).split("-").map(Number);
  return { year, month, day };
}

function easternWallClockToUtc({ year, month, day }, hours, minutes) {
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const tzPart = new Intl.DateTimeFormat("en-US", {
    timeZone: PICKUP_TZ, timeZoneName: "shortOffset",
  }).formatToParts(guess).find((p) => p.type === "timeZoneName")?.value;
  const offsetHours = parseInt(tzPart?.replace("GMT", "") ?? "-5", 10) || -5;
  return new Date(guess.getTime() - offsetHours * 3600_000);
}

function buildPickupAt(pickupTime, now) {
  const [timePart, meridiem] = pickupTime.split(" ");
  const [hoursStr, minutesStr] = (timePart ?? "12:00").split(":");
  let hours = parseInt(hoursStr ?? "12", 10);
  const minutes = parseInt(minutesStr ?? "0", 10);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  let pickup = easternWallClockToUtc(easternDateParts(now), hours, minutes);
  if (pickup < now) {
    const tomorrow = new Date(now.getTime() + 24 * 3600_000);
    pickup = easternWallClockToUtc(easternDateParts(tomorrow), hours, minutes);
  }
  return pickup.toISOString();
}

const cases = [
  // [pickupTime, simulated now (UTC), expected]
  ["1:45 PM", "2026-06-07T17:20:13Z", "2026-06-07T17:45:00.000Z"], // Luis's real order: 1:20 PM EDT, pickup 1:45 PM EDT same day
  ["5:15 PM", "2026-06-06T20:54:15Z", "2026-06-06T21:15:00.000Z"], // Megan's paid order
  ["11:30 AM", "2026-06-07T17:20:13Z", "2026-06-08T15:30:00.000Z"], // past time -> tomorrow
  ["12:15 PM", "2026-01-15T16:00:00Z", "2026-01-15T17:15:00.000Z"], // EST winter: noon-ish
  ["11:59 PM", "2026-06-07T03:50:00Z", "2026-06-07T03:59:00.000Z"], // 11:50 PM EDT June 6 -> pickup 11:59 PM EDT June 6
];

let fail = 0;
for (const [time, nowStr, expected] of cases) {
  const got = buildPickupAt(time, new Date(nowStr));
  const ok = got === expected;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  "${time}" @ now=${nowStr} -> ${got}${ok ? "" : ` (expected ${expected})`}`);
}
process.exit(fail ? 1 : 0);
