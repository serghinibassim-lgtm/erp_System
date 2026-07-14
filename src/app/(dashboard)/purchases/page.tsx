"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Purchase {
  id: string;
  date: string;
  documentNumber: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string | null;
  alert: boolean | null;
  product: { code: string; designation: string };
  supplier: { name: string } | null;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/purchases?${params}`);
      const data = await res.json();
      if (res.ok) setPurchases(data.purchases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Achats</h1>
          <p className="text-sm text-muted-foreground md:text-base">Historique des achats et approvisionnements</p>
        </div>
        <Link href="/purchases/new">
          <Button className="w-full sm:w-auto">Nouvel achat</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher par produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Qté</TableHead>
              <TableHead>Prix unit.</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Alerte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucun achat trouvé
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{p.documentNumber || "-"}</TableCell>
                  <TableCell>{p.product.code} - {p.product.designation}</TableCell>
                  <TableCell>{p.supplier?.name || "-"}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{Number(p.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>{Number(p.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    {p.alert ? <Badge variant="destructive">Alerte</Badge> : <Badge variant="secondary">OK</Badge>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
