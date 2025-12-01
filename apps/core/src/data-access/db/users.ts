import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { usersTable } from "../../../db/schemas/usersTable";
import { userNamesTable } from "../../../db/schemas/userNamesTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

/**
 * ユーザーをIDで取得（Soft Delete対応）
 */
export async function getUserById(db: DB, userId: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
    .limit(1);

  return result[0] || null;
}

/**
 * ユーザー名を取得（Soft Delete対応）
 */
export async function getUserNameByUserId(db: DB, userId: string) {
  const result = await db
    .select()
    .from(userNamesTable)
    .where(
      and(eq(userNamesTable.userId, userId), isNull(userNamesTable.deletedAt)),
    )
    .limit(1);

  return result[0] || null;
}

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
