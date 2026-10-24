import { randomUUID } from "node:crypto";
import { database } from "@/lib/server/database";
import type { HostSlot, PublicSlot } from "@/lib/types";
import { getService, type ServiceId } from "@/lib/services";
import { skopjeLocalTimeToTimestamp } from "@/lib/time";

export class ScheduleError extends Error {
  constructor(
    readonly code:
      | "INVALID_DATE"
      | "PAST_SLOT"
      | "SLOT_OVERLAP"
      | "SLOT_NOT_FOUND"
      | "SLOT_UNAVAILABLE"
      | "INVALID_SERVICE"
      | "SERVICE_DOES_NOT_FIT",
    message: string,
  ) {
    super(message);
    this.name = "ScheduleError";
  }
}

type SlotRow = {
  id: string;
  start_at_ms: number;
  duration_minutes: number;
};

function toPublicSlot(row: SlotRow): PublicSlot {
  return {
    id: row.id,
    startAt: new Date(row.start_at_ms).toISOString(),
    durationMinutes: row.duration_minutes,
  };
}

export function listAvailableSlots(
  serviceId?: ServiceId,
  now = Date.now(),
): PublicSlot[] {
  const service = serviceId ? getService(serviceId) : undefined;
  const sql = `SELECT slots.id, slots.start_at_ms, slots.duration_minutes
     FROM slots
     LEFT JOIN bookings ON bookings.slot_id = slots.id
     WHERE slots.start_at_ms > ? AND bookings.id IS NULL
     ${service ? "AND slots.duration_minutes >= ?" : ""}
     ORDER BY slots.start_at_ms ASC`;
  const rows = service
    ? (database.prepare(sql).all(now, service.durationMinutes) as SlotRow[])
    : (database.prepare(sql).all(now) as SlotRow[]);

  return rows.map(toPublicSlot);
}

export function listHostSlots(now = Date.now()): HostSlot[] {
  const rows = database
    .prepare(
      `SELECT slots.id, slots.start_at_ms, slots.duration_minutes,
              bookings.visitor_name, bookings.visitor_email,
              bookings.service_id, bookings.service_duration_minutes,
              bookings.price_mkd
       FROM slots
       LEFT JOIN bookings ON bookings.slot_id = slots.id
       WHERE slots.start_at_ms > ?
       ORDER BY slots.start_at_ms ASC`,
    )
    .all(now) as (SlotRow & {
      visitor_name: string | null;
      visitor_email: string | null;
      service_id: ServiceId | null;
      service_duration_minutes: number | null;
      price_mkd: number | null;
    })[];

  return rows.map((row) => ({
    ...toPublicSlot(row),
    visitorName: row.visitor_name,
    visitorEmail: row.visitor_email,
    serviceId: row.service_id,
    serviceDurationMinutes: row.service_duration_minutes,
    priceMkd: row.price_mkd,
  }));
}

export function createSlot(
  date: string,
  startTime: string,
  durationMinutes: number,
): PublicSlot {
  const startAtMs = skopjeLocalTimeToTimestamp(date, startTime);

  if (startAtMs === null) {
    throw new ScheduleError(
      "INVALID_DATE",
      "That date or time is invalid. Choose a different time in Europe/Skopje.",
    );
  }

  if (startAtMs <= Date.now()) {
    throw new ScheduleError("PAST_SLOT", "Choose a date and time in the future.");
  }

  const overlapping = database
    .prepare(
      `SELECT id FROM slots
       WHERE start_at_ms < ? AND start_at_ms + duration_minutes * 60000 > ?
       LIMIT 1`,
    );

  const insert = database.prepare(
    `INSERT INTO slots (id, start_at_ms, duration_minutes)
     VALUES (?, ?, ?)`,
  );

  try {
    const createWithinWriteLock = database.transaction(() => {
      const endAtMs = startAtMs + durationMinutes * 60_000;

      if (overlapping.get(endAtMs, startAtMs)) {
        throw new ScheduleError(
          "SLOT_OVERLAP",
          "This time overlaps another availability slot.",
        );
      }

      const id = randomUUID();
      insert.run(id, startAtMs, durationMinutes);
      return { id, startAtMs, durationMinutes };
    });

    const created = createWithinWriteLock.immediate();
    return {
      id: created.id,
      startAt: new Date(created.startAtMs).toISOString(),
      durationMinutes: created.durationMinutes,
    };
  } catch (error) {
    if (isSqliteCode(error, "SQLITE_CONSTRAINT_TRIGGER")) {
      throw new ScheduleError(
        "SLOT_OVERLAP",
        "This time overlaps another availability slot.",
      );
    }

    throw error;
  }
}

export function bookSlot(
  slotId: string,
  serviceId: ServiceId,
  visitorName: string,
  visitorEmail: string,
): {
  slot: PublicSlot;
  visitorName: string;
  serviceId: ServiceId;
  serviceDurationMinutes: number;
  priceMkd: number;
} {
  const service = getService(serviceId);

  if (!service) {
    throw new ScheduleError("INVALID_SERVICE", "Choose one of the listed services.");
  }

  const createWithinWriteLock = database.transaction(() => {
    const slot = database
      .prepare(
        `SELECT id, start_at_ms, duration_minutes FROM slots WHERE id = ?`,
      )
      .get(slotId) as SlotRow | undefined;

    if (!slot) {
      throw new ScheduleError("SLOT_NOT_FOUND", "That time no longer exists.");
    }

    if (slot.start_at_ms <= Date.now()) {
      throw new ScheduleError(
        "SLOT_UNAVAILABLE",
        "That time has passed. Please choose another slot.",
      );
    }

    const booking = database
      .prepare("SELECT 1 FROM bookings WHERE slot_id = ?")
      .get(slotId);

    if (booking) {
      throw new ScheduleError(
        "SLOT_UNAVAILABLE",
        "Someone just booked this time. Please choose another slot.",
      );
    }

    if (slot.duration_minutes < service.durationMinutes) {
      throw new ScheduleError(
        "SERVICE_DOES_NOT_FIT",
        "This time is too short for the selected service. Choose another time.",
      );
    }

    database
      .prepare(
        `INSERT INTO bookings (
           id, slot_id, visitor_name, visitor_email, service_id,
           service_duration_minutes, price_mkd
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        randomUUID(),
        slotId,
        visitorName,
        visitorEmail,
        service.id,
        service.durationMinutes,
        service.priceMkd,
      );

    return { slot, visitorName };
  });

  try {
    const booking = createWithinWriteLock.immediate();
    return {
      slot: toPublicSlot(booking.slot),
      visitorName: booking.visitorName,
      serviceId: service.id,
      serviceDurationMinutes: service.durationMinutes,
      priceMkd: service.priceMkd,
    };
  } catch (error) {
    if (isSqliteCode(error, "SQLITE_CONSTRAINT_TRIGGER")) {
      throw new ScheduleError(
        "SERVICE_DOES_NOT_FIT",
        "This time is too short for the selected service. Choose another time.",
      );
    }

    if (isSqliteCode(error, "SQLITE_CONSTRAINT_UNIQUE")) {
      throw new ScheduleError(
        "SLOT_UNAVAILABLE",
        "Someone just booked this time. Please choose another slot.",
      );
    }

    throw error;
  }
}

export function deleteUnbookedSlot(
  slotId: string,
): "deleted" | "not_found" | "booked" {
  const result = database
    .prepare(
      `DELETE FROM slots
       WHERE id = ? AND NOT EXISTS (
         SELECT 1 FROM bookings WHERE bookings.slot_id = slots.id
       )`,
    )
    .run(slotId);

  if (result.changes === 1) {
    return "deleted";
  }

  const slot = database
    .prepare("SELECT 1 FROM slots WHERE id = ?")
    .get(slotId);

  if (!slot) {
    return "not_found";
  }

  return "booked";
}

function isSqliteCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
