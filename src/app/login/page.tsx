"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth, signInEmailPassword, signUpEmailPassword } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = watchAuth((user) => {
      if (user) router.replace("/");
    });
    return () => unsub?.();
  }, [router]);

  const invalidSignup = useMemo(() => {
    if (mode !== "signup") return false;
    if (!email || password.length < 6) return true;
    return password !== confirm;
  }, [mode, email, password, confirm]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        if (!email || !password) throw new Error("Informe email e senha.");
        await signInEmailPassword(email, password);
      } else {
        if (invalidSignup) throw new Error("As senhas precisam coincidir e ter 6+ caracteres.");
        await signUpEmailPassword(email, password);
      }
      // Não faz router.replace aqui; o watchAuth cuida do redirecionamento
    } catch (e: any) {
      setError(e?.message || "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  };

  // Evita SSR do formulário (impede injeção de extensões antes da hidratação)
  if (!mounted) {
    return <div className="min-h-screen bg-white" suppressHydrationWarning />;
  }

  return (
    <div
      className="min-h-screen grid place-items-center bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: "url('/MyFinanceX Logotipo.svg')" }}
    >
      <div className="w-full max-w-md p-6 bg-white/80 backdrop-blur-sm rounded-2xl" suppressHydrationWarning>
        {/* Logo */}
        <div className="mx-auto mb-6 grid place-items-center">
          <div className="w-14 h-14 rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] grid place-items-center">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-center">Log in to your account</h1>
        <p className="text-center text-black/60 mt-2">Welcome back! Please enter your details.</p>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("signup")}
            className={`h-10 rounded-xl border text-sm font-medium ${mode === "signup" ? "bg-black text-white border-black" : "bg-white border-black/10"}`}
          >
            Sign up
          </button>
          <button
            onClick={() => setMode("signin")}
            className={`h-10 rounded-xl border text-sm font-medium ${mode === "signin" ? "bg-black text-white border-black" : "bg-white border-black/10"}`}
          >
            Log in
          </button>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <div className="relative" suppressHydrationWarning>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="off"
                className="w-full h-11 px-4 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
                suppressHydrationWarning
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative" suppressHydrationWarning>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
                className="w-full h-11 px-4 pr-10 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-2 grid place-items-center px-2 text-black/60 hover:text-black"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.02-2.82 2.95-5.1 5.39-6.53"/><path d="M22 12c-.51 1.44-1.3 2.77-2.31 3.9"/><path d="M3 3l18 18"/><path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 3-3"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="off"
                className="w-full h-11 px-4 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
                suppressHydrationWarning
              />
              {confirm && password !== confirm && (
                <div className="mt-1 text-xs text-red-600">As senhas não coincidem.</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="rounded border-black/20" suppressHydrationWarning />
              Remember for 30 days
            </label>
            <button className="text-[#7C3AED]">Forgot password</button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (mode === "signup" && invalidSignup)}
            className="w-full h-11 rounded-xl bg-[#7C3AED] text-white font-medium hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Carregando..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>

          <button
            type="button"
            className="w-full h-11 rounded-xl border border-black/10 bg-white font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" width="20" height="20">
              <path fill="#EA4335" d="M533.5 278.4c0-18.5-1.7-36.3-4.9-53.6H272v101.5h146.9c-6.3 34.2-25.1 63.2-53.6 82.6v68h86.7c50.7-46.7 81.5-115.5 81.5-198.5z"/>
              <path fill="#34A853" d="M272 544.3c72.9 0 134.2-24.2 178.9-65.5l-86.7-68c-24.1 16.2-55 25.9-92.2 25.9-70.8 0-130.8-47.8-152.3-112.1H30.7v70.3C75 482.6 167.1 544.3 272 544.3z"/>
              <path fill="#4A90E2" d="M119.7 324.6c-10.1-30.2-10.1-62.7 0-92.9V161.4H30.7c-40.6 81.2-40.6 176.7 0 257.9l89-70.7z"/>
              <path fill="#FBBC05" d="M272 107.7c39.6-.6 77.7 14 106.7 40.9l79.7-79.7C422.5 25.3 351.2-.9 272 0 167.1 0 75 61.7 30.7 161.4l89 70.3C141.2 155.8 201.2 107.7 272 107.7z"/>
            </svg>
            Sign in with Google
          </button>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-6 text-center text-sm">
          Don't have an account? {" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-[#7C3AED]">
            {mode === "signin" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}