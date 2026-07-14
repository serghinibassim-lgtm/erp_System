"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "", designation: "", category: "", unit: "",
    purchaseRefPrice: "", saleRefPrice: "", initialStock: "", minStock: "0",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const fields: { name: string; label: string; type: string; placeholder: string; step?: string }[] = [
    { name: "code", label: "Code", type: "text", placeholder: "PRD-001" },
    { name: "designation", label: "Désignation", type: "text", placeholder: "Nom du produit" },
    { name: "category", label: "Catégorie", type: "text", placeholder: "Électronique" },
    { name: "unit", label: "Unité", type: "text", placeholder: "pièce, kg, m..." },
    { name: "purchaseRefPrice", label: "Prix d'achat référence", type: "number", placeholder: "0.00", step: "0.01" },
    { name: "saleRefPrice", label: "Prix de vente référence", type: "number", placeholder: "0.00", step: "0.01" },
    { name: "initialStock", label: "Stock initial", type: "number", placeholder: "0", step: "1" },
    { name: "minStock", label: "Stock minimum", type: "number", placeholder: "0", step: "1" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nouveau produit</h1>
        <p className="text-sm text-muted-foreground md:text-base">Ajouter un produit au catalogue</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations produit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !Object.keys(fieldErrors).length && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {fields.map(({ name, label, type, placeholder, step }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  name={name}
                  type={type}
                  step={step ?? "1"}
                  placeholder={placeholder}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  className={fieldErrors[name] ? "border-red-500" : ""}
                  required
                />
                {fieldErrors[name] && (
                  <p className="text-sm text-red-500">{fieldErrors[name]}</p>
                )}
              </div>
            ))}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/products")} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Création..." : "Créer le produit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
