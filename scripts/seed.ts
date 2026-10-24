import "./load-env";

import { randomUUID } from "node:crypto";
import { database } from "@/lib/server/database";
import { applyMigrations } from "@/lib/server/migrations";
import { scheduleDateValue, skopjeLocalTimeToTimestamp } from "@/lib/time";

try {
  applyMigrations();

  const slotCount = database
    .prepare("SELECT COUNT(*) AS count FROM slots")
    .get() as { count: number };

  if (slotCount.count > 0) {
    console.log("Seed skipped because the schedule already has slots.");
  } else {
    const now = new Date();
    const seeded = 3;

    for (let daysFromToday = 2; daysFromToday <= 6; daysFromToday += 2) {
      const date = scheduleDateValue(
        now.getTime() + daysFromToday * 24 * 60 * 60 * 1000,
      );
      const startAtMs = skopjeLocalTimeToTimestamp(date, "10:00");

      if (startAtMs !== null) {
        database
          .prepare(
            "INSERT INTO slots (id, start_at_ms, duration_minutes) VALUES (?, ?, ?)",
          )
          .run(randomUUID(), startAtMs, 30);
      }
    }

    console.log(`Added ${seeded} example slots. No visitor data was created.`);
  }
} finally {
  database.close();
}
