"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProductOption {
  id: string;
  code: string;
  designation: string;
  purchaseRefPrice: number;
}

interface SupplierOption {
  id: string;
  name: string;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    documentNumber: "",
    supplierId: "",
    productId: "",
    quantity: "",
    unitPrice: "",
    totalAmount: "",
    paymentMethod: "",
    observation: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=100").then(r => r.json()),
      fetch("/api/suppliers?limit=100").then(r => r.json()).catch(() => ({ suppliers: [] })),
    ]).then(([prodData, suppData]) => {
      if (prodData.products) setProducts(prodData.products);
      if (suppData.suppliers) setSuppliers(suppData.suppliers);
    }).catch(() => {});
  }, []);

  const selectedProduct = products.find(p => p.id === form.productId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "productId" && value) {
        const product = products.find(p => p.id === value);
        if (product) updated.unitPrice = String(Number(product.purchaseRefPrice));
      }
      if ((name === "quantity" || name === "unitPrice") && updated.quantity && updated.unitPrice) {
        updated.totalAmount = String(parseInt(updated.quantity) * parseFloat(updated.unitPrice));
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
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString(),
          quantity: parseInt(form.quantity) || 0,
          unitPrice: parseFloat(form.unitPrice) || 0,
          totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/purchases");
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
              <label htmlFor="productId" className="flex items-center gap-2 text-base leading-none font-medium select-none">Produit <span className="text-destructive">*</span></label>
              <select
                id="productId"
                name="productId"
                value={form.productId}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm ${fieldErrors.productId ? "border-red-500" : "border-input"}`}
                required
              >
                <option value="">Sélectionner un produit</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.designation}</option>
                ))}
              </select>
              {fieldErrors.productId && <p className="text-sm text-red-500">{fieldErrors.productId}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="supplierId" className="flex items-center gap-2 text-base leading-none font-medium select-none">Fournisseur</label>
              <select
                id="supplierId"
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base shadow-sm"
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="documentNumber" className="flex items-center gap-2 text-base leading-none font-medium select-none">N° document</label>
              <input id="documentNumber" name="documentNumber" placeholder="BL-001" value={form.documentNumber} onChange={handleChange} className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="quantity" className="flex items-center gap-2 text-base leading-none font-medium select-none">Quantité <span className="text-destructive">*</span></label>
                <input id="quantity" name="quantity" type="number" step="1" min="1" placeholder="1" value={form.quantity} onChange={handleChange} className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.quantity ? "border-red-500" : "border-input"}`} required />
                {fieldErrors.quantity && <p className="text-sm text-red-500">{fieldErrors.quantity}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="unitPrice" className="flex items-center gap-2 text-base leading-none font-medium select-none">Prix unitaire <span className="text-destructive">*</span></label>
                <input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" placeholder="0.00" value={form.unitPrice} onChange={handleChange} className={`h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.unitPrice ? "border-red-500" : "border-input"}`} required />
                {fieldErrors.unitPrice && <p className="text-sm text-red-500">{fieldErrors.unitPrice}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="totalAmount" className="flex items-center gap-2 text-base leading-none font-medium select-none">Montant total</label>
              <input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0" placeholder="Calculé automatiquement" value={form.totalAmount} onChange={handleChange} className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentMethod" className="flex items-center gap-2 text-base leading-none font-medium select-none">Mode de paiement</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={form.paymentMethod}
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
              <button type="button" onClick={() => router.push("/purchases")} className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto">
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
