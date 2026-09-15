"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, AlertTriangle, X } from "lucide-react";
import LoadingDots from "@/components/LoadingDots";
import Pagination from "@/components/Pagination";

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
    categorie: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const PAGE_LIMIT = 20;

export default function StockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [recherche, setRecherche] = useState("");
  const [minQuantite, setMinQuantite] = useState("");
  const [maxQuantite, setMaxQuantite] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recherche) params.set("search", recherche);
      if (minQuantite) params.set("minQuantity", minQuantite);
      if (maxQuantite) params.set("maxQuantity", maxQuantite);
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));
      
      const res = await fetch(`/api/stock?${params}`);
      const data = await res.json();
      if (res.ok) {
        setStocks(data.stocks);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [recherche, minQuantite, maxQuantite, page]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const toggleSort = () => setSortOrder(o => o === "asc" ? "desc" : "asc");

  const sortedStocks = [...stocks].sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;
    return dir * (a.stockActuel - b.stockActuel);
  });

  const totalStock = stocks.reduce((sum, s) => sum + s.stockActuel, 0);
  const totalValue = stocks.reduce((sum, s) => sum + Number(s.valeurAchat), 0);
  const totalSaleValue = stocks.reduce((sum, s) => sum + Number(s.valeurVente), 0);
  const totalMargin = stocks.reduce((sum, s) => sum + Number(s.margePotentielle), 0);
  const alertCount = stocks.filter(s => s.statutStock === "Alerte").length;
  const alertsByCategory = stocks
    .filter(s => s.statutStock === "Alerte")
    .reduce((acc, s) => {
      const cat = s.produit.categorie || "Autre";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {} as Record<string, typeof stocks>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Stock</h1>
          <p className="text-sm text-muted-foreground md:text-base">État des stocks et alertes</p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 gap-2"
          onClick={() => window.open("/api/export/stock?format=xlsx")}
        >
          <Download className="h-4 w-4" />
          Télécharger XLSX
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground font-sans md:text-sm">Stock total</p>
          <p className="text-lg font-bold  font-inter md:text-2xl text-blue-600">{totalStock}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Valeur de stock</p>
          <p className="text-lg font-bold md:text-2xl text-amber-600">{totalValue.toFixed(2)} DH</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Valeur de vente</p>
          <p className="text-lg font-bold md:text-2xl text-emerald-600">{totalSaleValue.toFixed(2)} DH</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Marge potentielle</p>
          <p className={`text-lg font-bold md:text-2xl ${totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>{totalMargin.toFixed(2)} DH</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          placeholder="Rechercher par produit..."
          value={recherche}
          onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
          className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Qté min"
            value={minQuantite}
            onChange={(e) => { setMinQuantite(e.target.value); setPage(1); }}
            className="h-9 w-24 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            placeholder="Qté max"
            value={maxQuantite}
            onChange={(e) => { setMaxQuantite(e.target.value); setPage(1); }}
            className="h-9 w-24 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-end">
          <button
            onClick={() => setNotification(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition-all cursor-pointer hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:hover:bg-red-950/40"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Alertes de stock</span>
            <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${alertCount > 0 ? "bg-red-500" : "bg-muted-foreground/50"}`}>
              {alertCount}
            </span>
          </button>
        </div>
      <div className="overflow-hidden rounded-md border"><div className="relative w-full overflow-x-auto">
        <table className="w-full caption-bottom text-base border-collapse">
          <thead className="[&_tr]:border-b">
            <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Produit</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Stock initial</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Achats</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Ventes</th>
              <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 cursor-pointer select-none hover:bg-muted/50" onClick={toggleSort}>Stock actuel{sortOrder === "asc" ? <span className="text-emerald-500"> ↑</span> : <span className="text-red-500"> ↓</span>}</th>
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
                  <LoadingDots />
                </td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <td colSpan={9} className="p-3 text-center py-8 text-muted-foreground align-middle whitespace-nowrap">
                  Aucun stock trouvé
                </td>
              </tr>
              ) : (
                sortedStocks.map((s) => (
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
      </div>{pagination && <Pagination page={pagination.page} totalPages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />}</div>
      </div>

      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNotification(false)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-card text-card-foreground shadow-xl ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Alertes de stock</h2>
                  <p className="text-sm text-muted-foreground">{alertCount} produit(s) sous le seuil minimum</p>
                </div>
              </div>
              <button onClick={() => setNotification(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {alertCount === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune alerte de stock.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(alertsByCategory).map(([categorie, items]) => (
                    <section key={categorie}>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-600">{categorie}</h3>
                      <ul className="space-y-2">
                        {items.map(s => (
                          <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                            <div>
                              <p className="text-sm font-semibold">{s.produit.code} - {s.produit.designation}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.stockActuel} restants • Seuil min : {s.produit.stockMin}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-700">
                              {s.stockActuel}/{s.produit.stockMin}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
