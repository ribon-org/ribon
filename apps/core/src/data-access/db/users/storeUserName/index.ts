import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export const storeUserName = async (
  db: PostgresJsDatabase,
  data: { userId: string; name: string }
) => {
  const [user] = await db.insert(userNamesTable).values(data).returning();

  return user || null;
};
