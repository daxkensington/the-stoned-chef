import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { admins } from "../drizzle/schema";
import { hashPassword } from "../server/_core/auth";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const username = process.argv[2] || "admin";
  const password = process.argv[3];
  if (!password) {
    console.error("Usage: npx tsx scripts/seed-admin.ts <username> <password>");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle({ client: sql });

  const passwordHash = hashPassword(password);

  await db
    .insert(admins)
    .values({ username, passwordHash })
    .onConflictDoUpdate({
      target: admins.username,
      set: { passwordHash, updatedAt: new Date() },
    });

  console.log(`Admin user "${username}" created/updated successfully.`);
}

main().catch(console.error);
