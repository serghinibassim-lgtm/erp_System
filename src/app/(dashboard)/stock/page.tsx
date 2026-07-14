"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

interface StockItem {
  id: string;
  currentStock: number;
  initialStock: number;
  totalPurchases: number;
  totalSales: number;
  stockStatus: string;
  costValue: number;
  saleValue: number;
  potentialMargin: number;
  product: {
    code: string;
    designation: string;
    unit: string;
    minStock: number;
  };
}

export default function StockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/stock?${params}`);
      const data = await res.json();
      if (res.ok) setStocks(data.stocks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const totalStock = stocks.reduce((sum, s) => sum + s.currentStock, 0);
  const totalValue = stocks.reduce((sum, s) => sum + Number(s.costValue), 0);
  const totalSaleValue = stocks.reduce((sum, s) => sum + Number(s.saleValue), 0);
  const totalMargin = stocks.reduce((sum, s) => sum + Number(s.potentialMargin), 0);
  const alertCount = stocks.filter(s => s.stockStatus === "Alerte").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Stock</h1>
          <p className="text-sm text-muted-foreground md:text-base">État des stocks et alertes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/api/export/stock")}>
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Stock total</p>
          <p className="text-lg font-bold md:text-2xl">{totalStock}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Valeur de stock</p>
          <p className="text-lg font-bold md:text-2xl">{totalValue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Valeur de vente</p>
          <p className="text-lg font-bold md:text-2xl">{totalSaleValue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Marge potentielle</p>
          <p className="text-lg font-bold md:text-2xl">{totalMargin.toFixed(2)}</p>
        </div>
      </div>

      {alertCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:p-4">
          {alertCount} produit(s) en alerte de stock
        </div>
      )}

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
              <TableHead>Produit</TableHead>
              <TableHead>Stock initial</TableHead>
              <TableHead>Achats</TableHead>
              <TableHead>Ventes</TableHead>
              <TableHead>Stock actuel</TableHead>
              <TableHead>Seuil min</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Coût</TableHead>
              <TableHead>Marge potentielle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun stock trouvé
                </TableCell>
              </TableRow>
            ) : (
              stocks.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.product.code} - {s.product.designation}</TableCell>
                  <TableCell>{s.initialStock}</TableCell>
                  <TableCell>{s.totalPurchases}</TableCell>
                  <TableCell>{s.totalSales}</TableCell>
                  <TableCell className="font-bold">{s.currentStock}</TableCell>
                  <TableCell>{s.product.minStock}</TableCell>
                  <TableCell>
                    <Badge variant={s.stockStatus === "Alerte" ? "destructive" : "secondary"}>
                      {s.stockStatus === "Alerte" ? "Alerte" : "OK"}
                    </Badge>
                  </TableCell>
                  <TableCell>{Number(s.costValue).toFixed(2)}</TableCell>
                  <TableCell>{Number(s.potentialMargin).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
