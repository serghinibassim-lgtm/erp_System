"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "", designation: "", category: "", unit: "",
    purchaseRefPrice: "", saleRefPrice: "", initialStock: "", minStock: "0",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/parameters")
      .then(r => r.json())
      .then(data => {
        if (data.parameters) {
          const cats = data.parameters.find((p: {key: string}) => p.key === "categories");
          const uns = data.parameters.find((p: {key: string}) => p.key === "units");
          if (cats?.value) setCategories(cats.value.split("\n").filter((s: string) => s.trim()));
          if (uns?.value) setUnits(uns.value.split("\n").filter((s: string) => s.trim()));
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
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchaseRefPrice: parseFloat(form.purchaseRefPrice) || 0,
          saleRefPrice: parseFloat(form.saleRefPrice) || 0,
          initialStock: parseInt(form.initialStock) || 0,
          minStock: parseInt(form.minStock) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/products");
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
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="category">
                Catégorie <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.category ? "border-red-500" : "border-input"}`}
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {fieldErrors.category && <p className="text-sm text-red-500">{fieldErrors.category}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="unit">
                Unité <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <select
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.unit ? "border-red-500" : "border-input"}`}
                required
              >
                <option value="">Sélectionner une unité</option>
                {units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {fieldErrors.unit && <p className="text-sm text-red-500">{fieldErrors.unit}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="purchaseRefPrice">
                Prix d&apos;achat référence <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="purchaseRefPrice" name="purchaseRefPrice" type="number" step="0.01" min="0" placeholder="0.00" value={form.purchaseRefPrice} onChange={handleChange} className={`${inputClass} ${fieldErrors.purchaseRefPrice ? "border-red-500" : ""}`} required />
              {fieldErrors.purchaseRefPrice && <p className="text-sm text-red-500">{fieldErrors.purchaseRefPrice}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="saleRefPrice">
                Prix de vente référence <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="saleRefPrice" name="saleRefPrice" type="number" step="0.01" min="0" placeholder="0.00" value={form.saleRefPrice} onChange={handleChange} className={`${inputClass} ${fieldErrors.saleRefPrice ? "border-red-500" : ""}`} required />
              {fieldErrors.saleRefPrice && <p className="text-sm text-red-500">{fieldErrors.saleRefPrice}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="initialStock">
                Stock initial <span className="text-red-500 text-base leading-none">*</span>
              </label>
              <input id="initialStock" name="initialStock" type="number" step="1" min="0" placeholder="0" value={form.initialStock} onChange={handleChange} className={`${inputClass} ${fieldErrors.initialStock ? "border-red-500" : ""}`} required />
              {fieldErrors.initialStock && <p className="text-sm text-red-500">{fieldErrors.initialStock}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none" htmlFor="minStock">
                Stock minimum
              </label>
              <input id="minStock" name="minStock" type="number" step="1" min="0" placeholder="0" value={form.minStock} onChange={handleChange} className={`${inputClass} ${fieldErrors.minStock ? "border-red-500" : ""}`} />
              {fieldErrors.minStock && <p className="text-sm text-red-500">{fieldErrors.minStock}</p>}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => router.push("/products")} className={`${btnOutlineClass} w-full sm:w-auto`}>
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
