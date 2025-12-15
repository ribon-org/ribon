import Button from "./Button";

interface ProfileViewProps {
  profile: {
    name: string | null;
    createdAt: string;
    updatedAt: string;
  };
  onEdit: () => void;
}

const ProfileView = ({ profile, onEdit }: ProfileViewProps) => {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">プロフィール</h2>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className="label">
                <span className="label-text">名前</span>
              </dt>
              <dd className="mt-1 text-lg">{profile.name}</dd>
            </div>

            <div>
              <dt className="label">
                <span className="label-text">作成日</span>
              </dt>
              <dd className="mt-1 text-sm opacity-70">
                {new Date(profile.createdAt).toLocaleString("ja-JP")}
              </dd>
            </div>

            <div>
              <dt className="label">
                <span className="label-text">更新日</span>
              </dt>
              <dd className="mt-1 text-sm opacity-70">
                {new Date(profile.updatedAt).toLocaleString("ja-JP")}
              </dd>
            </div>
          </dl>

          <div className="card-actions mt-6">
            <Button onClick={onEdit} variant="primary" className="w-full">
              編集
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
