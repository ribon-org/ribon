import { transactionDB } from "../../../db/client/transaction";
import { getUser as getUserFromDB } from "../../data-access/db/users/getUser";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

type GetUser = {
  userId: string;
};

export const getUser = async ({ userId }: GetUser) => {
  return await transactionDB.transaction(async (tx: PostgresJsDatabase) => {
    const user = await getUserFromDB(tx, userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
};
