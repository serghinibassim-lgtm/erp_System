"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Supplier {
  id: string;
  code: string;
  nom: string;
  telephone: string | null;
  adresse: string | null;
  ice: string | null;
}

interface FormState {
  code: string; nom: string; telephone: string; adresse: string; ice: string;
}

const emptyForm: FormState = { code: "", nom: "", telephone: "", adresse: "", ice: "" };

export default function SuppliersPage() {
  const { user } = useAuth();
  const isResponsable = user?.role === "RESPONSABLE";
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/fournisseurs?${params}`);
      const data = await res.json();
      if (res.ok) setSuppliers(data.fournisseurs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({ code: s.code, nom: s.nom, telephone: s.telephone || "", adresse: s.adresse || "", ice: s.ice || "" });
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/fournisseurs/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchSuppliers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/fournisseurs/${editingId}` : "/api/fournisseurs";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setOpen(false);
        fetchSuppliers();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Fournisseurs</h1>
          <p className="text-sm text-muted-foreground md:text-base">Gestion des fournisseurs</p>
        </div>
        {isResponsable && (
          <button
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto"
            onClick={openCreate}
          >
            Nouveau fournisseur
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-sm"
        />
      </div>

      <div className="relative w-full overflow-x-auto rounded-md border">
        <table className="w-full caption-bottom text-base border-collapse">
          <thead className="[&_tr]:border-b">
            <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Code</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Nom</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Téléphone</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Adresse</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">ICE</th>
              {isResponsable && <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <td colSpan={isResponsable ? 6 : 5} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap">Chargement...</td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <td colSpan={isResponsable ? 6 : 5} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap">Aucun fournisseur trouvé</td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td className="p-3 align-middle whitespace-nowrap font-medium">{s.code}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.nom}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.telephone || "-"}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.adresse || "-"}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.ice || "-"}</td>
                  {isResponsable && (
                    <td className="p-3 align-middle whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          className="size-6 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-5 [&_svg]:shrink-0"
                          onClick={() => openEdit(s)}
                          title="Modifier"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          className="size-6 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-5 [&_svg]:shrink-0"
                          onClick={() => setDeleteTarget(s)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/10" onClick={() => setOpen(false)} />
          <div className="relative z-50 w-full max-w-[calc(100%-2rem)] rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 sm:max-w-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-medium leading-none">{editingId ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="code">Code</label>
                <input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
                  required
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="nom">Nom</label>
                <input
                  id="nom"
                  value={form.nom}
                  onChange={(e) => setForm(p => ({ ...p, nom: e.target.value }))}
                  required
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="telephone">Téléphone</label>
                <input
                  id="telephone"
                  value={form.telephone}
                  onChange={(e) => setForm(p => ({ ...p, telephone: e.target.value }))}
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="adresse">Adresse</label>
                <input
                  id="adresse"
                  value={form.adresse}
                  onChange={(e) => setForm(p => ({ ...p, adresse: e.target.value }))}
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="ice">ICE</label>
                <input
                  id="ice"
                  value={form.ice}
                  onChange={(e) => setForm(p => ({ ...p, ice: e.target.value }))}
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                >
                  {saving ? "..." : editingId ? "Modifier" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/10" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-50 w-full max-w-[calc(100%-2rem)] rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 sm:max-w-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-medium leading-none">Confirmer la suppression</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{deleteTarget?.nom}</strong> (code {deleteTarget?.code}) ? Cette action est irréversible.
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
