import { transactionDB } from "../../../db/client/transaction";
import { getUserById } from "../../data-access/db/users/getUserById";
import { getUserNameByUserId } from "../../data-access/db/users/getUserNameByUserId";
import { updateUserNameRecord } from "../../data-access/db/users/updateUserNameRecord";

type UpdateUserName = {
  userId: string;
  name: string;
  // authUserId: string;
};

export const updateUserName = async ({
  userId,
  name,
}: // authUserId,
UpdateUserName) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("User not found");
    }

    // TODO: Add authenticated user check
    // if (user.supabaseAuthId !== authUserId) {
    //   throw new Error(
    //     "Forbidden: You don't have permission to update this user's name",
    //   );
    // }

    const existingUserName = await getUserNameByUserId(tx, user.id);
    if (!existingUserName) {
      throw new Error("User name not found");
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
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  });
};
