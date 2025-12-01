import { transactionDB } from "../../../db/client/transaction";
import {
  getUserById,
  getUserNameByUserId,
  updateUserNameRecord,
} from "../../data-access/db/users";

export interface UpdateUserNameInput {
  userId: string;
  name: string;
  authUserId: string;
}

/**
 * ユーザー名を更新
 */
export async function updateUserName(input: UpdateUserNameInput) {
  const { userId, name, authUserId } = input;

  return await transactionDB.transaction(async (tx) => {
    // 1. ユーザーが存在し、削除されていないことを確認
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("Not found: User does not exist");
    }

    // 2. 権限チェック（本人のデータのみ更新可能）
    if (user.supabaseAuthId !== authUserId) {
      throw new Error(
        "Forbidden: You don't have permission to update this user's name",
      );
    }

    // 3. 既存のユーザー名を確認
    const existingUserName = await getUserNameByUserId(tx, userId);
    if (!existingUserName) {
      throw new Error("Not found: User name does not exist");
    }

    // 4. 既存レコードを更新
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
}
