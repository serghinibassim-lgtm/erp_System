"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, CheckCircle, FileText, RotateCcw } from "lucide-react";
import LoadingDots from "@/components/LoadingDots";

interface CreditClient {
  id: string;
  code: string;
  nom: string;
  telephone: string | null;
  totalCredit: number;
  unpaidTotal: number;
  nombreVentes: number;
  nombreUnpaid: number;
  dateLimitePaiement: string | null;
  statut: string;
  numeroVente: string | null;
  datePaiement: string | null;
}

export default function RecouvrementPage() {
  const [clients, setClients] = useState<CreditClient[]>([]);
  const [stats, setStats] = useState({ unpaidClients: 0, unpaidInvoices: 0, totalUnpaid: 0, totalOverdue: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const savedUnpaid = useRef<Record<string, { montant: number; nombre: number }>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recouvrement");
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
        setStats(data.stats || { unpaidClients: 0, unpaidInvoices: 0, totalUnpaid: 0, totalOverdue: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarquerPaye = async (clientId: string) => {
    setPaying(clientId);
    try {
      const res = await fetch("/api/recouvrement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        const client = clients.find(c => c.id === clientId);
        if (client) {
          savedUnpaid.current[clientId] = { montant: client.unpaidTotal, nombre: client.nombreUnpaid };
        }
        setClients(prev => {
          const updated = prev.map(c =>
            c.id === clientId ? { ...c, statut: "Payé", datePaiement: now } : c
          );
          const moved = updated.find(c => c.id === clientId);
          return moved ? [moved, ...updated.filter(c => c.id !== clientId)] : updated;
        });
        setStats(prev => {
          const client = clients.find(c => c.id === clientId);
          if (!client) return prev;
          return {
            unpaidClients: Math.max(0, prev.unpaidClients - (client.statut !== "Payé" ? 1 : 0)),
            unpaidInvoices: Math.max(0, prev.unpaidInvoices - client.nombreUnpaid),
            totalUnpaid: Math.max(0, prev.totalUnpaid - client.unpaidTotal),
            totalOverdue: client.statut === "En retard" ? Math.max(0, prev.totalOverdue - client.unpaidTotal) : prev.totalOverdue,
          };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(null);
    }
  };

  const handleRendreImpaye = async (clientId: string) => {
    setPaying(clientId);
    try {
      const res = await fetch("/api/recouvrement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, paye: false }),
      });
      if (res.ok) {
        const client = clients.find(c => c.id === clientId);
        const saved = savedUnpaid.current[clientId] || { montant: client?.unpaidTotal || 0, nombre: client?.nombreUnpaid || 0 };
        const enRetard = client?.dateLimitePaiement ? new Date(client.dateLimitePaiement) < new Date() : false;
        setClients(prev => {
          const updated = prev.map(c =>
            c.id === clientId
              ? { ...c, statut: enRetard ? "En retard" : "En attente", datePaiement: null, unpaidTotal: saved.montant, nombreUnpaid: saved.nombre }
              : c
          );
          const moved = updated.find(c => c.id === clientId);
          return moved ? [moved, ...updated.filter(c => c.id !== clientId)] : updated;
        });
        setStats(prev => ({
          unpaidClients: prev.unpaidClients + 1,
          unpaidInvoices: prev.unpaidInvoices + saved.nombre,
          totalUnpaid: prev.totalUnpaid + saved.montant,
          totalOverdue: enRetard ? prev.totalOverdue + saved.montant : prev.totalOverdue,
        }));
        delete savedUnpaid.current[clientId];
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(null);
    }
  };

  const openWhatsApp = (phone: string, nom: string, montant: number) => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Bonjour ${nom},\n\nNous vous contactons concernant votre crédit d'un montant de ${montant.toFixed(2)} DH qui est actuellement impayé.\n\nMerci de bien vouloir régulariser votre situation dans les plus brefs délais.\n\nCordialement, ARP Magasin`
    );
    window.open(`https://wa.me/${cleaned}?text=${message}`, "_blank");
  };

  const filteredClients = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.telephone && c.telephone.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Recouvrement</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Suivi des créances clients
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Clients non payés</p>
          <p className="text-lg font-bold md:text-2xl">{stats.unpaidClients}</p>
          <p className="text-xs text-muted-foreground">client(s) avec impayés</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Total non payé</p>
          <p className="text-lg font-bold md:text-2xl text-red-600">{stats.totalUnpaid.toFixed(2)} DH</p>
          <p className="text-xs text-muted-foreground">montant total impayé</p>
        </div>
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Total en retard</p>
          <p className="text-lg font-bold md:text-2xl text-amber-600">{stats.totalOverdue.toFixed(2)} DH</p>
          <p className="text-xs text-muted-foreground">montant dépassé</p>
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
        <div className="text-center py-8 text-muted-foreground"><LoadingDots /></div>
      ) : (
        <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
          <div className="flex flex-col gap-1 px-4 pt-4">
            <h2 className="text-lg font-semibold leading-snug">Clients créditeurs</h2>
            <p className="text-sm text-muted-foreground">
              {filteredClients.length} client(s)
            </p>
          </div>
          <div className="p-4">
            {filteredClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun client trouvé
              </p>
            ) : (
              <div className="relative w-full overflow-x-auto rounded-md border">
                <table className="w-full caption-bottom text-base border-collapse">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                      <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Client</th>
                      <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Date limite</th>
                      <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Reste impayé</th>
                      <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Statut</th>
                      <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredClients.map((c) => {
                      const isPaye = c.statut === "Payé";
                      const dateLimite = c.dateLimitePaiement
                        ? new Date(c.dateLimitePaiement).toLocaleDateString("fr-FR")
                        : "-";
                      const datePaiementStr = c.datePaiement
                        ? new Date(c.datePaiement).toLocaleDateString("fr-FR")
                        : null;
                      const statutColor = isPaye
                        ? "text-green-700 bg-green-50"
                        : c.statut === "En retard"
                          ? "text-red-600 bg-red-50"
                          : "text-amber-600 bg-amber-50";

                      return (
                        <tr key={c.id} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                          <td className="p-3 align-middle whitespace-nowrap text-sm font-medium">{c.nom}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">{dateLimite}</td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm font-bold text-red-600">
                            <span className={isPaye ? "line-through text-muted-foreground" : ""}>
                              {(isPaye ? (savedUnpaid.current[c.id]?.montant ?? 0) : c.unpaidTotal).toFixed(2)} DH
                            </span>
                          </td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statutColor}`}>
                              {c.statut}
                              {isPaye && datePaiementStr && <span className="ml-1">({datePaiementStr})</span>}
                            </span>
                          </td>
                          <td className="p-3 align-middle whitespace-nowrap text-sm">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              {isPaye ? (
                                <button
                                  onClick={() => handleRendreImpaye(c.id)}
                                  disabled={paying === c.id}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 h-7 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  {paying === c.id ? "..." : "Impayé"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMarquerPaye(c.id)}
                                  disabled={paying === c.id}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 px-2 h-7 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  {paying === c.id ? "..." : "Payé"}
                                </button>
                              )}
                              {c.telephone && (
                                <button
                                  onClick={() => openWhatsApp(c.telephone!, c.nom, c.unpaidTotal)}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700 px-2 h-7 text-xs font-medium whitespace-nowrap transition-all"
                                >
                                  <img src="/whatsapp.svg" alt="WhatsApp" className="size-3.5" />
                                  WhatsApp
                                </button>
                              )}
                              {c.numeroVente && (
                                <button
                                  onClick={() => window.open(`/dashboard/ventes/facture?doc=${c.numeroVente}&download=true`, "_blank")}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background hover:bg-muted px-2 h-7 text-xs font-medium whitespace-nowrap transition-all"
                                >
                                  <FileText className="h-3 w-3" />
                                  Facture
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
