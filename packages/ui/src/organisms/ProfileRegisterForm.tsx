"use client";

import { useState } from "react";
import Button from "../atoms/Button";

interface RegisterFormProps {
  userId: string;
  onSuccess: (name: string) => void;
}

const RegisterForm = ({ userId, onSuccess }: RegisterFormProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("名前を入力してください");
      return;
    }

    if (trimmedName.length > 255) {
      setError("名前は255文字以内で入力してください");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}/name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "登録に失敗しました");
        return;
      }

      onSuccess(trimmedName);
    } catch (err) {
      setError("ネットワークエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">プロフィール登録</h2>
          <p className="text-sm opacity-70">
            プロフィール情報を登録してください
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="form-control">
              <label htmlFor="name" className="label">
                <span className="label-text">名前</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                required
                maxLength={255}
                className="input input-bordered w-full"
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              className="w-full"
            >
              {isSubmitting ? "登録中..." : "登録"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
