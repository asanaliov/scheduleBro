import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { database } from "@/lib/server/database";

export function applyMigrations(): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const migrationsDirectory = join(process.cwd(), "db", "migrations");
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of migrationFiles) {
    const alreadyApplied = database
      .prepare("SELECT 1 FROM schema_migrations WHERE name = ?")
      .get(fileName);

    if (alreadyApplied) {
      continue;
    }

    const sql = readFileSync(join(migrationsDirectory, fileName), "utf8");
    database
      .transaction(() => {
        database.exec(sql);
        database
          .prepare("INSERT INTO schema_migrations (name) VALUES (?)")
          .run(fileName);
      })
      .immediate();
  }
}
