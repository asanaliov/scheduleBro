import "./load-env";

import { applyMigrations } from "@/lib/server/migrations";
import { database } from "@/lib/server/database";

try {
  applyMigrations();
  console.log("Database migrations are up to date.");
} finally {
  database.close();
}
