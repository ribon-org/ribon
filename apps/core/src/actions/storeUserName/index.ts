import { transactionDB } from "../../../db/client/transaction";
import { getUserById } from "../../data-access/db/users/getUserById";
import { getUserNameByUserId } from "../../data-access/db/users/getUserNameByUserId";
import { storeUserName as storeUserNameFromDB } from "../../data-access/db/users/storeUserName";

type StoreUserName = {
  userId: string;
  name: string;
  // authUserId: string;
};

export const storeUserName = async ({ userId, name }: StoreUserName) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("User not found");
    }

    // TODO: Add authenticated user check
    // if (user.supabaseAuthId !== authUserId) {
    //   throw new Error(
    //     "Forbidden: You don't have permission to register this user's name",
    //   );
    // }

    const existingUserName = await getUserNameByUserId(tx, user.id);
    if (existingUserName) {
      throw new Error("User name already exists");
    }

    const result = await storeUserNameFromDB(tx, {
      userId: user.id,
      name,
    });

    if (!result) {
      throw new Error("Failed to store user name");
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
