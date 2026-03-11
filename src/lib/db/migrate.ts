import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function migrate() {
  const sql = postgres(connectionString);

  console.log("Enabling pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      mood TEXT,
      mood_score REAL,
      energy_level REAL,
      tags JSONB DEFAULT '[]',
      embedding vector(768),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries (created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS reflections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS reflections_entry_id_idx ON reflections (entry_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS weekly_summaries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      period_start TIMESTAMPTZ NOT NULL,
      period_end TIMESTAMPTZ NOT NULL,
      content TEXT NOT NULL,
      themes JSONB DEFAULT '[]',
      mood_trend JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // HNSW index for fast vector similarity search
  await sql`
    CREATE INDEX IF NOT EXISTS entries_embedding_idx
    ON entries
    USING hnsw (embedding vector_cosine_ops)
  `;

  console.log("Migration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
