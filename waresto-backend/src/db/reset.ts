import { db } from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function reset() {
  console.log("🔥 Resetting database...");

  try {
    // Drop everything
    await db.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;");
    console.log("✅ Database cleared.");

    // Read the migration file
    const migrationPath = path.join(__dirname, "migrations", "0000_noisy_rictor.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    // Split statements by statement-breakpoint
    const statements = sql.split("--> statement-breakpoint");

    console.log("🚀 Applying migration...");
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement);
      }
    }
    console.log("✅ Migration applied.");

  } catch (err) {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  }

  process.exit(0);
}

reset();
