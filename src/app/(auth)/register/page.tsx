"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        await login(email, password);
        router.push("/dashboard");
      } else {
        setError(data.error || "Erreur d'inscription");
        if (data.errors) setFieldErrors(data.errors);
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 px-4 pt-4 text-center">
          <h2 className="text-lg font-semibold leading-snug">ERP Gestion Magasin</h2>
          <p className="text-sm text-muted-foreground">Créez votre compte responsable</p>
        </div>
        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !fieldErrors.nom && !fieldErrors.email && !fieldErrors.password && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="space-y-2">
              <label htmlFor="nom" className="flex items-center gap-2 text-base leading-none font-medium select-none">Nom</label>
              <input
                id="nom"
                type="text"
                placeholder="Votre nom"
                value={nom}
                onChange={(e) => { setNom(e.target.value); setFieldErrors({}); }}
                className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.nom ? "border-red-500" : "border-input"}`}
                required
              />
              {fieldErrors.nom && (
                <p className="text-sm text-red-500">{fieldErrors.nom}</p>
              )}
            </div>
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
              <input
                id="password"
                type="password"
                placeholder="Au moins 6 caractères"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors({}); }}
                className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.password ? "border-red-500" : "border-input"}`}
                required
                minLength={6}
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50">
              {loading ? "Création..." : "Créer mon compte"}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline">Se connecter</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
