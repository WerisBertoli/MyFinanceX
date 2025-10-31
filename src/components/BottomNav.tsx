"use client";
import Link from "next/link";
import { Home, Plus, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-black/10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="relative mx-auto max-w-md">
        <div className="grid grid-cols-3 gap-1 p-3 items-end">
          {/* Dashboard */}
          <Link href="/" className={`flex flex-col items-center gap-1 py-1 rounded-2xl ${isActive("/") ? "text-black" : "text-black/60"}`}>
            <Home size={20} />
            <span className="text-[11px]">Dashboard</span>
          </Link>

          {/* Central + button */}
          <div className="flex items-center justify-center">
            <Link href="/add" className="-mt-6 w-14 h-14 rounded-full bg-black text-white grid place-items-center shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <Plus size={24} />
            </Link>
          </div>

          {/* User Settings */}
          <Link href="/settings" className={`flex flex-col items-center gap-1 py-1 rounded-2xl ${isActive("/settings") ? "text-black" : "text-black/60"}`}>
            <Settings size={20} />
            <span className="text-[11px]">Configurações</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
