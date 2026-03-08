import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export const getUserNameByUserId = async (
  db: PostgresJsDatabase,
  userId: string
) => {
  const [result] = await db
    .select({
      id: userNamesTable.id,
      name: userNamesTable.name,
    })
    .from(userNamesTable)
    .where(
      and(eq(userNamesTable.userId, userId), isNull(userNamesTable.deletedAt))
    )
    .limit(1);

  return result || null;
};
