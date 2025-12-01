import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

/**
 * ユーザー名を更新
 */
export async function updateUserNameRecord(
  db: DB,
  data: { userNameId: string; name: string },
) {
  const [result] = await db
    .update(userNamesTable)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(userNamesTable.id, data.userNameId))
    .returning();

  return result;
}
