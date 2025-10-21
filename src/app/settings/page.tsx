"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { logout, watchAuth } from "@/lib/auth";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchAuth((user) => setEmail(user?.email ?? null));
    return () => unsub?.();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <div className="max-w-md mx-auto px-4">
        <Navbar />

        <div className="mt-4 rounded-3xl bg-white p-6 border border-black/5">
          <h1 className="text-xl font-bold">Settings</h1>
          <div className="mt-4">
            <div className="text-sm text-black/60">Signed in as</div>
            <div className="text-sm font-medium">{email || "Demo mode / Not signed in"}</div>
          </div>

          <button
            onClick={async () => { await logout(); window.location.href = "/login"; }}
            className="mt-6 w-full h-11 rounded-xl bg-black text-white font-medium"
          >
            Log out
          </button>
        </div>

        <div className="h-24" />
      </div>
    </div>
  );
}