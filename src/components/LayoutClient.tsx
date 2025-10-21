"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "./BottomNav";
import { watchAuth } from "@/lib/auth";
import { getFirebase } from "@/lib/firebase";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const noNavRoutes = ["/login"];    
    const showNav = !noNavRoutes.includes(pathname);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const { isConfigured } = getFirebase();
        if (!isConfigured) {
            setReady(true); // demo mode, não precisa aguardar auth
            return;
        }
        const unsub = watchAuth((user) => {
            const isLogged = Boolean(user?.uid);
            if (!isLogged && pathname !== "/login") {
                router.replace("/login");
            }
            setReady(true);
        });
        return () => unsub?.();
    }, [pathname, router]);

    if (!ready && pathname !== "/login") {
        return null; // evita flicker antes do primeiro estado de auth
    }

    return (
        <>
            <div className={showNav ? "pb-24" : ""}>{children}</div>
            {showNav && <BottomNav />}
        </>
    )
}