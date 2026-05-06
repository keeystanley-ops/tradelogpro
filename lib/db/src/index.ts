import * as schema from "./schema";

let _db: ReturnType<typeof import("drizzle-orm/pglite").drizzle> | ReturnType<typeof import("drizzle-orm/node-postgres").drizzle>;

async function initDb() {
  if (process.env.DATABASE_URL) {
    // Use real PostgreSQL when DATABASE_URL is available
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { default: pg } = await import("pg");
    const { Pool } = pg;
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("supabase.com") ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client', err);
    });

    console.log("[DB] Using remote PostgreSQL (Supabase)");
    return drizzle(pool, { schema });
  } else {
    // Use PGlite (in-process WebAssembly PostgreSQL) for local dev
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { pushPgSchemaToLocalDB } = await import("./pglite-push");

    const client = new PGlite("C:\\Users\\Administrator\\trade-insight.db");
    const db = drizzle(client, { schema });

    // Auto-create tables from schema
    await pushPgSchemaToLocalDB(client);

    console.log("[DB] Using PGlite local database (trade-insight.db)");
    return db;
  }
}

// Export a proxy that lazily initializes the db
const dbProxy = new Proxy({} as any, {
  get(_, prop) {
    if (!_db) throw new Error("DB not initialized. Call initializeDb() first.");
    return (_db as any)[prop];
  }
});

export async function initializeDb() {
  _db = await initDb();
}

export const db = dbProxy;

export * from "./schema";
