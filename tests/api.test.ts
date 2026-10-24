import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const testDatabasePath = resolve(process.cwd(), "data", "schedule-bro-test.sqlite");
let database: typeof import("@/lib/server/database").database;
let publicSlotsRoute: typeof import("@/app/api/slots/route");
let hostSlotsRoute: typeof import("@/app/api/host/slots/route");
let bookingsRoute: typeof import("@/app/api/bookings/route");
let deleteSlotRoute: typeof import("@/app/api/host/slots/[id]/route");
let time: typeof import("@/lib/time");

before(async () => {
  process.env.DATABASE_PATH = testDatabasePath;
  rmSync(testDatabasePath, { force: true });
  rmSync(`${testDatabasePath}-wal`, { force: true });
  rmSync(`${testDatabasePath}-shm`, { force: true });

  const [databaseModule, migrationModule, publicModule, hostModule, bookingModule, deleteModule, timeModule] =
    await Promise.all([
      import("@/lib/server/database"),
      import("@/lib/server/migrations"),
      import("@/app/api/slots/route"),
      import("@/app/api/host/slots/route"),
      import("@/app/api/bookings/route"),
      import("@/app/api/host/slots/[id]/route"),
      import("@/lib/time"),
    ]);

  database = databaseModule.database;
  publicSlotsRoute = publicModule;
  hostSlotsRoute = hostModule;
  bookingsRoute = bookingModule;
  deleteSlotRoute = deleteModule;
  time = timeModule;
  migrationModule.applyMigrations();
});

after(() => {
  database?.close();
  rmSync(testDatabasePath, { force: true });
  rmSync(`${testDatabasePath}-wal`, { force: true });
  rmSync(`${testDatabasePath}-shm`, { force: true });
});

function requestWithJson(body: unknown): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function listPublicSlots(serviceId?: string): Response {
  const url = new URL("http://localhost/api/slots");

  if (serviceId) {
    url.searchParams.set("serviceId", serviceId);
  }

  return publicSlotsRoute.GET(new Request(url));
}

function futureDate(daysFromToday: number): string {
  return time.scheduleDateValue(Date.now() + daysFromToday * 24 * 60 * 60 * 1000);
}

function sqliteErrorHasCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function publishSlot(
  days: number,
  startTime = "10:00",
  durationMinutes = 30,
) {
  const response = await hostSlotsRoute.POST(
    requestWithJson({
      date: futureDate(days),
      startTime,
      durationMinutes,
    }),
  );
  const result = (await response.json()) as {
    data?: { id: string };
    error?: { message: string };
  };

  assert.equal(response.status, 201, result.error?.message);
  assert.ok(result.data?.id);
  return result.data.id;
}

async function bookSlot(
  slotId: string,
  visitorName = "Taylor Example",
  visitorEmail = "taylor@example.com",
  serviceId = "haircut",
) {
  return bookingsRoute.POST(
    requestWithJson({ slotId, serviceId, visitorName, visitorEmail }),
  );
}

test("a host can publish a valid availability slot", async () => {
  const slotId = await publishSlot(2, "09:00");
  const response = listPublicSlots();
  const result = (await response.json()) as {
    data: { id: string; durationMinutes: number }[];
  };

  assert.equal(response.status, 200);
  assert.ok(result.data.some((slot) => slot.id === slotId));
  assert.equal(result.data.find((slot) => slot.id === slotId)?.durationMinutes, 30);
});

test("invalid dates, past times, and durations are rejected", async () => {
  const invalidDate = await hostSlotsRoute.POST(
    requestWithJson({ date: "2099-02-31", startTime: "10:00", durationMinutes: 30 }),
  );
  const pastDate = await hostSlotsRoute.POST(
    requestWithJson({ date: "2000-01-01", startTime: "10:00", durationMinutes: 30 }),
  );
  const invalidDuration = await hostSlotsRoute.POST(
    requestWithJson({ date: futureDate(3), startTime: "10:00", durationMinutes: 10 }),
  );

  assert.equal(invalidDate.status, 400);
  assert.equal(pastDate.status, 400);
  assert.equal(invalidDuration.status, 400);
});

test("overlapping availability is rejected", async () => {
  const date = futureDate(4);
  await publishSlot(4, "10:00");
  const response = await hostSlotsRoute.POST(
    requestWithJson({
      date,
      startTime: "10:15",
      durationMinutes: 30,
    }),
  );
  const overlappingStart = time.skopjeLocalTimeToTimestamp(date, "10:15");

  assert.ok(overlappingStart);
  assert.throws(
    () =>
      database
        .prepare(
          "INSERT INTO slots (id, start_at_ms, duration_minutes) VALUES (?, ?, ?)",
        )
        .run(randomUUID(), overlappingStart, 30),
    (error: unknown) => sqliteErrorHasCode(error, "SQLITE_CONSTRAINT_TRIGGER"),
  );

  assert.equal(response.status, 409);
});

test("invalid visitor names and email addresses are rejected", async () => {
  const slotId = await publishSlot(5, "11:00");
  const invalidName = await bookSlot(slotId, "   ", "taylor@example.com");
  const invalidEmail = await bookSlot(slotId, "Taylor Example", "not-an-email");

  assert.equal(invalidName.status, 400);
  assert.equal(invalidEmail.status, 400);
});

test("service duration filters openings and is enforced when booking", async () => {
  const shortWindowId = await publishSlot(5, "09:00", 30);
  const longWindowId = await publishSlot(5, "10:00", 60);
  const shortServiceSlots = await listPublicSlots("beard-trim").json() as {
    data: { id: string }[];
  };
  const longServiceSlots = await listPublicSlots("haircut-beard").json() as {
    data: { id: string }[];
  };
  const invalidServiceFilter = listPublicSlots("straight-razor");
  const invalidServiceResponse = await bookingsRoute.POST(
    requestWithJson({
      slotId: shortWindowId,
      serviceId: "straight-razor",
      visitorName: "Taylor Example",
      visitorEmail: "taylor@example.com",
    }),
  );
  const tooLongServiceResponse = await bookSlot(
    shortWindowId,
    "Taylor Example",
    "taylor@example.com",
    "haircut-beard",
  );
  const validBookingResponse = await bookSlot(
    longWindowId,
    "Morgan Example",
    "morgan@example.com",
    "haircut-beard",
  );
  const validBooking = (await validBookingResponse.json()) as {
    data: {
      slot: { id: string };
      visitorName: string;
      serviceId: string;
      serviceDurationMinutes: number;
      priceMkd: number;
    };
  };

  assert.equal(invalidServiceResponse.status, 400);
  assert.equal(invalidServiceFilter.status, 400);
  assert.equal(tooLongServiceResponse.status, 409);
  assert.ok(shortServiceSlots.data.some((slot) => slot.id === shortWindowId));
  assert.ok(shortServiceSlots.data.some((slot) => slot.id === longWindowId));
  assert.ok(!longServiceSlots.data.some((slot) => slot.id === shortWindowId));
  assert.ok(longServiceSlots.data.some((slot) => slot.id === longWindowId));
  assert.equal(validBookingResponse.status, 201);
  assert.equal(validBooking.data.slot.id, longWindowId);
  assert.equal(validBooking.data.visitorName, "Morgan Example");
  assert.equal(validBooking.data.serviceId, "haircut-beard");
  assert.equal(validBooking.data.serviceDurationMinutes, 45);
  assert.equal(validBooking.data.priceMkd, 1250);

  assert.throws(
    () => database.prepare(
      `INSERT INTO bookings (
         id, slot_id, visitor_name, visitor_email, service_id,
         service_duration_minutes, price_mkd
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      shortWindowId,
      "Direct Insert",
      "direct@example.com",
      "haircut-beard",
      45,
      1250,
    ),
    (error: unknown) => sqliteErrorHasCode(error, "SQLITE_CONSTRAINT_TRIGGER"),
  );
});

test("booking requests from the original page default to Haircut", async () => {
  const slotId = await publishSlot(8, "14:00", 60);
  const response = await bookingsRoute.POST(
    requestWithJson({
      slotId,
      visitorName: "Taylor Example",
      visitorEmail: "taylor@example.com",
    }),
  );
  const result = (await response.json()) as {
    data?: {
      serviceId: string;
      serviceDurationMinutes: number;
      priceMkd: number;
    };
  };

  assert.equal(response.status, 201);
  assert.equal(result.data?.serviceId, "haircut");
  assert.equal(result.data?.serviceDurationMinutes, 30);
  assert.equal(result.data?.priceMkd, 900);
});

test("a visitor can book a slot and the public list hides it", async () => {
  const slotId = await publishSlot(6, "11:00");
  const response = await bookSlot(slotId, " Taylor Example ", "TAYLOR@EXAMPLE.COM");
  const bookingResult = (await response.json()) as {
    data: { visitorName: string; slot: { id: string } };
  };
  const publicResponse = listPublicSlots();
  const publicResult = (await publicResponse.json()) as {
    data: Record<string, unknown>[];
  };
  const hostResponse = hostSlotsRoute.GET();
  const hostResult = (await hostResponse.json()) as {
    data: { id: string; visitorName: string | null; visitorEmail: string | null }[];
  };
  const publicJson = JSON.stringify(publicResult);
  const hostSlot = hostResult.data.find((slot) => slot.id === slotId);

  assert.equal(response.status, 201);
  assert.equal(bookingResult.data.visitorName, "Taylor Example");
  assert.equal(bookingResult.data.slot.id, slotId);
  assert.ok(!("visitorEmail" in bookingResult.data));
  assert.ok(!publicResult.data.some((slot) => slot.id === slotId));
  assert.ok(!publicJson.includes("TAYLOR@EXAMPLE.COM"));
  assert.ok(!publicJson.includes("Taylor Example"));
  assert.deepEqual(Object.keys(publicResult.data[0] ?? {}).sort(), [
    "durationMinutes",
    "id",
    "startAt",
  ]);
  assert.equal(hostSlot?.visitorName, "Taylor Example");
  assert.equal(hostSlot?.visitorEmail, "taylor@example.com");
});

test("a booked slot cannot be booked again", async () => {
  const slotId = await publishSlot(7, "09:00");
  const firstAttempt = await bookSlot(slotId);
  const secondAttempt = await bookSlot(slotId, "Morgan Example", "morgan@example.com");
  const duplicateInsert = () =>
    database
      .prepare(
        `INSERT INTO bookings (id, slot_id, visitor_name, visitor_email)
         VALUES (?, ?, ?, ?)`,
      )
      .run(randomUUID(), slotId, "Second Visitor", "second@example.com");

  assert.equal(firstAttempt.status, 201);
  assert.equal(secondAttempt.status, 409);
  assert.throws(duplicateInsert, (error: unknown) =>
    sqliteErrorHasCode(error, "SQLITE_CONSTRAINT_UNIQUE"),
  );
});

test("simultaneous booking attempts create exactly one booking", async () => {
  const slotId = await publishSlot(8, "09:00");
  const responses = await Promise.all([
    bookSlot(slotId, "Visitor One", "one@example.com"),
    bookSlot(slotId, "Visitor Two", "two@example.com"),
  ]);

  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [201, 409],
  );
});

test("booked slots cannot be deleted and open slots can", async () => {
  const bookedId = await publishSlot(9, "09:00");
  await bookSlot(bookedId);
  const bookedDelete = await deleteSlotRoute.DELETE(new Request("http://localhost"), {
    params: Promise.resolve({ id: bookedId }),
  });

  const openId = await publishSlot(10, "09:00");
  const openDelete = await deleteSlotRoute.DELETE(new Request("http://localhost"), {
    params: Promise.resolve({ id: openId }),
  });

  assert.equal(bookedDelete.status, 409);
  assert.equal(openDelete.status, 200);
  assert.throws(
    () => database.prepare("DELETE FROM slots WHERE id = ?").run(bookedId),
    (error: unknown) =>
      sqliteErrorHasCode(error, "SQLITE_CONSTRAINT_TRIGGER") &&
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      error.message === "FOREIGN KEY constraint failed",
  );
});

test("Skopje daylight saving gaps and repeated times are rejected", () => {
  assert.equal(time.skopjeLocalTimeToTimestamp("2026-03-29", "02:30"), null);
  assert.equal(time.skopjeLocalTimeToTimestamp("2026-10-25", "02:30"), null);
});

