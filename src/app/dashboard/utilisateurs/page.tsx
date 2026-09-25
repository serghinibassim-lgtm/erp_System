"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, UserPlus } from "lucide-react";
import LoadingDots from "@/components/LoadingDots";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";

interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: string;
  creeLe: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const PAGE_LIMIT = 20;

export default function UtilisateursPage() {
  const { user } = useAuth();
  const isResponsable = user?.role === "RESPONSABLE";
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Utilisateur | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));
      const res = await fetch(`/api/utilisateurs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUtilisateurs(data.utilisateurs);
        setPagination(data.pagination);
      }
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
        setNom("");
        setEmail("");
        setPassword("");
        setShowForm(false);
        fetchUsers();
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/utilisateurs/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        if (utilisateurs.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          fetchUsers();
        }
      }
    } catch {
      console.error("Failed to delete user");
    } finally {
      setDeleting(false);
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
    <div className="space-y-6">
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

      <div className="overflow-hidden rounded-md border">
        <div className="relative w-full overflow-x-auto">
          <table className="w-full caption-bottom text-base border-collapse">
            <thead className="[&_tr]:border-b">
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Nom</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Email</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Rôle</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Créé le</th>
                <th className="h-11 px-3 text-right align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td colSpan={5} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap"><LoadingDots /></td>
                </tr>
              ) : utilisateurs.length === 0 ? (
                <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td colSpan={5} className="p-3 align-middle text-sm text-center py-8 text-muted-foreground">Aucun utilisateur pour le moment</td>
                </tr>
              ) : (
                utilisateurs.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                    <td className="p-3 align-middle whitespace-nowrap text-sm font-medium">{u.nom}</td>
                    <td className="p-3 align-middle whitespace-nowrap text-sm text-muted-foreground">{u.email}</td>
                    <td className="p-3 align-middle whitespace-nowrap text-sm">
                      <span className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${
                        u.role === "RESPONSABLE"
                          ? "border-transparent bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      }`}>
                        {u.role === "RESPONSABLE" ? "Responsable" : "Employé"}
                      </span>
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(u.creeLe).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3 align-middle text-right">
                      {u.role !== "RESPONSABLE" && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-background text-red-600 hover:bg-red-50 px-2.5 h-7 text-xs font-medium transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/10" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-50 w-full max-w-[calc(100%-2rem)] rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 sm:max-w-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-medium leading-none">Confirmer la suppression</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Êtes-vous sûr de vouloir supprimer l&apos;employé <strong>{deleteTarget?.nom}</strong> ({deleteTarget?.email}) ? Cette action est irréversible.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                onClick={() => setDeleteTarget(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                onClick={confirmDelete}
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
