"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, Search, MessageCircle } from "lucide-react";

interface CreditClient {
  id: string;
  code: string;
  nom: string;
  telephone: string | null;
  adresse: string | null;
  totalCredit: number;
  nombreVentes: number;
}

interface CreditFournisseur {
  id: string;
  code: string;
  nom: string;
  telephone: string | null;
  adresse: string | null;
  ice: string | null;
  totalDu: number;
  nombreAchats: number;
}

export default function RecouvrementPage() {
  const [clients, setClients] = useState<CreditClient[]>([]);
  const [fournisseurs, setFournisseurs] = useState<CreditFournisseur[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recouvrement");
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
        setFournisseurs(data.fournisseurs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredClients = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.telephone && c.telephone.includes(search))
  );

  const filteredFournisseurs = fournisseurs.filter(
    (f) =>
      f.nom.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      (f.telephone && f.telephone.includes(search))
  );

  const openWhatsApp = (phone: string, nom: string, montant: number, type: string) => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Bonjour ${nom},\n\nNous vous contactons concernant votre ${type} d'un montant de ${montant.toFixed(2)} DH qui est actuellement impayé.\n\nMerci de bien vouloir régulariser votre situation dans les plus brefs délais.\n\nCordialement,`
    );
    window.open(`https://wa.me/${cleaned}?text=${message}`, "_blank");
  };

  const totalClientCredit = clients.reduce((s, c) => s + c.totalCredit, 0);
  const totalFournisseurDu = fournisseurs.reduce((s, f) => s + f.totalDu, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Recouvrement</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Suivi des créances clients et dettes fournisseurs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Créances clients</p>
          <p className="text-lg font-bold md:text-2xl text-red-600">{totalClientCredit.toFixed(2)} DH</p>
          <p className="text-xs text-muted-foreground">{clients.length} client(s) concerné(s)</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Dettes fournisseurs</p>
          <p className="text-lg font-bold md:text-2xl text-amber-600">{totalFournisseurDu.toFixed(2)} DH</p>
          <p className="text-xs text-muted-foreground">{fournisseurs.length} fournisseur(s) concerné(s)</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Rechercher par nom, code ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent pl-9 pr-3 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : (
        <>
          {/* Clients section */}
          <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
            <div className="flex flex-col gap-1 px-4 pt-4">
              <h2 className="text-lg font-semibold leading-snug">Clients créditeurs</h2>
              <p className="text-sm text-muted-foreground">
                {filteredClients.length} client(s) avec des impayés
              </p>
            </div>
            <div className="p-4">
              {filteredClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun client avec crédit impayé trouvé
                </p>
              ) : (
                <div className="relative w-full overflow-x-auto rounded-md border">
                  <table className="w-full caption-bottom text-base border-collapse">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Code</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Nom</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Téléphone</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Montant impayé</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Ventes</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase w-32">Action</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {filteredClients.map((c) => (
                        <tr key={c.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                          <td className="p-3 align-middle whitespace-nowrap text-sm font-medium">{c.code}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">{c.nom}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">{c.telephone || "-"}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm font-bold text-red-600">{c.totalCredit.toFixed(2)}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">{c.nombreVentes}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">
                            {c.telephone ? (
                              <button
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700 px-2.5 h-7 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5"
                                onClick={() => openWhatsApp(c.telephone!, c.nom, c.totalCredit, "crédit")}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                WhatsApp
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Pas de téléphone</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Fournisseurs section */}
          <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
            <div className="flex flex-col gap-1 px-4 pt-4">
              <h2 className="text-lg font-semibold leading-snug">Fournisseurs créditeurs</h2>
              <p className="text-sm text-muted-foreground">
                {filteredFournisseurs.length} fournisseur(s) avec des impayés
              </p>
            </div>
            <div className="p-4">
              {filteredFournisseurs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun fournisseur avec impayé trouvé
                </p>
              ) : (
                <div className="relative w-full overflow-x-auto rounded-md border">
                  <table className="w-full caption-bottom text-base border-collapse">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Code</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Nom</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Téléphone</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Montant dû</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Achats</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase w-32">Action</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {filteredFournisseurs.map((f) => (
                        <tr key={f.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                          <td className="p-3 align-middle whitespace-nowrap text-sm font-medium">{f.code}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">{f.nom}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">{f.telephone || "-"}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm font-bold text-amber-600">{f.totalDu.toFixed(2)}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">{f.nombreAchats}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">
                            {f.telephone ? (
                              <button
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700 px-2.5 h-7 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5"
                                onClick={() => openWhatsApp(f.telephone!, f.nom, f.totalDu, "paiement")}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                WhatsApp
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Pas de téléphone</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}