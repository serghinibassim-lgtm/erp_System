"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import LoadingDots from "@/components/LoadingDots";
import Pagination from "@/components/Pagination";

interface Vente {
  id: string;
  date: string;
  numeroVente: string | null;
  quantite: number;
  prixUnitaire: number;
  montantTotal: number;
  modePaiement: string;
  alerte: boolean | null;
  produit: { code: string; designation: string };
  client: { nom: string };
}

interface AlertePrix {
  id: string;
  type: "achat" | "vente";
  date: string;
  produit: { code: string; designation: string; prixAchatRef?: number; prixVenteRef?: number };
  contrepartie: string | null;
  prixUnitaire: number;
  prixRef: number;
  ecart: number;
}

interface AlertesData {
  total: number;
  ventes: AlertePrix[];
  achats: AlertePrix[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const PAGE_LIMIT = 20;

export default function VentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [recherche, setRecherche] = useState("");
  const [minQuantite, setMinQuantite] = useState("");
  const [maxQuantite, setMaxQuantite] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<"date" | "quantite">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [alertes, setAlertes] = useState<AlertesData | null>(null);
  const [notification, setNotification] = useState(false);

  const fetchVentes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recherche) params.set("search", recherche);
      if (minQuantite) params.set("minQuantity", minQuantite);
      if (maxQuantite) params.set("maxQuantity", maxQuantite);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));
      
      const res = await fetch(`/api/ventes?${params}`);
      const data = await res.json();
      if (res.ok) {
        setVentes(data.ventes);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [recherche, minQuantite, maxQuantite, dateFrom, dateTo, page]);

  useEffect(() => { fetchVentes(); }, [fetchVentes]);

  useEffect(() => {
    fetch("/api/alertes-prix")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json.error) throw new Error(json.error || "Erreur");
        setAlertes(json);
      })
      .catch((err) => console.error(err));
  }, []);

  const toggleSort = (field: "date" | "quantite") => {
    if (sortField === field) {
      setSortOrder(o => o === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedVentes = [...ventes].sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;
    if (sortField === "date") return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
    return dir * (a.quantite - b.quantite);
  });

  const sortIndicator = (field: "date" | "quantite") => {
    if (sortField !== field) return " ↕";
    return sortOrder === "asc"
      ? <span className="text-emerald-500"> ↑</span>
      : <span className="text-red-500"> ↓</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ventes</h1>
          <p className="text-sm text-muted-foreground md:text-base">Historique des ventes et sorties</p>
        </div>
        <Link href="/dashboard/ventes/nouveau" className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto">
          Nouvelle vente
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <input
          placeholder="Rechercher par produit..."
          value={recherche}
          onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
          className="h-9 w-full min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 text-muted-foreground"
          />
          <span className="text-muted-foreground">à</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 text-muted-foreground"
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
            <span>Alertes de prix</span>
            <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${alertes && alertes.ventes.length > 0 ? "bg-red-500" : "bg-muted-foreground/50"}`}>
              {alertes ? alertes.ventes.length : "…"}
            </span>
          </button>
        </div>
        <div className="overflow-hidden rounded-md border">
        <div className="relative w-full overflow-x-auto">
          <table className="w-full caption-bottom text-base border-collapse">
            <thead className="[&_tr]:border-b">
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("date")}>Date{sortIndicator("date")}</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">N° vente</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Produit</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Client</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("quantite")}>Qté{sortIndicator("quantite")}</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Prix unit.</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Total</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Alerte</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 w-20">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td colSpan={9} className="p-3 align-middle whitespace-nowrap text-center py-8 text-muted-foreground">
                    <LoadingDots />
                  </td>
                </tr>
              ) : ventes.length === 0 ? (
                <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td colSpan={9} className="p-3 align-middle whitespace-nowrap text-center py-8 text-muted-foreground">
                    Aucune vente trouvée
                  </td>
                </tr>
              ) : (
                sortedVentes.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                    <td className="p-3 align-middle whitespace-nowrap">{new Date(s.date).toLocaleDateString("fr-FR")}</td>
                    <td className="p-3 align-middle whitespace-nowrap">{s.numeroVente || "-"}</td>
                    <td className="p-3 align-middle whitespace-nowrap">{s.produit.code} - {s.produit.designation}</td>
                    <td className="p-3 align-middle whitespace-nowrap">{s.client?.nom || "-"}</td>
                    <td className="p-3 align-middle whitespace-nowrap">{s.quantite}</td>
                    <td className="p-3 align-middle whitespace-nowrap">{Number(s.prixUnitaire).toFixed(2)}</td>
                    <td className="p-3 align-middle whitespace-nowrap">{Number(s.montantTotal).toFixed(2)}</td>
                    <td className="p-3 align-middle whitespace-nowrap">
                      {s.alerte ? <span className="inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap bg-red-300 text-secondary-foreground">Vérifier prix</span> : <span className="inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap bg-green-200 text-secondary-foreground">OK</span>}
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap">
                      {s.numeroVente && (
                        <button
                          onClick={() => window.open(`/dashboard/ventes/facture?doc=${encodeURIComponent(s.numeroVente!)}`, "_blank")}
                          className="inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap bg-blue-100 hover:bg-blue-200 text-blue-800 cursor-pointer"
                        >
                          Facture
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && <Pagination page={pagination.page} totalPages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />}
        </div>
      </div>

      {notification && alertes && (
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
                  <h2 className="text-lg font-bold">Alertes de prix</h2>
                  <p className="text-sm text-muted-foreground">{alertes.ventes.length} alerte(s) de vente détectée(s)</p>
                </div>
              </div>
              <button onClick={() => setNotification(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {alertes.ventes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune alerte de prix enregistrée.</p>
              ) : (
                <div className="space-y-6">
                  <section>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-600">Vendu en dessous du prix de référence</h3>
                    <ul className="space-y-2">
                      {alertes.ventes.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                          <div>
                            <p className="text-sm font-semibold">{a.produit.code} - {a.produit.designation}</p>
                            <p className="text-xs text-muted-foreground">
                              Vendu à {a.prixUnitaire.toFixed(2)} MAD (réf. {a.prixRef.toFixed(2)} MAD) • {a.contrepartie || "Client N/A"} • {new Date(a.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-700">
                            -{a.ecart.toFixed(2)} MAD
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
