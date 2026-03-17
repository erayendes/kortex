import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "kortex.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// ── Migrations ────────────────────────────────────────
try {
  const taskCols = (sqlite.prepare("PRAGMA table_info(tasks)").all() as { name: string }[]).map(c => c.name);
  if (taskCols.length > 0 && !taskCols.includes("task_number")) {
    sqlite.prepare("ALTER TABLE tasks ADD COLUMN task_number INTEGER NOT NULL DEFAULT 0").run();
    const rows = sqlite.prepare(
      "SELECT id, project_id FROM tasks ORDER BY created_at ASC"
    ).all() as { id: string; project_id: string }[];
    const counters: Record<string, number> = {};
    const stmt = sqlite.prepare("UPDATE tasks SET task_number = ? WHERE id = ?");
    for (const row of rows) {
      counters[row.project_id] = (counters[row.project_id] ?? 0) + 1;
      stmt.run(counters[row.project_id], row.id);
    }
  }
} catch (e) {
  console.warn("[db] Migration check skipped:", (e as Error).message);
}

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
