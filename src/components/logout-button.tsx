"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton({
  mobile = false,
  label = "ログアウト",
  loadingLabel = "ログアウト中...",
}: {
  mobile?: boolean;
  label?: string;
  loadingLabel?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition hover:bg-white/10 ${
        mobile ? "w-full" : ""
      }`}
    >
      <LogOut size={16} />
      {loading ? loadingLabel : label}
    </button>
  );
}
