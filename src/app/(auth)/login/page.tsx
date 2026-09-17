"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    const result = await login(email, password);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Erreur de connexion");
      if (result.errors) setFieldErrors(result.errors);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background px-4 py-12">
      <div className="flex w-full max-w-sm flex-col rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-border">
        <div className="flex flex-col items-center gap-2 px-6 pt-8 text-center">
          <Image src="/erp.png" alt="MagasinPilot" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover shadow-md" />
          <h1 className="text-2xl font-extrabold tracking-tight">MagasinPilot</h1>
          <p className="text-sm text-muted-foreground">Connectez-vous à votre compte</p>
        </div>
        <div className="px-6 pb-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !fieldErrors.email && !fieldErrors.password && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-base leading-none font-medium select-none">Email</label>
              <input
                id="email"
                type="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }}
                className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.email ? "border-red-500" : "border-input"}`}
                required
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-base leading-none font-medium select-none">Mot de passe</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors({}); }}
                  className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 pr-10 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.password ? "border-red-500" : "border-input"}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-10 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4">
              <LogIn className="h-4 w-4" />
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-primary hover:underline">Créer un compte</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
