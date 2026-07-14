"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <Button variant="outline" onClick={() => router.push("/products")}>Retour</Button>
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
            <Button onClick={() => setEditing(true)}>Modifier</Button>
          ) : (
            <>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); fetchProduct(); }}>
                Annuler
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => router.push("/products")}>Retour</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                {(["code", "designation", "category", "unit"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <Label>{field === "code" ? "Code" : field === "designation" ? "Désignation" : field === "category" ? "Catégorie" : "Unité"}</Label>
                    <Input name={field} value={form[field]} onChange={handleChange} className={fieldErrors[field] ? "border-red-500" : ""} />
                    {fieldErrors[field] && <p className="text-sm text-red-500">{fieldErrors[field]}</p>}
                  </div>
                ))}
              </>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Code</dt><dd className="font-medium">{product.code}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Désignation</dt><dd className="font-medium">{product.designation}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Catégorie</dt><dd className="font-medium">{product.category}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Unité</dt><dd className="font-medium">{product.unit}</dd></div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Prix et Stock</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                {(["purchaseRefPrice", "saleRefPrice", "initialStock", "minStock"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <Label>{field === "purchaseRefPrice" ? "Prix achat" : field === "saleRefPrice" ? "Prix vente" : field === "initialStock" ? "Stock initial" : "Stock minimum"}</Label>
                    <Input name={field} type="number" step={field.includes("Price") ? "0.01" : "1"} value={form[field]} onChange={handleChange} className={fieldErrors[field] ? "border-red-500" : ""} />
                    {fieldErrors[field] && <p className="text-sm text-red-500">{fieldErrors[field]}</p>}
                  </div>
                ))}
                {form.priceReason && (
                  <div className="space-y-1">
                    <Label>Raison du changement de prix</Label>
                    <Input name="priceReason" value={form.priceReason} onChange={handleChange} placeholder="Optionnel" />
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Stock actuel</CardTitle></CardHeader>
        <CardContent>
          {product.stock ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stock actuel</p>
                <p className="text-2xl font-bold">{product.stock.currentStock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge variant={product.stock.stockStatus === "Alerte" ? "destructive" : "secondary"}>
                  {product.stock.stockStatus}
                </Badge>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historique des prix</CardTitle></CardHeader>
        <CardContent>
          {product.priceHistory.length === 0 ? (
            <p className="text-muted-foreground">Aucun changement de prix enregistré</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ancien prix achat</TableHead>
                  <TableHead>Nouveau prix achat</TableHead>
                  <TableHead>Ancien prix vente</TableHead>
                  <TableHead>Nouveau prix vente</TableHead>
                  <TableHead>Raison</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.priceHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.changedAt).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>{h.oldPurchasePrice != null ? Number(h.oldPurchasePrice).toFixed(2) : "-"}</TableCell>
                    <TableCell>{h.newPurchasePrice != null ? Number(h.newPurchasePrice).toFixed(2) : "-"}</TableCell>
                    <TableCell>{h.oldSalePrice != null ? Number(h.oldSalePrice).toFixed(2) : "-"}</TableCell>
                    <TableCell>{h.newSalePrice != null ? Number(h.newSalePrice).toFixed(2) : "-"}</TableCell>
                    <TableCell>{h.reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
