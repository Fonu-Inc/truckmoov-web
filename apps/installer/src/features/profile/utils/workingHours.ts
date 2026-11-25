/**
 * Fleetflow shows working hours as one text field, "8:00 AM - 6:00 PM"; the
 * API stores 24-hour "HH:MM" start and end. These convert between the two.
 */

/** "08:00" → "8:00 AM". */
function toClock(hhmm: string) {
  const [
    h,
    m,
  ] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(
    2,
    "0",
  )} ${h < 12 ? "AM" : "PM"}`;
}

export function formatWorkingHours(hours: {
  start: string; end: string;
}) {
  return `${toClock(hours.start)} - ${toClock(hours.end)}`;
}

const TIME = String.raw`(\d{1,2})(?::([0-5]\d))?\s*([ap])\.?m\.?`;
const RANGE = new RegExp(
  String.raw`^\s*${TIME}\s*(?:[-–—]|to)\s*${TIME}\s*$`,
  "i",
);

function to24(hour: string, minute: string | undefined, meridiem: string) {
  const h = Number(hour);
  if (h < 1 || h > 12)
    return null;
  const h24 = (h % 12) + (meridiem.toLowerCase() === "p" ? 12 : 0);
  return `${String(h24).padStart(
    2,
    "0",
  )}:${minute ?? "00"}`;
}

/** "8 AM - 6:30 PM" → { start: "08:00", end: "18:30" }; null when it doesn't read as a range. */
export function parseWorkingHours(text: string) {
  const match = RANGE.exec(text);
  if (!match)
    return null;
  const start = to24(
    match[1],
    match[2],
    match[3],
  );
  const end = to24(
    match[4],
    match[5],
    match[6],
  );
  return start && end
    ? {
        start, end,
      }
    : null;
}
