"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoadingDots from "@/components/LoadingDots";

interface HistoriquePrix {
  id: string;
  ancienPrixAchat: number | null;
  nouveauPrixAchat: number | null;
  ancienPrixVente: number | null;
  nouveauPrixVente: number | null;
  dateChangement: string;
  raison: string | null;
}

interface Stock {
  stockActuel: number;
  stockInitial: number;
  totalAchats: number;
  totalVentes: number;
  statutStock: string;
  valeurAchat: number;
  valeurVente: number;
  margePotentielle: number;
}

interface Produit {
  id: string;
  code: string;
  designation: string;
  categorie: string;
  unite: string;
  prixAchatRef: number;
  prixVenteRef: number;
  stockInitial: number;
  stockMin: number;
  stock: Stock | null;
  historiquePrix: HistoriquePrix[];
}

export default function ProduitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const isResponsable = user?.role === "RESPONSABLE";

  const [produit, setProduit] = useState<Produit | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    code: "", designation: "", categorie: "", unite: "",
    prixAchatRef: "", prixVenteRef: "", stockInitial: "", stockMin: "",
    raisonPrix: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProduit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produits/${id}`);
      const data = await res.json();
      if (res.ok && data.produit) {
        setProduit(data.produit);
        const p = data.produit;
        setForm({
          code: p.code, designation: p.designation, categorie: p.categorie, unite: p.unite,
          prixAchatRef: String(Number(p.prixAchatRef)),
          prixVenteRef: String(Number(p.prixVenteRef)),
          stockInitial: String(p.stockInitial), stockMin: String(p.stockMin),
          raisonPrix: "",
        });
      } else {
        setError("Produit introuvable");
      }
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduit(); }, [fetchProduit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({});
  };

  const handleSave = async () => {
    setError("");
    setFieldErrors({});
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        code: form.code, designation: form.designation, categorie: form.categorie, unite: form.unite,
        prixAchatRef: parseFloat(form.prixAchatRef) || 0,
        prixVenteRef: parseFloat(form.prixVenteRef) || 0,
        stockInitial: parseInt(form.stockInitial) || 0,
        stockMin: parseInt(form.stockMin) || 0,
      };

      const changedPrices =
        Number(produit?.prixAchatRef) !== Number(body.prixAchatRef) ||
        Number(produit?.prixVenteRef) !== Number(body.prixVenteRef);

      if (changedPrices && form.raisonPrix.trim()) {
        body.raisonPrix = form.raisonPrix.trim();
      }

      const res = await fetch(`/api/produits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setEditing(false);
        fetchProduit();
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

  if (loading) {
    return <p className="text-muted-foreground"><LoadingDots /></p>;
  }

  if (error && !produit) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error}</p>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
          onClick={() => router.push("/dashboard/produits")}
        >
          Retour
        </button>
      </div>
    );
  }

  if (!produit) return null;

  const margin = Number(produit.prixVenteRef) - Number(produit.prixAchatRef);
  const marginRate = Number(produit.prixAchatRef) > 0
    ? (margin / Number(produit.prixAchatRef) * 100).toFixed(1)
    : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{produit.designation}</h1>
          <p className="text-sm text-muted-foreground md:text-base">Code: {produit.code} | Catégorie: {produit.categorie}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            isResponsable && (
              <button
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                onClick={() => setEditing(true)}
              >
                Modifier
              </button>
            )
          ) : (
            <>
              <button
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
                onClick={() => { setEditing(false); fetchProduit(); }}
              >
                Annuler
              </button>
            </>
          )}
          <button
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
            onClick={() => router.push("/dashboard/produits")}
          >
            Retour
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
          <div className="flex flex-col gap-1 px-4 pt-4">
            <h3 className="text-lg font-semibold leading-snug">Informations</h3>
          </div>
          <div className="px-4 pb-4 space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Code</dt><dd className="font-medium">{produit.code}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Désignation</dt><dd className="font-medium">{produit.designation}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Catégorie</dt><dd className="font-medium">{produit.categorie}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Unité</dt><dd className="font-medium">{produit.unite}</dd></div>
            </dl>
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
          <div className="flex flex-col gap-1 px-4 pt-4">
            <h3 className="text-lg font-semibold leading-snug">Prix et Stock</h3>
          </div>
          <div className="px-4 pb-4 space-y-4">
            {editing ? (
              <>
                {(["prixAchatRef", "prixVenteRef", "stockInitial", "stockMin"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {field === "prixAchatRef" ? "Prix achat" : field === "prixVenteRef" ? "Prix vente" : field === "stockInitial" ? "Stock initial" : "Stock minimum"}
                      {field !== "stockMin" && <span className="text-destructive"> *</span>}
                    </label>
                    <input
                      name={field}
                      type="number"
                      step={field.includes("prix") ? "0.01" : "1"}
                      value={form[field]}
                      onChange={handleChange}
                      className={`h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors[field] ? "border-red-500" : ""}`}
                    />
                    {fieldErrors[field] && <p className="text-sm text-red-500">{fieldErrors[field]}</p>}
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Raison du changement</label>
                  <input
                    name="raisonPrix"
                    value={form.raisonPrix}
                    onChange={handleChange}
                    placeholder="Optionnel"
                    className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Prix achat réf.</dt><dd className="font-medium">{Number(produit.prixAchatRef).toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Prix vente réf.</dt><dd className="font-medium">{Number(produit.prixVenteRef).toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Marge</dt><dd className="font-medium">{margin.toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Taux de marge</dt><dd className="font-medium">{marginRate}%</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Stock initial</dt><dd className="font-medium">{produit.stockInitial}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Stock minimum</dt><dd className="font-medium">{produit.stockMin}</dd></div>
              </dl>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 px-4 pt-4">
          <h3 className="text-lg font-semibold leading-snug">Stock actuel</h3>
        </div>
        <div className="px-4 pb-4">
          {produit.stock ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stock actuel</p>
                <p className="text-2xl font-bold">{produit.stock.stockActuel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <span className={`inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${produit.stock.statutStock === "Alerte" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
                  {produit.stock.statutStock}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valeur au coût</p>
                <p className="text-2xl font-bold">{Number(produit.stock.valeurAchat).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marge potentielle</p>
                <p className="text-2xl font-bold">{Number(produit.stock.margePotentielle).toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucune donnée de stock</p>
          )}
        </div>
      </div>

      <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 px-4 pt-4">
          <h3 className="text-lg font-semibold leading-snug">Historique des prix</h3>
        </div>
        <div className="px-4 pb-4">
          {produit.historiquePrix.length === 0 ? (
            <p className="text-muted-foreground">Aucun changement de prix enregistré</p>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <table className="w-full caption-bottom text-base border-collapse">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                    <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Date</th>
                    <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Ancien prix achat</th>
                    <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Nouveau prix achat</th>
                    <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Ancien prix vente</th>
                    <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Nouveau prix vente</th>
                    <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Raison</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {produit.historiquePrix.map((h) => (
                    <tr key={h.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{new Date(h.dateChangement).toLocaleDateString("fr-FR")}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.ancienPrixAchat != null ? Number(h.ancienPrixAchat).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.nouveauPrixAchat != null ? Number(h.nouveauPrixAchat).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.ancienPrixVente != null ? Number(h.ancienPrixVente).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.nouveauPrixVente != null ? Number(h.nouveauPrixVente).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.raison || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
