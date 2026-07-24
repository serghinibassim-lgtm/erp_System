"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";

interface FactureItem {
  id: string;
  produit: { code: string; designation: string; unite: string };
  quantite: number;
  prixUnitaire: number;
  montantTotal: number;
}

interface DocumentInfo {
  numeroDocument: string;
  date: string;
  fournisseur: { nom: string; telephone: string | null; adresse: string | null; ice: string | null } | null;
  modePaiement: string | null;
  observation: string | null;
}

function FactureAchatContent() {
  const searchParams = useSearchParams();
  const doc = searchParams.get("doc");
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [items, setItems] = useState<FactureItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doc) {
      setError("Aucun document spécifié");
      setLoading(false);
      return;
    }
    fetch(`/api/achats/facture?doc=${encodeURIComponent(doc)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setDocument(data.document);
          setItems(data.items);
          setTotal(data.total);
        } else {
          setError(data.error || "Erreur");
        }
      })
      .catch(() => setError("Erreur de connexion"))
      .finally(() => setLoading(false));
  }, [doc]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!document) return null;

  const dateStr = document.date ? new Date(document.date).toLocaleDateString("fr-FR") : "-";

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-4 h-10 text-sm font-medium"
        >
          <Printer className="h-4 w-4" />
          Imprimer / PDF
        </button>
      </div>

      <div className="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 p-6 sm:p-8 print:ring-0 print:p-0">
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FACTURE D&apos;ACHAT</h1>
            <p className="text-muted-foreground">N° {document.numeroDocument}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">ARP Magasin</p>
            <p className="text-sm text-muted-foreground">Date: {dateStr}</p>
          </div>
        </div>

        {document.fournisseur && (
          <div className="mb-6 p-4 bg-muted/20 rounded-lg">
            <h3 className="font-semibold mb-1">Fournisseur</h3>
            <p className="text-sm">{document.fournisseur.nom}</p>
            {document.fournisseur.adresse && <p className="text-sm text-muted-foreground">{document.fournisseur.adresse}</p>}
            {document.fournisseur.telephone && <p className="text-sm text-muted-foreground">Tél: {document.fournisseur.telephone}</p>}
            {document.fournisseur.ice && <p className="text-sm text-muted-foreground">ICE: {document.fournisseur.ice}</p>}
          </div>
        )}

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-border/60">
              <th className="text-left py-2 text-sm font-semibold">Code</th>
              <th className="text-left py-2 text-sm font-semibold">Désignation</th>
              <th className="text-right py-2 text-sm font-semibold">Qté</th>
              <th className="text-right py-2 text-sm font-semibold">Prix unit.</th>
              <th className="text-right py-2 text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/40">
                <td className="py-2 text-sm">{item.produit.code}</td>
                <td className="py-2 text-sm">{item.produit.designation}</td>
                <td className="py-2 text-sm text-right">{item.quantite} {item.produit.unite}</td>
                <td className="py-2 text-sm text-right">{item.prixUnitaire.toFixed(2)}</td>
                <td className="py-2 text-sm text-right font-medium">{item.montantTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t pt-4">
          <div className="text-right">
            <p className="text-lg font-bold">Total: {total.toFixed(2)} DH</p>
            {document.modePaiement && (
              <p className="text-sm text-muted-foreground">Mode: {document.modePaiement}</p>
            )}
          </div>
        </div>

        {document.observation && (
          <div className="mt-6 p-3 bg-muted/20 rounded-lg text-sm">
            <span className="font-semibold">Observation: </span>{document.observation}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FactureAchatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Chargement...</div>}>
      <FactureAchatContent />
    </Suspense>
  );
}