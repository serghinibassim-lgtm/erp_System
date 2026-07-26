"use client";

import { useState, useEffect } from "react";
import {
  Package, AlertTriangle, TrendingUp, DollarSign,
  ShoppingCart, Users, ArrowUpRight, ArrowDownRight,
  Minus
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)"];

interface DashboardData {
  totalProduits: number;
  stockTotal: number;
  stockAlerte: number;
  valeurTotale: number;
  margeTotale: number;
  totalClients: number;
  totalFournisseurs: number;
  totalVentesMontant: number;
  totalAchatsMontant: number;
  ventesCeMois: number;
  ventesMoisDernier: number;
  achatsCeMois: number;
  achatsMoisDernier: number;
  repartitionStock: { ok: number; alerte: number };
  topProduits: { code: string; designation: string; stockActuel: number; valeurAchat: number }[];
  achatsRecents: { id: string; date: string; montantTotal: number; produit: { code: string; designation: string }; fournisseur: { nom: string } | null }[];
  ventesRecentes: { id: string; date: string; montantTotal: number; produit: { code: string; designation: string }; client: { nom: string } | null }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json.error) {
          throw new Error(json.error || "Erreur de chargement");
        }
        return json;
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-red-600">Erreur</h1>
          <p className="text-sm text-muted-foreground md:text-base">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground md:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value);
  };

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? { val: "+100%", dir: "up", color: "text-emerald-500" } : null;
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    if (percent > 0) return { val: `+${percent.toFixed(1)}%`, dir: "up", color: "text-emerald-500" };
    if (percent < 0) return { val: `${percent.toFixed(1)}%`, dir: "down", color: "text-red-500" };
    return { val: "0%", dir: "flat", color: "text-muted-foreground" };
  };

  const ventesTrend = calcTrend(data.ventesCeMois, data.ventesMoisDernier);
  const achatsTrend = calcTrend(data.achatsCeMois, data.achatsMoisDernier);

  const cards = [
    { title: "Produits", value: data.totalProduits, subtitle: "Total des références", icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Quantité en stock", value: data.stockTotal, subtitle: "Unités disponibles", icon: Package, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { title: "Valeur du stock", value: formatCurrency(data.valeurTotale), subtitle: "Coût d'achat global", icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Marge potentielle", value: formatCurrency(data.margeTotale), subtitle: "Bénéfice estimé", icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10" },
    { title: "Chiffre d'Affaires", value: formatCurrency(data.totalVentesMontant), subtitle: "Total des ventes", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: ventesTrend, trendLabel: "vs mois dernier" },
    { title: "Achats Fournisseurs", value: formatCurrency(data.totalAchatsMontant), subtitle: "Total des achats", icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-500/10", trend: achatsTrend, trendLabel: "vs mois dernier" },
    { title: "Clients Actifs", value: data.totalClients, subtitle: "Base clients", icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" },
    { title: "Alertes stock", value: data.stockAlerte, subtitle: "À réapprovisionner", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  const pieData = [
    { name: "OK", value: data.repartitionStock.ok },
    { name: "Alerte", value: data.repartitionStock.alerte },
  ];

  const barData = data.topProduits.map(p => ({
    name: p.code,
    value: Number(p.valeurAchat.toFixed(2)),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Dashboard</h1>
        <p className="mt-1 text-base text-muted-foreground md:text-lg">Vue d&apos;ensemble et statistiques du magasin</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const valueColor = card.title === "Alertes stock"
            ? "text-red-500"
            : card.title === "Chiffre d'Affaires" || card.title === "Marge potentielle"
              ? "text-emerald-500"
              : "text-foreground";
          return (
            <div key={card.title} className="flex flex-col rounded-2xl bg-card p-6 text-card-foreground shadow-sm ring-1 ring-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</h3>
              <div className="mt-4 flex flex-col gap-1">
                <p className={`text-3xl font-extrabold tracking-tight ${valueColor}`}>{card.value}</p>
                <div className="flex items-center gap-2 mt-1">
                  {card.trend && (
                    <span className={`inline-flex items-center text-xs font-semibold ${card.trend.color}`}>
                      {card.trend.dir === "up" && <ArrowUpRight className="mr-1 h-3 w-3" />}
                      {card.trend.dir === "down" && <ArrowDownRight className="mr-1 h-3 w-3" />}
                      {card.trend.dir === "flat" && <Minus className="mr-1 h-3 w-3" />}
                      {card.trend.val}
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground font-medium">
                    {card.trendLabel ? card.trendLabel : card.subtitle}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-border">
          <div className="flex flex-col gap-1 px-6 pt-6">
            <h3 className="text-xl font-bold leading-snug">Top 5 produits (valeur stock)</h3>
            <p className="text-sm text-muted-foreground">Les références représentant la plus grande valeur immobilisée.</p>
          </div>
          <div className="p-6">
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 13 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val} DHS`} />
                  <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-border">
          <div className="flex flex-col gap-1 px-6 pt-6">
            <h3 className="text-xl font-bold leading-snug">État des stocks</h3>
            <p className="text-sm text-muted-foreground">Répartition entre les produits en alerte et normaux.</p>
          </div>
          <div className="p-6 flex items-center justify-center">
            {pieData[0].value === 0 && pieData[1].value === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-border">
          <div className="flex flex-col gap-1 px-6 pt-6">
            <h3 className="text-xl font-bold leading-snug">Derniers achats</h3>
            <p className="text-sm text-muted-foreground">Les 5 dernières réceptions de marchandises.</p>
          </div>
          <div className="px-6 pb-6 mt-4">
            {data.achatsRecents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun achat récent</p>
            ) : (
              <div className="space-y-4">
                {data.achatsRecents.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted/50 border">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold">{p.produit.code} - {p.produit.designation}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.fournisseur?.nom || "N/A"} • {new Date(p.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-foreground">{formatCurrency(p.montantTotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-border">
          <div className="flex flex-col gap-1 px-6 pt-6">
            <h3 className="text-xl font-bold leading-snug">Dernières ventes</h3>
            <p className="text-sm text-muted-foreground">Les 5 dernières sorties de stock.</p>
          </div>
          <div className="px-6 pb-6 mt-4">
            {data.ventesRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune vente récente</p>
            ) : (
              <div className="space-y-4">
                {data.ventesRecentes.map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted/50 border">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold">{s.produit.code} - {s.produit.designation}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.client?.nom || "N/A"} • {new Date(s.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-foreground">{formatCurrency(s.montantTotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
