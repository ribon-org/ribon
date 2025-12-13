import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export const updateUserNameRecord = async (
  db: PostgresJsDatabase,
  data: { userNameId: string; name: string },
) => {
  const [result] = await db
    .update(userNamesTable)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(userNamesTable.id, data.userNameId))
    .returning();

  return result || null;
};
