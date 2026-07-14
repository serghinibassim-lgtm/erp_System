"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface Client {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  address: string | null;
}

interface FormState {
  code: string; name: string; phone: string; address: string;
}

const emptyForm: FormState = { code: "", name: "", phone: "", address: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      if (res.ok) setClients(data.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingId(c.id);
    setForm({ code: c.code, name: c.name, phone: c.phone || "", address: c.address || "" });
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchClients();
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
      const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setOpen(false);
        fetchClients();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Clients</h1>
          <p className="text-sm text-muted-foreground md:text-base">Gestion des clients</p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto"
          onClick={openCreate}
        >
          Nouveau client
        </button>
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
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <td colSpan={5} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap">Chargement...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <td colSpan={5} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap">Aucun client trouvé</td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td className="p-3 align-middle whitespace-nowrap font-medium">{c.code}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{c.name}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{c.phone || "-"}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{c.address || "-"}</td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    <div className="flex gap-1">
                      <button
                        className="size-6 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-5 [&_svg]:shrink-0"
                        onClick={() => openEdit(c)}
                        title="Modifier"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        className="size-6 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-5 [&_svg]:shrink-0"
                        onClick={() => setDeleteTarget(c)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </td>
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
              <h2 className="text-base font-medium leading-none">{editingId ? "Modifier le client" : "Ajouter un client"}</h2>
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
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="name">Nom</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="phone">Téléphone</label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="address">Adresse</label>
                <input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
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
              Êtes-vous sûr de vouloir supprimer le client <strong>{deleteTarget?.name}</strong> (code {deleteTarget?.code}) ? Cette action est irréversible.
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
