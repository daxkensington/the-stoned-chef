const storeClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  weekday: "long",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The truck trades every day from 11:00 to 19:00 in Toronto time. */
export function getOpeningStatus(now = new Date()) {
  const parts = storeClock.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  const hour = Number(part("hour"));
  const minute = Number(part("minute"));
  const day = weekdays.indexOf(part("weekday") ?? "");
  const isOpen = hour >= 11 && hour < 19;
  const minutesLeft = (19 - hour) * 60 - minute;
  const nextOpenText = isOpen
    ? minutesLeft <= 60 ? `Closing in ${minutesLeft} min` : "Open until 7:00 PM"
    : hour < 11 ? "Opens today at 11:00 AM" : `Opens ${weekdays[(day + 1) % 7]} at 11:00 AM`;
  return { isOpen, nextOpenText };
}
