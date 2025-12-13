import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { usersTable } from "../../../../../db/schemas/usersTable";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export async function getUser(db: PostgresJsDatabase, userId: string) {
  const result = await db
    .select({
      id: usersTable.id,
      supabaseAuthId: usersTable.supabaseAuthId,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      name: userNamesTable.name,
    })
    .from(usersTable)
    .leftJoin(
      userNamesTable,
      and(
        eq(usersTable.id, userNamesTable.userId),
        isNull(userNamesTable.deletedAt),
      ),
    )
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
    .limit(1);

  return result[0] || null;
}
