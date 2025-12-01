import { transactionDB } from "../../../db/client/transaction";
import {
  getUserById,
  getUserNameByUserId,
  insertUserName,
} from "../../data-access/db/users";

export interface RegisterUserNameInput {
  userId: string;
  name: string;
  authUserId: string;
}

/**
 * ユーザー名を新規登録
 */
export async function registerUserName(input: RegisterUserNameInput) {
  const { userId, name, authUserId } = input;

  return await transactionDB.transaction(async (tx) => {
    // 1. ユーザーが存在し、削除されていないことを確認
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("Not found: User does not exist");
    }

    // 2. 権限チェック（本人のデータのみ登録可能）
    if (user.supabaseAuthId !== authUserId) {
      throw new Error(
        "Forbidden: You don't have permission to register this user's name",
      );
    }

    // 3. 既存のユーザー名を確認
    const existingUserName = await getUserNameByUserId(tx, userId);
    if (existingUserName) {
      throw new Error("Conflict: User name already exists");
    }

    // 4. 新規にユーザー名を作成
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
}
