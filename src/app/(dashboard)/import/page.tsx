"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: { produits: number; ventes: number; errors: string[] } } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Erreur de connexion" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Import Excel</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Importer des produits et mouvements depuis un fichier Excel
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Fichier source</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le fichier doit contenir une feuille <strong>PRODUITS</strong> avec les colonnes :
            Code produit, Produit, Stock initial, Prix achat source, Prix vente source.
            Les feuilles <strong>VENTES</strong> et <strong>ACHATS</strong> sont optionnelles.
          </p>

          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/50"
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                <p className="text-xs text-muted-foreground">Formats .xlsx, .xls</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            <Upload className="h-4 w-4" />
            {loading ? "Import en cours..." : "Lancer l'import"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Résultat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{result.message}</p>
            {result.results && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>{result.results.produits} produit(s) importés</li>
                <li>{result.results.ventes} vente(s) historique(s) importées</li>
                {result.results.errors.length > 0 && (
                  <li className="text-red-500">
                    {result.results.errors.length} erreur(s) :
                    <ul className="ml-4 list-inside list-disc">
                      {result.results.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
