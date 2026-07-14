"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package, AlertTriangle, TrendingUp, DollarSign,
  ShoppingCart, Users,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)"];

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  alertStock: number;
  totalValue: number;
  totalMargin: number;
  stockStatusDist: { ok: number; alerte: number };
  topProducts: { code: string; designation: string; currentStock: number; costValue: number }[];
  recentPurchases: { id: string; date: string; totalAmount: number; product: { code: string; designation: string }; supplier: { name: string } | null }[];
  recentSales: { id: string; date: string; totalAmount: number; product: { code: string; designation: string }; client: { name: string } | null }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

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

  const cards = [
    { title: "Produits", value: data.totalProducts, icon: Package, color: "text-blue-600" },
    { title: "Stock total", value: data.totalStock, icon: ShoppingCart, color: "text-cyan-600" },
    { title: "Alertes stock", value: data.alertStock, icon: AlertTriangle, color: "text-red-600" },
    { title: "Marge potentielle", value: `${data.totalMargin.toFixed(2)}`, icon: DollarSign, color: "text-purple-600" },
  ];

  const pieData = [
    { name: "OK", value: data.stockStatusDist.ok },
    { name: "Alerte", value: data.stockStatusDist.alerte },
  ];

  const barData = data.topProducts.map(p => ({
    name: p.code,
    value: Number(p.costValue.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground md:text-base">Vue d&apos;ensemble du magasin</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium md:text-sm">{card.title}</CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold md:text-2xl">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top 5 produits (valeur stock)</CardTitle></CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>État des stocks</CardTitle></CardHeader>
          <CardContent>
            {pieData[0].value === 0 && pieData[1].value === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Derniers achats</CardTitle></CardHeader>
          <CardContent>
            {data.recentPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun achat récent</p>
            ) : (
              <div className="space-y-3">
                {data.recentPurchases.map(p => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-2 text-sm">
                    <div>
                      <p className="font-medium">{p.product.code} - {p.product.designation}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.supplier?.name || "N/A"} • {new Date(p.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="font-medium">{Number(p.totalAmount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dernières ventes</CardTitle></CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune vente récente</p>
            ) : (
              <div className="space-y-3">
                {data.recentSales.map(s => (
                  <div key={s.id} className="flex items-center justify-between border-b pb-2 text-sm">
                    <div>
                      <p className="font-medium">{s.product.code} - {s.product.designation}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.client?.name || "N/A"} • {new Date(s.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="font-medium">{Number(s.totalAmount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
