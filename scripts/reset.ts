import "./load-env";

import { rmSync } from "node:fs";
import { resolve } from "node:path";

const databasePath = resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? "./data/schedule-bro.sqlite",
);

for (const filePath of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
  rmSync(filePath, { force: true });
}

async function resetDatabase(): Promise<void> {
  const { applyMigrations } = await import("@/lib/server/migrations");
  const { database } = await import("@/lib/server/database");

  try {
    applyMigrations();
    console.log("The local Schedule-Bro database has been reset.");
  } finally {
    database.close();
  }
}

void resetDatabase();
