import { transactionDB } from "../../../db/client/transaction";
import { getUserById } from "../../data-access/db/users/getUserById";
import { getUserNameByUserId } from "../../data-access/db/users/getUserNameByUserId";
import { updateUserNameRecord } from "../../data-access/db/users/updateUserNameRecord";

export type UpdateUserName = {
  userId: string;
  name: string;
  authUserId: string;
};

export const updateUserName = async ({
  userId,
  name,
  authUserId,
}: UpdateUserName) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("Not found: User does not exist");
    }

    if (user.supabaseAuthId !== authUserId) {
      throw new Error(
        "Forbidden: You don't have permission to update this user's name",
      );
    }

    const existingUserName = await getUserNameByUserId(tx, userId);
    if (!existingUserName) {
      throw new Error("Not found: User name does not exist");
    }

    const result = await updateUserNameRecord(tx, {
      userNameId: existingUserName.id,
      name,
    });

    if (!result) {
      throw new Error("Failed to update user name");
    }

    return {
      id: result.id,
      userId: result.userId,
      name: result.name,
      updatedAt: result.updatedAt,
    };
  });
};
