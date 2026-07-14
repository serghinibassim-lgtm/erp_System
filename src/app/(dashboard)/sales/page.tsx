"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Sale {
  id: string;
  date: string;
  saleNumber: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string | null;
  alert: boolean | null;
  product: { code: string; designation: string };
  client: { name: string } | null;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/sales?${params}`);
      const data = await res.json();
      if (res.ok) setSales(data.sales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ventes</h1>
          <p className="text-sm text-muted-foreground md:text-base">Historique des ventes et sorties</p>
        </div>
        <Link href="/sales/new">
          <Button className="w-full sm:w-auto">Nouvelle vente</Button>
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
              <TableHead>N° vente</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Client</TableHead>
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
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune vente trouvée
                </TableCell>
              </TableRow>
            ) : (
              sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{s.saleNumber || "-"}</TableCell>
                  <TableCell>{s.product.code} - {s.product.designation}</TableCell>
                  <TableCell>{s.client?.name || "-"}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{Number(s.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>{Number(s.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    {s.alert ? <Badge variant="destructive">Alerte</Badge> : <Badge variant="secondary">OK</Badge>}
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
