import type { CalendarEvent } from "./types";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
});

const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

const monthFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "America/New_York",
});

const dayFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  timeZone: "America/New_York",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

export function formatEventDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatEventTimeRange(event: CalendarEvent): string {
  const start = new Date(event.startsAt);
  if (!event.endsAt) return timeFmt.format(start);
  const end = new Date(event.endsAt);
  return `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}

export function formatEventMonth(iso: string): string {
  return monthFmt.format(new Date(iso));
}

export function formatEventDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}

export function formatEventShortDate(iso: string): string {
  return shortDateFmt.format(new Date(iso));
}
