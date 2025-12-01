import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

/**
 * ユーザー名を新規作成
 */
export async function insertUserName(
  db: DB,
  data: { userId: string; name: string },
) {
  const [result] = await db.insert(userNamesTable).values(data).returning();

  return result;
}
