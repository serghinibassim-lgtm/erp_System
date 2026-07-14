"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

interface Stock {
  currentStock: number;
  stockStatus: string;
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
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (res.ok) setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Produits</h1>
          <p className="text-sm text-muted-foreground md:text-base">Gestion des produits et articles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/api/export/products")}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Link href="/products/new">
            <Button className="w-full sm:w-auto">Nouveau produit</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher par code ou désignation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix achat</TableHead>
              <TableHead>Prix vente</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun produit trouvé
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/products/${product.id}`}>
                  <TableCell className="font-medium whitespace-nowrap">{product.code}</TableCell>
                  <TableCell className="whitespace-nowrap">{product.designation}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="whitespace-nowrap">{Number(product.purchaseRefPrice).toFixed(2)}</TableCell>
                  <TableCell className="whitespace-nowrap">{Number(product.saleRefPrice).toFixed(2)}</TableCell>
                  <TableCell>{product.stock?.currentStock ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock?.stockStatus === "Alerte" ? "destructive" : "secondary"}>
                      {product.stock?.stockStatus === "Alerte" ? "Alerte" : "OK"}
                    </Badge>
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
