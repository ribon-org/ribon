import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { usersTable } from "../../../../../db/schemas/usersTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

export async function getUserById(db: DB, supabaseAuthId: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.supabaseAuthId, supabaseAuthId),
        isNull(usersTable.deletedAt),
      ),
    )
    .limit(1);

  return result[0] || null;
}
