"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NouveauProduitPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "", designation: "", categorie: "", unite: "",
    prixAchatRef: "", prixVenteRef: "", stockInitial: "", stockMin: "0",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [unites, setUnites] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/parametres")
      .then(r => r.json())
      .then(data => {
        if (data.parametres) {
          const cats = data.parametres.find((p: {cle: string}) => p.cle === "categories");
          const uns = data.parametres.find((p: {cle: string}) => p.cle === "unites");
          if (cats?.valeur) setCategories(cats.valeur.split("\n").filter((s: string) => s.trim()));
          if (uns?.valeur) setUnites(uns.valeur.split("\n").filter((s: string) => s.trim()));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prixAchatRef: parseFloat(form.prixAchatRef) || 0,
          prixVenteRef: parseFloat(form.prixVenteRef) || 0,
          stockInitial: parseInt(form.stockInitial) || 0,
          stockMin: parseInt(form.stockMin) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard/produits");
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

  const btnClass = "inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4";
  const btnOutlineClass = "inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4";
  const inputClass = "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nouveau produit</h1>
        <p className="text-sm text-muted-foreground md:text-base">Ajouter un produit au catalogue</p>
      </div>

      <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 px-4 pt-4">
          <h3 className="text-lg font-semibold leading-snug">Informations produit</h3>
        </div>
        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !Object.keys(fieldErrors).length && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="code">
                Code <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="code" name="code" placeholder="PRD-001" value={form.code} onChange={handleChange} className={`${inputClass} ${fieldErrors.code ? "border-red-500" : ""}`} required />
              {fieldErrors.code && <p className="text-sm text-red-500">{fieldErrors.code}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="designation">
                Désignation <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="designation" name="designation" placeholder="Nom du produit" value={form.designation} onChange={handleChange} className={`${inputClass} ${fieldErrors.designation ? "border-red-500" : ""}`} required />
              {fieldErrors.designation && <p className="text-sm text-red-500">{fieldErrors.designation}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="categorie">
                Catégorie <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <select
                id="categorie"
                name="categorie"
                value={form.categorie}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.categorie ? "border-red-500" : "border-input"}`}
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {fieldErrors.categorie && <p className="text-sm text-red-500">{fieldErrors.categorie}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="unite">
                Unité <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <select
                id="unite"
                name="unite"
                value={form.unite}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.unite ? "border-red-500" : "border-input"}`}
                required
              >
                <option value="">Sélectionner une unité</option>
                {unites.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {fieldErrors.unite && <p className="text-sm text-red-500">{fieldErrors.unite}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="prixAchatRef">
                Prix d&apos;achat référence <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="prixAchatRef" name="prixAchatRef" type="number" step="0.01" min="0" placeholder="0.00" value={form.prixAchatRef} onChange={handleChange} className={`${inputClass} ${fieldErrors.prixAchatRef ? "border-red-500" : ""}`} required />
              {fieldErrors.prixAchatRef && <p className="text-sm text-red-500">{fieldErrors.prixAchatRef}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="prixVenteRef">
                Prix de vente référence <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="prixVenteRef" name="prixVenteRef" type="number" step="0.01" min="0" placeholder="0.00" value={form.prixVenteRef} onChange={handleChange} className={`${inputClass} ${fieldErrors.prixVenteRef ? "border-red-500" : ""}`} required />
              {fieldErrors.prixVenteRef && <p className="text-sm text-red-500">{fieldErrors.prixVenteRef}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="stockInitial">
                Stock initial <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="stockInitial" name="stockInitial" type="number" step="1" min="0" placeholder="0" value={form.stockInitial} onChange={handleChange} className={`${inputClass} ${fieldErrors.stockInitial ? "border-red-500" : ""}`} required />
              {fieldErrors.stockInitial && <p className="text-sm text-red-500">{fieldErrors.stockInitial}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="stockMin">
                Stock minimum
              </label>
              <input id="stockMin" name="stockMin" type="number" step="1" min="0" placeholder="0" value={form.stockMin} onChange={handleChange} className={`${inputClass} ${fieldErrors.stockMin ? "border-red-500" : ""}`} />
              {fieldErrors.stockMin && <p className="text-sm text-red-500">{fieldErrors.stockMin}</p>}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => router.push("/dashboard/produits")} className={`${btnOutlineClass} w-full sm:w-auto`}>
                Annuler
              </button>
              <button type="submit" disabled={loading} className={`${btnClass} w-full sm:w-auto`}>
                {loading ? "Création..." : "Créer le produit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
