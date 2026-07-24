"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";

interface StockItem {
  id: string;
  stockActuel: number;
  stockInitial: number;
  totalAchats: number;
  totalVentes: number;
  statutStock: string;
  valeurAchat: number;
  valeurVente: number;
  margePotentielle: number;
  produit: {
    code: string;
    designation: string;
    unite: string;
    stockMin: number;
  };
}

export default function StockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [recherche, setRecherche] = useState("");
  const [minQuantite, setMinQuantite] = useState("");
  const [maxQuantite, setMaxQuantite] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recherche) params.set("search", recherche);
      if (minQuantite) params.set("minQuantity", minQuantite);
      if (maxQuantite) params.set("maxQuantity", maxQuantite);
      
      const res = await fetch(`/api/stock?${params}`);
      const data = await res.json();
      if (res.ok) setStocks(data.stocks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [recherche, minQuantite, maxQuantite]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const totalStock = stocks.reduce((sum, s) => sum + s.stockActuel, 0);
  const totalValue = stocks.reduce((sum, s) => sum + Number(s.valeurAchat), 0);
  const totalSaleValue = stocks.reduce((sum, s) => sum + Number(s.valeurVente), 0);
  const totalMargin = stocks.reduce((sum, s) => sum + Number(s.margePotentielle), 0);
  const alertCount = stocks.filter(s => s.statutStock === "Alerte").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Stock</h1>
          <p className="text-sm text-muted-foreground md:text-base">État des stocks et alertes</p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 gap-2"
            onClick={() => window.open("/api/export/stock?format=csv")}
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 gap-2"
            onClick={() => window.open("/api/export/stock?format=xlsx")}
          >
            <Download className="h-4 w-4" />
            XLSX
          </button>
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          <p className="font-semibold mb-2">{alertCount} produit(s) en alerte de stock :</p>
          <ul className="list-disc pl-5 space-y-1">
            {stocks
              .filter(s => s.statutStock === "Alerte")
              .map(s => (
                <li key={s.id}>
                  <span className="font-medium">{s.produit.code} - {s.produit.designation}</span> : <span className="font-bold">{s.stockActuel}</span> restants (Seuil min : {s.produit.stockMin})
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          placeholder="Rechercher par produit..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Qté min"
            value={minQuantite}
            onChange={(e) => setMinQuantite(e.target.value)}
            className="h-9 w-24 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            placeholder="Qté max"
            value={maxQuantite}
            onChange={(e) => setMaxQuantite(e.target.value)}
            className="h-9 w-24 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3"
          />
        </div>
      </div>

      <div className="relative w-full overflow-x-auto rounded-md border">
        <table className="w-full caption-bottom text-base border-collapse">
          <thead className="[&_tr]:border-b">
            <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Produit</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Stock initial</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Achats</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Ventes</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Stock actuel</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Seuil min</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Statut</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Coût</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Marge potentielle</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <td colSpan={9} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap">
                  Chargement...
                </td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <td colSpan={9} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap">
                  Aucun stock trouvé
                </td>
              </tr>
            ) : (
              stocks.map((s) => (
                <tr key={s.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td className="p-3 align-middle whitespace-nowrap font-medium">{s.produit.code} - {s.produit.designation}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.stockInitial}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.totalAchats}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.totalVentes}</td>
                  <td className="p-3 align-middle whitespace-nowrap font-bold">{s.stockActuel}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{s.produit.stockMin}</td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    <span className={`inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${s.statutStock === "Alerte" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
                      {s.statutStock === "Alerte" ? "Alerte" : "OK"}
                    </span>
                  </td>
                  <td className="p-3 align-middle whitespace-nowrap">{Number(s.valeurAchat).toFixed(2)}</td>
                  <td className="p-3 align-middle whitespace-nowrap">{Number(s.margePotentielle).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
