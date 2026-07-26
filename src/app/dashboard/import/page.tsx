"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: { produits: number; achats: number; ventes: number; errors: string[] } } | null>(null);
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

      <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 px-4 pt-4">
          <h2 className="text-lg font-semibold leading-snug">Fichier source</h2>
        </div>
        <div className="space-y-4 px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Le fichier doit contenir une feuille <strong>PRODUITS</strong>. Les colonnes sont détectées
            automatiquement par leur nom. Formats supportés :
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li><strong>Code produit</strong>, <strong>Désignation</strong>, Stock initial, Prix achat, Prix vente (obligatoires)</li>
            <li><strong>Catégorie</strong>, <strong>Unité</strong>, Stock minimum (optionnelles)</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Les feuilles <strong>ACHATS</strong> et <strong>VENTES</strong> sont optionnelles (import des mouvements historiques).
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

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            <Upload className="h-4 w-4" />
            {loading ? "Import en cours..." : "Lancer l'import"}
          </button>
        </div>
      </div>

      {result && (
        <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
          <div className="flex flex-col gap-1 px-4 pt-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold leading-snug">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Résultat
            </h2>
          </div>
          <div className="space-y-2 px-4 pb-4 text-sm">
            <p>{result.message}</p>
            {result.results && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>{result.results.produits} produit(s) importés</li>
                <li>{result.results.achats} achat(s) importé(s)</li>
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
          </div>
        </div>
      )}
    </div>
  );
}
