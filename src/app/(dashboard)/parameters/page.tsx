"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Upload } from "lucide-react";

interface Parameter {
  id: string;
  key: string;
  value: string;
}

const paramSections = [
  {
    title: "Seuils d'alerte",
    params: [
      { key: "purchase_alert_threshold", label: "Seuil d'alerte achat (écart max)", placeholder: "0.00", type: "number" },
      { key: "sale_alert_threshold", label: "Seuil d'alerte vente (écart max)", placeholder: "0.00", type: "number" },
    ],
  },
  {
    title: "Catégories",
    description: "Une catégorie par ligne",
    params: [
      { key: "categories", label: "Liste des catégories", placeholder: "Électronique\nAlimentaire\nVêtements", type: "textarea" },
    ],
  },
  {
    title: "Unités",
    description: "Une unité par ligne",
    params: [
      { key: "units", label: "Liste des unités", placeholder: "pièce\nkg\nm\nlitre", type: "textarea" },
    ],
  },
];

export default function ParametersPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/parameters")
      .then(r => r.json())
      .then(data => {
        if (data.parameters) setParameters(data.parameters);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getValue = (key: string) => {
    return parameters.find(p => p.key === key)?.value || "";
  };

  const handleChange = (key: string, value: string) => {
    setParameters(prev => {
      const existing = prev.find(p => p.key === key);
      if (existing) {
        return prev.map(p => p.key === key ? { ...p, value } : p);
      }
      return [...prev, { id: "", key, value }];
    });
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const value = getValue(key);
      const res = await fetch("/api/parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        const data = await res.json();
        setParameters(prev => {
          const existing = prev.find(p => p.key === key);
          if (existing) {
            return prev.map(p => p.key === key ? data.parameter : p);
          }
          return [...prev, data.parameter];
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Paramètres</h1>
          <p className="text-sm text-muted-foreground md:text-base">Configuration de l&apos;application</p>
        </div>
        <Link href="/import">
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        paramSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {section.params.map((param) => (
                <div key={param.key} className="space-y-2">
                  <Label htmlFor={param.key}>{param.label}</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {param.type === "textarea" ? (
                      <textarea
                        id={param.key}
                        rows={4}
                        placeholder={param.placeholder}
                        value={getValue(param.key)}
                        onChange={(e) => handleChange(param.key, e.target.value)}
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    ) : (
                      <Input
                        id={param.key}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={param.placeholder}
                        value={getValue(param.key)}
                        onChange={(e) => handleChange(param.key, e.target.value)}
                        className="w-full sm:max-w-xs"
                      />
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleSave(param.key)}
                      disabled={saving}
                      className="w-full sm:w-auto sm:self-start"
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
