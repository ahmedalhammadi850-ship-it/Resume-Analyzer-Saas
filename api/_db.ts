import pg from "pg";

const { Pool } = pg;

let pool: InstanceType<typeof Pool> | null = null;

export function getPool(): InstanceType<typeof Pool> {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

export function mapUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    plan: row.plan,
    remainingScans: row.remaining_scans,
    role: row.role,
    resumeName: row.resume_name,
    suspended: row.suspended,
    upgradeRequest: row.upgrade_request,
    createdAt: row.created_at,
  };
}

export function mapAnalysis(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    analysisType: row.analysis_type,
    fileName: row.file_name,
    results: row.results,
    score: row.score,
    createdAt: row.created_at,
  };
}
