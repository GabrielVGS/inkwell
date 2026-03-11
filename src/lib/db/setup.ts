import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function setup() {
  const sql = postgres(connectionString);

  console.log("Enabling pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  console.log("Done! Now run: npm run db:push");
  await sql.end();
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
