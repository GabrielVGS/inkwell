import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function migrate() {
  const sql = postgres(connectionString);

  console.log("Enabling pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  // --- Better Auth tables ---

  console.log("Creating auth tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  // --- App tables ---

  console.log("Creating app tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
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

  // Add user_id column if missing (migration from pre-auth schema)
  const hasUserIdOnEntries = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'user_id'
  `;
  if (hasUserIdOnEntries.length === 0) {
    console.log("Adding user_id to entries...");
    await sql`ALTER TABLE entries ADD COLUMN user_id TEXT`;
    // Existing entries without a user will be cleaned up manually
  }

  await sql`CREATE INDEX IF NOT EXISTS entries_user_id_idx ON entries (user_id)`;

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
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
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
