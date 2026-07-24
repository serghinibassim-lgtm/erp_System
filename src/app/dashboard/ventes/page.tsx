"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Vente {
  id: string;
  date: string;
  numeroVente: string | null;
  quantite: number;
  prixUnitaire: number;
  montantTotal: number;
  modePaiement: string | null;
  alerte: boolean | null;
  produit: { code: string; designation: string };
  client: { nom: string } | null;
}

export default function VentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [recherche, setRecherche] = useState("");
  const [minQuantite, setMinQuantite] = useState("");
  const [maxQuantite, setMaxQuantite] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchVentes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recherche) params.set("search", recherche);
      if (minQuantite) params.set("minQuantity", minQuantite);
      if (maxQuantite) params.set("maxQuantity", maxQuantite);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      
      const res = await fetch(`/api/ventes?${params}`);
      const data = await res.json();
      if (res.ok) setVentes(data.ventes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [recherche, minQuantite, maxQuantite, dateFrom, dateTo]);

  useEffect(() => { fetchVentes(); }, [fetchVentes]);

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
          onChange={(e) => setRecherche(e.target.value)}
          className="h-9 w-full min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 text-muted-foreground"
          />
          <span className="text-muted-foreground">à</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 text-muted-foreground"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <div className="relative w-full overflow-x-auto">
          <table className="w-full caption-bottom text-base border-collapse">
            <thead className="[&_tr]:border-b">
              <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Date</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">N° vente</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Produit</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Client</th>
                <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30">Qté</th>
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
                    Chargement...
                  </td>
                </tr>
              ) : ventes.length === 0 ? (
                <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                  <td colSpan={9} className="p-3 align-middle whitespace-nowrap text-center py-8 text-muted-foreground">
                    Aucune vente trouvée
                  </td>
                </tr>
              ) : (
                ventes.map((s) => (
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
      </div>
    </div>
  );
}
