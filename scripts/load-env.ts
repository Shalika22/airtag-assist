import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

/**
 * Load env vars for Node scripts.
 * Next.js loads `.env.local` automatically for the app runtime,
 * but `tsx scripts/*.ts` does not unless we do this explicitly.
 */
export function loadEnv() {
  const cwd = process.cwd();
  const candidates = [".env.local", ".env"];

  for (const file of candidates) {
    const p = path.join(cwd, file);
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
    }
  }
}


