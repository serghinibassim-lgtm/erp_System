"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProductOption {
  id: string;
  code: string;
  designation: string;
  prixAchatRef: number;
}

interface SupplierOption {
  id: string;
  nom: string;
}

export default function NouvelAchatPage() {
  const router = useRouter();
  const [produits, setProduits] = useState<ProductOption[]>([]);
  const [fournisseurs, setFournisseurs] = useState<SupplierOption[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    numeroAchat: "",
    fournisseurId: "",
    produitId: "",
    quantite: "",
    prixUnitaire: "",
    montantTotal: "",
    modePaiement: "",
    observation: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/produits?limit=100").then(r => r.json()),
      fetch("/api/fournisseurs?limit=100").then(r => r.json()).catch(() => ({ fournisseurs: [] })),
    ]).then(([prodData, suppData]) => {
      if (prodData.produits) setProduits(prodData.produits);
      if (suppData.fournisseurs) setFournisseurs(suppData.fournisseurs);
    }).catch(() => {});
  }, []);

  const selectedProduct = produits.find(p => p.id === form.produitId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "produitId" && value) {
        const produit = produits.find(p => p.id === value);
        if (produit) updated.prixUnitaire = String(Number(produit.prixAchatRef));
      }
      if ((name === "quantite" || name === "prixUnitaire") && updated.quantite && updated.prixUnitaire) {
        updated.montantTotal = String(parseInt(updated.quantite) * parseFloat(updated.prixUnitaire));
      }
      return updated;
    });
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/achats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString(),
          quantite: parseInt(form.quantite) || 0,
          prixUnitaire: parseFloat(form.prixUnitaire) || 0,
          montantTotal: form.montantTotal ? parseFloat(form.montantTotal) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard/achats");
      } else {
        setError(data.error || "Erreur");
        if (data.errors) setFieldErrors(data.errors);
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nouvel achat</h1>
        <p className="text-sm text-muted-foreground md:text-base">Enregistrer un approvisionnement</p>
      </div>

      <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 px-4 pt-4">
          <h3 className="text-lg font-semibold leading-snug">Détails de l&apos;achat</h3>
        </div>
        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !Object.keys(fieldErrors).length && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="space-y-2">
                <label htmlFor="date" className="flex items-center gap-2 text-base leading-none font-medium select-none">Date <span className="text-destructive">*</span></label>
                <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <div className="space-y-2">
              <label htmlFor="produitId" className="flex items-center gap-2 text-base leading-none font-medium select-none">Produit <span className="text-destructive">*</span></label>
              <select
                id="produitId"
                name="produitId"
                value={form.produitId}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.produitId ? "border-red-500" : "border-input"}`}
                required
              >
                <option value="">Sélectionner un produit</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.designation}</option>
                ))}
              </select>
              {fieldErrors.produitId && <p className="text-sm text-red-500">{fieldErrors.produitId}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="fournisseurId" className="flex items-center gap-2 text-base leading-none font-medium select-none">Fournisseur</label>
              <select
                id="fournisseurId"
                name="fournisseurId"
                value={form.fournisseurId}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base shadow-sm"
              >
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="numeroAchat" className="flex items-center gap-2 text-base leading-none font-medium select-none">N° document</label>
              <input id="numeroAchat" name="numeroAchat" placeholder="BL-001" value={form.numeroAchat} onChange={handleChange} className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="quantite" className="flex items-center gap-2 text-base leading-none font-medium select-none">Quantité <span className="text-destructive">*</span></label>
                <input id="quantite" name="quantite" type="number" step="1" min="1" placeholder="1" value={form.quantite} onChange={handleChange} className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.quantite ? "border-red-500" : "border-input"}`} required />
                {fieldErrors.quantite && <p className="text-sm text-red-500">{fieldErrors.quantite}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="prixUnitaire" className="flex items-center gap-2 text-base leading-none font-medium select-none">Prix unitaire <span className="text-destructive">*</span></label>
                <input id="prixUnitaire" name="prixUnitaire" type="number" step="0.01" min="0" placeholder="0.00" value={form.prixUnitaire} onChange={handleChange} className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.prixUnitaire ? "border-red-500" : "border-input"}`} required />
                {fieldErrors.prixUnitaire && <p className="text-sm text-red-500">{fieldErrors.prixUnitaire}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="montantTotal" className="flex items-center gap-2 text-base leading-none font-medium select-none">Montant total</label>
              <input id="montantTotal" name="montantTotal" type="number" step="0.01" min="0" placeholder="Calculé automatiquement" value={form.montantTotal} onChange={handleChange} className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <div className="space-y-2">
              <label htmlFor="modePaiement" className="flex items-center gap-2 text-base leading-none font-medium select-none">Mode de paiement</label>
              <select
                id="modePaiement"
                name="modePaiement"
                value={form.modePaiement}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base shadow-sm"
              >
                <option value="">Sélectionner</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
                <option value="Virement">Virement</option>
                <option value="Carte">Carte</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="observation" className="flex items-center gap-2 text-base leading-none font-medium select-none">Observation</label>
              <input id="observation" name="observation" placeholder="Optionnel" value={form.observation} onChange={handleChange} className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => router.push("/dashboard/achats")} className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto">
                {loading ? "Enregistrement..." : "Enregistrer l'achat"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
