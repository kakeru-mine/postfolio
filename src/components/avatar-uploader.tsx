"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, UserRound } from "lucide-react";

export function AvatarUploader({
  initialAvatarUrl,
  label,
}: {
  initialAvatarUrl: string | null;
  label: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateAvatar(file: File) {
    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.set("avatar", file);

    const response = await fetch("/api/account/avatar", {
      method: "PATCH",
      body: formData,
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.message ?? "画像の保存に失敗しました。");
      setSaving(false);
      return;
    }

    setAvatarUrl(result.avatarUrl);
    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        className="group relative grid size-16 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200 transition hover:ring-[var(--primary)]"
        aria-label={`${label}の画像を変更`}
        onClick={() => inputRef.current?.click()}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <UserRound size={26} />
        )}
        <span className="absolute inset-0 grid place-items-center bg-slate-950/45 text-white opacity-0 transition group-hover:opacity-100">
          {saving ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Camera size={18} />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        disabled={saving}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void updateAvatar(file);
        }}
      />
      {error ? <p className="mt-2 text-xs font-bold text-red-500">{error}</p> : null}
    </div>
  );
}
