import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

type DatabaseGlobal = typeof globalThis & {
  scheduleBroDatabase?: Database.Database;
};

const globalForDatabase = globalThis as DatabaseGlobal;

function createDatabase(): Database.Database {
  const databasePath = resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.DATABASE_PATH ?? "./data/schedule-bro.sqlite",
  );

  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");

  return database;
}

export const database =
  globalForDatabase.scheduleBroDatabase ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.scheduleBroDatabase = database;
}
