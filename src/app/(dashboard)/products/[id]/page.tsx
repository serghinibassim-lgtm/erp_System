"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";

interface PriceHistory {
  id: string;
  oldPurchasePrice: number | null;
  newPurchasePrice: number | null;
  oldSalePrice: number | null;
  newSalePrice: number | null;
  changedAt: string;
  reason: string | null;
}

interface Stock {
  currentStock: number;
  initialStock: number;
  totalPurchases: number;
  totalSales: number;
  stockStatus: string;
  costValue: number;
  saleValue: number;
  potentialMargin: number;
}

interface Product {
  id: string;
  code: string;
  designation: string;
  category: string;
  unit: string;
  purchaseRefPrice: number;
  saleRefPrice: number;
  initialStock: number;
  minStock: number;
  stock: Stock | null;
  priceHistory: PriceHistory[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    code: "", designation: "", category: "", unit: "",
    purchaseRefPrice: "", saleRefPrice: "", initialStock: "", minStock: "",
    priceReason: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (res.ok && data.product) {
        setProduct(data.product);
        const p = data.product;
        setForm({
          code: p.code, designation: p.designation, category: p.category, unit: p.unit,
          purchaseRefPrice: String(Number(p.purchaseRefPrice)),
          saleRefPrice: String(Number(p.saleRefPrice)),
          initialStock: String(p.initialStock), minStock: String(p.minStock),
          priceReason: "",
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

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

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
        code: form.code, designation: form.designation, category: form.category, unit: form.unit,
        purchaseRefPrice: parseFloat(form.purchaseRefPrice) || 0,
        saleRefPrice: parseFloat(form.saleRefPrice) || 0,
        initialStock: parseInt(form.initialStock) || 0,
        minStock: parseInt(form.minStock) || 0,
      };

      const changedPrices =
        Number(product?.purchaseRefPrice) !== Number(body.purchaseRefPrice) ||
        Number(product?.saleRefPrice) !== Number(body.saleRefPrice);

      if (changedPrices && form.priceReason.trim()) {
        body.priceReason = form.priceReason.trim();
      }

      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setEditing(false);
        fetchProduct();
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
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (error && !product) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error}</p>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
          onClick={() => router.push("/products")}
        >
          Retour
        </button>
      </div>
    );
  }

  if (!product) return null;

  const margin = Number(product.saleRefPrice) - Number(product.purchaseRefPrice);
  const marginRate = Number(product.purchaseRefPrice) > 0
    ? (margin / Number(product.purchaseRefPrice) * 100).toFixed(1)
    : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{product.designation}</h1>
          <p className="text-sm text-muted-foreground md:text-base">Code: {product.code} | Catégorie: {product.category}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <button
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
              onClick={() => setEditing(true)}
            >
              Modifier
            </button>
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
                onClick={() => { setEditing(false); fetchProduct(); }}
              >
                Annuler
              </button>
            </>
          )}
          <button
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
            onClick={() => router.push("/products")}
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
            {editing ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Code <span className="text-destructive">*</span></label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    className={`h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.code ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.code && <p className="text-sm text-red-500">{fieldErrors.code}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Désignation <span className="text-destructive">*</span></label>
                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    className={`h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.designation ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.designation && <p className="text-sm text-red-500">{fieldErrors.designation}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Catégorie <span className="text-destructive">*</span></label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.category ? "border-red-500" : "border-input"}`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <p className="text-sm text-red-500">{fieldErrors.category}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Unité <span className="text-destructive">*</span></label>
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.unit ? "border-red-500" : "border-input"}`}
                  >
                    <option value="">Sélectionner une unité</option>
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {fieldErrors.unit && <p className="text-sm text-red-500">{fieldErrors.unit}</p>}
                </div>
              </>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Code</dt><dd className="font-medium">{product.code}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Désignation</dt><dd className="font-medium">{product.designation}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Catégorie</dt><dd className="font-medium">{product.category}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Unité</dt><dd className="font-medium">{product.unit}</dd></div>
              </dl>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
          <div className="flex flex-col gap-1 px-4 pt-4">
            <h3 className="text-lg font-semibold leading-snug">Prix et Stock</h3>
          </div>
          <div className="px-4 pb-4 space-y-4">
            {editing ? (
              <>
                {(["purchaseRefPrice", "saleRefPrice", "initialStock", "minStock"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {field === "purchaseRefPrice" ? "Prix achat" : field === "saleRefPrice" ? "Prix vente" : field === "initialStock" ? "Stock initial" : "Stock minimum"}
                      {field !== "minStock" && <span className="text-destructive"> *</span>}
                    </label>
                    <input
                      name={field}
                      type="number"
                      step={field.includes("Price") ? "0.01" : "1"}
                      value={form[field]}
                      onChange={handleChange}
                      className={`h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors[field] ? "border-red-500" : ""}`}
                    />
                    {fieldErrors[field] && <p className="text-sm text-red-500">{fieldErrors[field]}</p>}
                  </div>
                ))}
                {form.priceReason && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Raison du changement de prix</label>
                    <input
                      name="priceReason"
                      value={form.priceReason}
                      onChange={handleChange}
                      placeholder="Optionnel"
                      className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}
              </>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Prix achat réf.</dt><dd className="font-medium">{Number(product.purchaseRefPrice).toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Prix vente réf.</dt><dd className="font-medium">{Number(product.saleRefPrice).toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Marge</dt><dd className="font-medium">{margin.toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Taux de marge</dt><dd className="font-medium">{marginRate}%</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Stock initial</dt><dd className="font-medium">{product.initialStock}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Stock minimum</dt><dd className="font-medium">{product.minStock}</dd></div>
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
          {product.stock ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stock actuel</p>
                <p className="text-2xl font-bold">{product.stock.currentStock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <span className={`inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${product.stock.stockStatus === "Alerte" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
                  {product.stock.stockStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valeur au coût</p>
                <p className="text-2xl font-bold">{Number(product.stock.costValue).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marge potentielle</p>
                <p className="text-2xl font-bold">{Number(product.stock.potentialMargin).toFixed(2)}</p>
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
          {product.priceHistory.length === 0 ? (
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
                  {product.priceHistory.map((h) => (
                    <tr key={h.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{new Date(h.changedAt).toLocaleDateString("fr-FR")}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.oldPurchasePrice != null ? Number(h.oldPurchasePrice).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.newPurchasePrice != null ? Number(h.newPurchasePrice).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.oldSalePrice != null ? Number(h.oldSalePrice).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.newSalePrice != null ? Number(h.newSalePrice).toFixed(2) : "-"}</td>
                      <td className="p-3 align-middle whitespace-nowrap text-sm">{h.reason || "-"}</td>
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
