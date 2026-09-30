/** Recurrence math for the public calendar. No database imports. Times are America/New_York. */

export type RecurrenceFreq = "weekly" | "monthly";

export type RecurrenceFields = {
  freq: RecurrenceFreq | null;
  interval: number;
  until: string | null;
  count: number | null;
};

const TZ = "America/New_York";

type Civil = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function civilParts(date: Date, timeZone = TZ): Civil {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  const hour = bag.hour === "24" ? 0 : Number(bag.hour);
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

function offsetMinutes(instant: Date, timeZone = TZ): number {
  const parts = civilParts(instant, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Wall-clock time in America/New_York as an absolute instant. */
export function zonedDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone = TZ,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const first = offsetMinutes(new Date(guess), timeZone);
  const secondPass = offsetMinutes(new Date(guess - first * 60000), timeZone);
  return new Date(guess - secondPass * 60000);
}

export function etDateKey(iso: string): string {
  const parts = civilParts(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function endOfEtDay(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return zonedDateTime(year!, month!, day!, 23, 59, 59).toISOString();
}

export function monthBounds(month: string): { from: Date; to: Date } {
  const [year, mon] = month.split("-").map(Number);
  const from = zonedDateTime(year!, mon!, 1, 0, 0, 0);
  const nextMonth = mon === 12 ? 1 : mon! + 1;
  const nextYear = mon === 12 ? year! + 1 : year!;
  const to = zonedDateTime(nextYear, nextMonth, 1, 0, 0, 0);
  return { from, to };
}

export function currentEtMonth(now = new Date()): string {
  const parts = civilParts(now);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

export function daysInEtMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, mon!, 0)).getUTCDate();
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function etWeekdayIndex(date: Date): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(date);
  const idx = WEEKDAYS.indexOf(label as (typeof WEEKDAYS)[number]);
  return idx < 0 ? 0 : idx;
}

function addDays(year: number, month: number, day: number, days: number) {
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function addMonths(year: number, month: number, day: number, months: number) {
  const index = month - 1 + months;
  const year2 = year + Math.floor(index / 12);
  const month0 = ((index % 12) + 12) % 12;
  const dim = new Date(Date.UTC(year2, month0 + 1, 0)).getUTCDate();
  return { year: year2, month: month0 + 1, day: Math.min(day, dim) };
}

/** Exclusive instant: the start of the ET day after today plus one year. */
export function indefiniteCutoff(now = new Date()): Date {
  const parts = civilParts(now);
  const dayAfter = addDays(parts.year + 1, parts.month, parts.day, 1);
  return zonedDateTime(dayAfter.year, dayAfter.month, dayAfter.day, 0, 0, 0);
}

function occurrenceAt(
  anchorCivil: Civil,
  freq: RecurrenceFreq,
  interval: number,
  index: number,
): Date {
  const step = index * interval;
  const civil =
    freq === "weekly"
      ? addDays(anchorCivil.year, anchorCivil.month, anchorCivil.day, step * 7)
      : addMonths(anchorCivil.year, anchorCivil.month, anchorCivil.day, step);
  return zonedDateTime(
    civil.year,
    civil.month,
    civil.day,
    anchorCivil.hour,
    anchorCivil.minute,
    anchorCivil.second,
  );
}

/** Index at or just before the first occurrence that can fall in rangeFrom. */
function firstIndexNear(anchorCivil: Civil, freq: RecurrenceFreq, interval: number, rangeFrom: Date): number {
  const anchorInstant = occurrenceAt(anchorCivil, freq, interval, 0);
  if (rangeFrom.getTime() <= anchorInstant.getTime()) return 0;
  const fromCivil = civilParts(rangeFrom);
  let estimate = 0;
  if (freq === "weekly") {
    const a = Date.UTC(anchorCivil.year, anchorCivil.month - 1, anchorCivil.day);
    const b = Date.UTC(fromCivil.year, fromCivil.month - 1, fromCivil.day);
    const weeks = Math.floor((b - a) / (7 * 86400000));
    estimate = Math.floor(weeks / interval) - 1;
  } else {
    const months =
      (fromCivil.year - anchorCivil.year) * 12 + (fromCivil.month - anchorCivil.month);
    estimate = Math.floor(months / interval) - 1;
  }
  return Math.max(0, estimate);
}

/**
 * Starts that fall in [rangeFrom, rangeTo).
 * One-off: the anchor only. Repeating: the anchor counts as occurrence 1.
 * Count and until series stop at count or until, and at rangeTo.
 * Indefinite (no until and no count) also stops one year ahead of today, America/New_York.
 */
export function occurrenceInstants(
  anchorIso: string,
  rule: RecurrenceFields,
  rangeFrom: Date,
  rangeTo: Date,
  now = new Date(),
): Date[] {
  const anchor = new Date(anchorIso);
  if (Number.isNaN(anchor.getTime())) return [];
  if (!rule.freq) {
    return anchor >= rangeFrom && anchor < rangeTo ? [anchor] : [];
  }
  const interval = Math.max(1, rule.interval || 1);
  const untilMs = rule.until ? new Date(rule.until).getTime() : null;
  const indefinite = rule.until == null && rule.count == null;
  const horizonMs = indefinite ? indefiniteCutoff(now).getTime() : null;
  const lastIndex = rule.count == null ? null : Math.min(rule.count, 500) - 1;
  const anchorCivil = civilParts(anchor);
  let index = firstIndexNear(anchorCivil, rule.freq, interval, rangeFrom);
  if (lastIndex != null && index > lastIndex) return [];
  const out: Date[] = [];
  for (let guard = 0; guard < 800; guard += 1) {
    if (lastIndex != null && index > lastIndex) break;
    const occ = occurrenceAt(anchorCivil, rule.freq, interval, index);
    index += 1;
    if (untilMs != null && occ.getTime() > untilMs) break;
    if (horizonMs != null && occ.getTime() >= horizonMs) break;
    if (occ.getTime() >= rangeTo.getTime()) break;
    if (occ.getTime() >= rangeFrom.getTime()) out.push(occ);
  }
  return out;
}

/**
 * Soonest occurrence that has not ended.
 * No endsAt: the occurrence ends at its start. With endsAt, the same duration applies to each occurrence.
 */
export function nextOpenOccurrence(
  anchorIso: string,
  rule: RecurrenceFields,
  endsAtIso: string | null,
  now: Date,
): Date | null {
  const anchor = new Date(anchorIso);
  if (Number.isNaN(anchor.getTime())) return null;
  const endMs = endsAtIso ? new Date(endsAtIso).getTime() : anchor.getTime();
  const duration = Number.isFinite(endMs) ? Math.max(0, endMs - anchor.getTime()) : 0;
  const from = new Date(now.getTime() - duration);
  const to = new Date(now.getTime() + 366 * 15 * 24 * 60 * 60 * 1000);
  for (const start of occurrenceInstants(anchorIso, rule, from, to, now)) {
    if (start.getTime() + duration > now.getTime()) return start;
  }
  return null;
}

export function nextOccurrenceOnOrAfter(
  anchorIso: string,
  rule: RecurrenceFields,
  from: Date,
): Date | null {
  const far = new Date(from.getTime() + 366 * 5 * 24 * 60 * 60 * 1000);
  return occurrenceInstants(anchorIso, rule, from, far)[0] ?? null;
}

export function recurrenceLabel(rule: RecurrenceFields): string | null {
  if (!rule.freq) return null;
  const unit = rule.freq === "weekly" ? "week" : "month";
  const every =
    rule.interval <= 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`;
  if (rule.count) return `${every}, ${rule.count} times`;
  if (!rule.until) return `${every}, no end date`;
  return every;
}
