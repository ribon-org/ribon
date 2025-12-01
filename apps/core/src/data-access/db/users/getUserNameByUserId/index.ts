import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

export async function getUserNameByUserId(db: DB, userId: string) {
  const result = await db
    .select()
    .from(userNamesTable)
    .where(
      and(eq(userNamesTable.userId, userId), isNull(userNamesTable.deletedAt))
    )
    .limit(1);

  return result[0] || null;
}
