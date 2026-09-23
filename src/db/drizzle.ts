import * as schema from "@/db/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

const connectionString = process.env.DATABASE_URL!;

// Neon (production): communicate over standard HTTP (fetch).
// This avoids the "All attempts to open a WebSocket failed" errors in Node.js/Dev mode.
// Any other Postgres (local development): use the node-postgres driver.
const isNeon = /neon\.tech/.test(connectionString);

export const db = (isNeon
  ? drizzleNeon(neon(connectionString), { schema })
  : drizzlePg(connectionString, { schema })) as ReturnType<typeof drizzleNeon<typeof schema>>;
