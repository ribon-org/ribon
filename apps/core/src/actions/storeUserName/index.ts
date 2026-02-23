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
      throw new Error("ユーザーが存在しません");
    }

    // TODO: 認証ユーザーのチェックを追加
    // if (user.supabaseAuthId !== authUserId) {
    //   throw new Error(
    //     "Forbidden: You don't have permission to register this user's name",
    //   );
    // }

    // 内部IDを使用して既存のユーザー名をチェック
    const existingUserName = await getUserNameByUserId(tx, user.id);
    if (existingUserName) {
      throw new Error("ユーザー名が既に存在します");
    }

    // 内部IDを使用してユーザー名を保存
    const result = await storeUserNameFromDB(tx, {
      userId: user.id,
      name,
    });

    if (!result) {
      throw new Error("ユーザー名の登録に失敗しました");
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
