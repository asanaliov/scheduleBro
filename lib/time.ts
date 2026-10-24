export const SCHEDULE_TIME_ZONE = "Europe/Skopje";

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const zonedPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SCHEDULE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getZonedParts(timestampMs: number): LocalDateTimeParts {
  const values = Object.fromEntries(
    zonedPartsFormatter
      .formatToParts(new Date(timestampMs))
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function timezoneOffsetMinutes(timestampMs: number): number {
  const local = getZonedParts(timestampMs);
  const localAsUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
  );

  return (localAsUtc - timestampMs) / 60_000;
}

function sameParts(left: LocalDateTimeParts, right: LocalDateTimeParts) {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

/**
 * Convert a form's wall-clock date and time in Skopje to a UTC timestamp.
 * DST gaps and repeated times are rejected so a visitor never gets a hidden shift.
 */
export function skopjeLocalTimeToTimestamp(
  date: string,
  time: string,
): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const requested: LocalDateTimeParts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };

  if (
    requested.year < 1900 ||
    requested.month < 1 ||
    requested.month > 12 ||
    requested.day < 1 ||
    requested.day > 31 ||
    requested.hour > 23 ||
    requested.minute > 59
  ) {
    return null;
  }

  const requestedUtc = Date.UTC(
    requested.year,
    requested.month - 1,
    requested.day,
    requested.hour,
    requested.minute,
  );
  const normalized = new Date(requestedUtc);

  if (
    normalized.getUTCFullYear() !== requested.year ||
    normalized.getUTCMonth() + 1 !== requested.month ||
    normalized.getUTCDate() !== requested.day
  ) {
    return null;
  }

  const offsets = new Set<number>();
  const sixHours = 6 * 60 * 60 * 1000;

  for (
    let delta = -48 * 60 * 60 * 1000;
    delta <= 48 * 60 * 60 * 1000;
    delta += sixHours
  ) {
    offsets.add(timezoneOffsetMinutes(requestedUtc + delta));
  }

  const matches = [...offsets]
    .map((offset) => requestedUtc - offset * 60_000)
    .filter((candidate) => sameParts(getZonedParts(candidate), requested));

  return matches.length === 1 ? matches[0] : null;
}

export function formatScheduleDate(timestampMs: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SCHEDULE_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(timestampMs);
}

export function formatScheduleTime(timestampMs: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SCHEDULE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(timestampMs);
}

export function scheduleDateValue(timestampMs: number): string {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: SCHEDULE_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date(timestampMs))
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}
