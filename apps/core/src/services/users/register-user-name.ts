import { transactionDB } from "../../../db/client/transaction";
import { getUserById } from "../../data-access/db/users/getUserById";
import { getUserNameByUserId } from "../../data-access/db/users/getUserNameByUserId";
import { insertUserName } from "../../data-access/db/users/insertUserName";

type RegisterUserName = {
  userId: string;
  name: string;
  authUserId: string;
};

export const registerUserName = async ({
  userId,
  name,
  authUserId,
}: RegisterUserName) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("Not found: User does not exist");
    }

    if (user.supabaseAuthId !== authUserId) {
      throw new Error(
        "Forbidden: You don't have permission to register this user's name"
      );
    }

    const existingUserName = await getUserNameByUserId(tx, userId);
    if (existingUserName) {
      throw new Error("Conflict: User name already exists");
    }

    const result = await insertUserName(tx, {
      userId,
      name,
    });

    if (!result) {
      throw new Error("Failed to create user name");
    }

    return {
      id: result.id,
      userId: result.userId,
      name: result.name,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  });
};
