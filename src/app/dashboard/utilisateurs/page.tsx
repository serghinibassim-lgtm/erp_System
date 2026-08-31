"use client";

import { useState, useEffect } from "react";
import { Trash2, UserPlus } from "lucide-react";
import LoadingDots from "@/components/LoadingDots";
import { useAuth } from "@/context/AuthContext";

interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: string;
  creeLe: string;
}

export default function UtilisateursPage() {
  const { user } = useAuth();
  const isResponsable = user?.role === "RESPONSABLE";
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/utilisateurs");
      if (res.ok) {
        const data = await res.json();
        setUtilisateurs(data.utilisateurs);
      }
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaving(true);

    try {
      const res = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setUtilisateurs(prev => [...prev, data.utilisateur]);
        setNom("");
        setEmail("");
        setPassword("");
        setShowForm(false);
      } else {
        setError(data.error || "Erreur");
        if (data.errors) setFieldErrors(data.errors);
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try {
      const res = await fetch(`/api/utilisateurs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUtilisateurs(prev => prev.filter(u => u.id !== id));
      }
    } catch {
      console.error("Failed to delete user");
    }
  };

  if (!isResponsable) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center py-20">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Accès refusé</h1>
        <p className="text-muted-foreground">Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground md:text-base">Gestion des employés</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          {showForm ? "Annuler" : "Ajouter un employé"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
          <div className="flex flex-col gap-1 px-4 pt-4">
            <h2 className="text-lg font-semibold leading-snug">Nouvel employé</h2>
          </div>
          <div className="px-4 pb-4">
            <form onSubmit={handleCreate} className="space-y-4">
              {error && !fieldErrors.nom && !fieldErrors.email && !fieldErrors.password && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="space-y-2">
                <label htmlFor="nom" className="flex items-center gap-2 text-base leading-none font-medium select-none">Nom</label>
                <input
                  id="nom"
                  type="text"
                  placeholder="Nom de l'employé"
                  value={nom}
                  onChange={(e) => { setNom(e.target.value); setFieldErrors({}); }}
                  className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.nom ? "border-red-500" : "border-input"}`}
                  required
                />
                {fieldErrors.nom && <p className="text-sm text-red-500">{fieldErrors.nom}</p>}
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
                {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
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
                {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50"
                >
                  {saving ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground"><LoadingDots /></p>
      ) : utilisateurs.length === 0 ? (
        <div className="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 p-8 text-center">
          <p className="text-muted-foreground">Aucun utilisateur pour le moment</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Créé le</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{u.nom}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${
                        u.role === "RESPONSABLE"
                          ? "border-transparent bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      }`}>
                        {u.role === "RESPONSABLE" ? "Responsable" : "Employé"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(u.creeLe).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== "RESPONSABLE" && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-background text-red-600 hover:bg-red-50 px-2.5 h-7 text-xs font-medium transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
