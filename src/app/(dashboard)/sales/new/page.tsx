"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductOption {
  id: string;
  code: string;
  designation: string;
  saleRefPrice: number;
  stock?: { currentStock: number };
}

interface ClientOption {
  id: string;
  name: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    saleNumber: "",
    clientId: "",
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
      fetch("/api/clients?limit=100").then(r => r.json()).catch(() => ({ clients: [] })),
    ]).then(([prodData, cliData]) => {
      if (prodData.products) setProducts(prodData.products);
      if (cliData.clients) setClients(cliData.clients);
    }).catch(() => {});
  }, []);

  const selectedProduct = products.find(p => p.id === form.productId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "productId" && value) {
        const product = products.find(p => p.id === value);
        if (product) updated.unitPrice = String(Number(product.saleRefPrice));
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
      const res = await fetch("/api/sales", {
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
        router.push("/sales");
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

  const availStock = selectedProduct?.stock?.currentStock ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nouvelle vente</h1>
        <p className="text-sm text-muted-foreground md:text-base">Enregistrer une sortie de stock</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Détails de la vente</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !Object.keys(fieldErrors).length && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productId">Produit</Label>
              <select
                id="productId"
                name="productId"
                value={form.productId}
                onChange={handleChange}
                className={`flex h-8 w-full rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm ${fieldErrors.productId ? "border-red-500" : "border-input"}`}
                required
              >
                <option value="">Sélectionner un produit</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.designation} (stock: {p.stock?.currentStock ?? 0})
                  </option>
                ))}
              </select>
              {fieldErrors.productId && <p className="text-sm text-red-500">{fieldErrors.productId}</p>}
              {form.productId && (
                <p className="text-xs text-muted-foreground">Stock disponible: {availStock}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <select
                id="clientId"
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleNumber">N° vente</Label>
              <Input id="saleNumber" name="saleNumber" placeholder="V-001" value={form.saleNumber} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input id="quantity" name="quantity" type="number" step="1" min="1" placeholder="1" value={form.quantity} onChange={handleChange} className={fieldErrors.quantity ? "border-red-500" : ""} required />
                {fieldErrors.quantity && <p className="text-sm text-red-500">{fieldErrors.quantity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Prix unitaire</Label>
                <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" placeholder="0.00" value={form.unitPrice} onChange={handleChange} className={fieldErrors.unitPrice ? "border-red-500" : ""} required />
                {fieldErrors.unitPrice && <p className="text-sm text-red-500">{fieldErrors.unitPrice}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Montant total</Label>
              <Input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0" placeholder="Calculé automatiquement" value={form.totalAmount} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Mode de paiement</Label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Sélectionner</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
                <option value="Virement">Virement</option>
                <option value="Carte">Carte</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observation">Observation</Label>
              <Input id="observation" name="observation" placeholder="Optionnel" value={form.observation} onChange={handleChange} />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/sales")} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Enregistrement..." : "Enregistrer la vente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
