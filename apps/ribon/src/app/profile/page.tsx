"use client";

import { useUser } from "@repo/auth/client";
import { useEffect, useState } from "react";
import ProfileView from "@repo/ui/organisms/ProfileView";
import RegisterForm from "@repo/ui/organisms/ProfileRegisterForm";
import EditForm from "@repo/ui/organisms/ProfileEditForm";

interface UserProfile {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useUser();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${user.id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-600 dark:text-zinc-400">
          プロフィール情報が見つかりません
        </div>
      </div>
    );
  }

  // 初回登録フォーム
  if (!profile.name && !isEditMode) {
    return (
      <RegisterForm
        userId={user!.id}
        onSuccess={(name) => {
          setProfile((prev) => ({ ...prev!, name }));
        }}
      />
    );
  }

  // 編集フォーム
  if (isEditMode) {
    return (
      <EditForm
        userId={user!.id}
        currentName={profile.name || ""}
        onSuccess={(name) => {
          setProfile((prev) => ({ ...prev!, name }));
          setIsEditMode(false);
        }}
        onCancel={() => setIsEditMode(false)}
      />
    );
  }

  // プロフィール表示
  return <ProfileView profile={profile} onEdit={() => setIsEditMode(true)} />;
}
