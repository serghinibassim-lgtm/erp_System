"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, Plus, Pencil, Trash2 } from "lucide-react";

interface Parameter {
  id: string;
  key: string;
  value: string;
}

export default function ParametersPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [dialogItem, setDialogItem] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/parameters")
      .then(r => r.json())
      .then(data => {
        if (data.parameters) setParameters(data.parameters);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getValue = (key: string) => {
    return parameters.find(p => p.key === key)?.value || "";
  };

  const getItems = (key: string) => {
    const v = getValue(key);
    return v ? v.split("\n").filter(s => s.trim()) : [];
  };

  const handleChange = (key: string, value: string) => {
    setParameters(prev => {
      const existing = prev.find(p => p.key === key);
      if (existing) {
        return prev.map(p => p.key === key ? { ...p, value } : p);
      }
      return [...prev, { id: "", key, value }];
    });
  };

  const handleSave = async (key: string) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const value = getValue(key);
      const res = await fetch("/api/parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        const data = await res.json();
        setParameters(prev => {
          const existing = prev.find(p => p.key === key);
          if (existing) {
            return prev.map(p => p.key === key ? data.parameter : p);
          }
          return [...prev, data.parameter];
        });
      }
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const openAddDialog = (key: string) => {
    setEditingKey(key);
    setEditingIndex(null);
    setDialogItem("");
    setDialogOpen(true);
  };

  const openEditDialog = (key: string, index: number, item: string) => {
    setEditingKey(key);
    setEditingIndex(index);
    setDialogItem(item);
    setDialogOpen(true);
  };

  const confirmDialog = () => {
    if (!editingKey || !dialogItem.trim()) return;
    const items = getItems(editingKey);
    if (editingIndex !== null) {
      items[editingIndex] = dialogItem.trim();
    } else {
      items.push(dialogItem.trim());
    }
    handleChange(editingKey, items.join("\n"));
    handleSave(editingKey);
    setDialogOpen(false);
  };

  const handleDelete = (key: string, index: number) => {
    const items = getItems(key);
    items.splice(index, 1);
    handleChange(key, items.join("\n"));
    handleSave(key);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Paramètres</h1>
          <p className="text-sm text-muted-foreground md:text-base">Configuration de l&apos;application</p>
        </div>
        <Link href="/import">
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 sm:w-auto [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4">
            <Upload className="h-4 w-4" />
            Import Excel
          </button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <>
          <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
            <div className="flex flex-col gap-1 px-4 pt-4">
              <h2 className="text-lg font-semibold leading-snug">Seuils d&apos;alerte prix</h2>
            </div>
            <div className="space-y-6 px-4 pb-4">
              <div className="space-y-2">
                <label htmlFor="purchase_alert_threshold" className="flex items-center gap-2 text-base leading-none font-medium select-none">Seuil d&apos;alerte achat</label>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <input
                    id="purchase_alert_threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={getValue("purchase_alert_threshold")}
                    onChange={(e) => handleChange("purchase_alert_threshold", e.target.value)}
                    className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
                  />
                  <button
                    onClick={() => handleSave("purchase_alert_threshold")}
                    disabled={saving["purchase_alert_threshold"]}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:self-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                  >
                    Enregistrer
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alerte si prix d&apos;achat &gt; prix de réf. + seuil (&gt; prix réf.)
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="sale_alert_threshold" className="flex items-center gap-2 text-base leading-none font-medium select-none">Seuil d&apos;alerte vente</label>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <input
                    id="sale_alert_threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={getValue("sale_alert_threshold")}
                    onChange={(e) => handleChange("sale_alert_threshold", e.target.value)}
                    className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
                  />
                  <button
                    onClick={() => handleSave("sale_alert_threshold")}
                    disabled={saving["sale_alert_threshold"]}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:self-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                  >
                    Enregistrer
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alerte si prix de vente &lt; prix de réf. - seuil (&lt; prix réf.)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
            <div className="flex flex-col gap-1 px-4 pt-4">
              <h2 className="text-lg font-semibold leading-snug">Alerte stock faible</h2>
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Une alerte de stock est déclenchée automatiquement lorsque le stock
                courant d&apos;un produit atteint ou passe en dessous de son stock minimum.
                Le stock minimum est défini individuellement pour chaque produit dans
                sa fiche.
              </p>
            </div>
          </div>

          <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
            <div className="flex flex-row items-center justify-between gap-1 px-4 pt-4">
              <h2 className="text-lg font-semibold leading-snug">Catégories</h2>
              <button onClick={() => openAddDialog("categories")} className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-8 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </button>
            </div>
            <div className="px-4 pb-4">
              {getItems("categories").length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune catégorie</p>
              ) : (
                <ul className="space-y-2">
                  {getItems("categories").map((item, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm">{item}</span>
                      <div className="flex gap-1">
                        <button onClick={() => openEditDialog("categories", i, item)} className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-4 [&_svg]:shrink-0">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete("categories", i)} className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-4 [&_svg]:shrink-0">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
            <div className="flex flex-row items-center justify-between gap-1 px-4 pt-4">
              <h2 className="text-lg font-semibold leading-snug">Unités</h2>
              <button onClick={() => openAddDialog("units")} className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-8 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </button>
            </div>
            <div className="px-4 pb-4">
              {getItems("units").length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune unité</p>
              ) : (
                <ul className="space-y-2">
                  {getItems("units").map((item, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm">{item}</span>
                      <div className="flex gap-1">
                        <button onClick={() => openEditDialog("units", i, item)} className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-4 [&_svg]:shrink-0">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete("units", i)} className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-muted [&_svg]:size-4 [&_svg]:shrink-0">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {dialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/10" onClick={() => setDialogOpen(false)} />
              <div className="relative z-50 w-full max-w-[calc(100%-2rem)] rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 sm:max-w-sm">
                <div className="flex flex-col gap-2">
                  <h2 className="text-base font-medium leading-none">{editingIndex !== null ? "Modifier" : "Ajouter"}</h2>
                </div>
                <div className="space-y-4">
                  <input
                    value={dialogItem}
                    onChange={(e) => setDialogItem(e.target.value)}
                    placeholder="Nom"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") confirmDialog(); }}
                    className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDialogOpen(false)}
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmDialog}
                      disabled={!dialogItem.trim()}
                      className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                    >
                      {editingIndex !== null ? "Modifier" : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
