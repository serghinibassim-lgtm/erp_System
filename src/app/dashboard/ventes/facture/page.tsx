"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FactureItem {
  id: string;
  produit: { code: string; designation: string; unite: string };
  quantite: number;
  prixUnitaire: number;
  montantTotal: number;
  paye: boolean;
}

interface DocumentInfo {
  numeroVente: string;
  date: string;
  client: { nom: string; telephone: string | null; adresse: string | null } | null;
  modePaiement: string | null;
  observation: string | null;
  paye: boolean;
  dateLimitePaiement: string | null;
  datePaiement: string | null;
}

function FactureVenteContent() {
  const searchParams = useSearchParams();
  const doc = searchParams.get("doc");
  const downloadParam = searchParams.get("download");
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
    fetch(`/api/ventes/facture?doc=${encodeURIComponent(doc)}`)
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

  const downloadPdf = useCallback(() => {
    if (!document) return;
    const pdf = new jsPDF();
    const dateStr = document.date ? new Date(document.date).toLocaleDateString("fr-FR") : "-";

    pdf.setFontSize(18);
    pdf.text("FACTURE DE VENTE", 14, 20);
    pdf.setFontSize(10);
    pdf.text(`N° ${document.numeroVente}`, 14, 28);

    pdf.setFontSize(10);
    pdf.text("ARP Magasin", 196, 20, { align: "right" });
    pdf.text(`Date: ${dateStr}`, 196, 28, { align: "right" });

    let y = 40;
    if (document.client) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Client:", 14, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(document.client.nom, 14, y + 6);
      if (document.client.adresse) pdf.text(document.client.adresse, 14, y + 12);
      if (document.client.telephone) pdf.text(`Tél: ${document.client.telephone}`, 14, y + 18);
      y += 26;
    }

    autoTable(pdf, {
      startY: y,
      head: [["Code", "Désignation", "Qté", "Prix unit.", "Total"]],
      body: items.map(item => [
        item.produit.code,
        item.produit.designation,
        `${item.quantite} ${item.produit.unite}`,
        `${item.prixUnitaire.toFixed(2)}`,
        `${item.montantTotal.toFixed(2)}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66] },
    });

    const finalY = (pdf as any).lastAutoTable.finalY || y + 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total: ${total.toFixed(2)} DH`, 196, finalY + 10, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    let infoY = finalY + 18;
    if (document.modePaiement) {
      pdf.text(`Mode: ${document.modePaiement}`, 196, infoY, { align: "right" });
      infoY += 8;
    }
    if (document.modePaiement === "Crédit") {
      pdf.text(`Paiement: ${document.paye ? "Payé" : "Non payé"}`, 14, infoY);
      if (document.dateLimitePaiement) {
        const limite = new Date(document.dateLimitePaiement).toLocaleDateString("fr-FR");
        pdf.text(`Date limite: ${limite}`, 14, infoY + 6);
      }
      if (document.datePaiement) {
        const payeeLe = new Date(document.datePaiement).toLocaleDateString("fr-FR");
        pdf.text(`Payée le: ${payeeLe}`, 14, infoY + 12);
      }
      infoY += 18;
    }
    if (document.observation) {
      pdf.text(`Observation: ${document.observation}`, 14, infoY);
    }

    pdf.save(`facture-vente-${document.numeroVente}.pdf`);
  }, [document, items, total]);

  useEffect(() => {
    if (!loading && document && downloadParam === "true") {
      const timer = setTimeout(() => downloadPdf(), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, document, downloadParam, downloadPdf]);



  if (loading) return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!document) return null;

  const dateStr = document.date ? new Date(document.date).toLocaleDateString("fr-FR") : "-";

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <button
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-4 h-10 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Télécharger PDF
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background hover:bg-muted px-4 h-10 text-sm font-medium"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </button>
      </div>

      <div className="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 p-6 sm:p-8 print:ring-0 print:p-0">
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FACTURE DE VENTE</h1>
            <p className="text-muted-foreground">N° {document.numeroVente}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">ARP Magasin</p>
            <p className="text-sm text-muted-foreground">Date: {dateStr}</p>
          </div>
        </div>

        {document.client && (
          <div className="mb-6 p-4 bg-muted/20 rounded-lg">
            <h3 className="font-semibold mb-1">Client</h3>
            <p className="text-sm">{document.client.nom}</p>
            {document.client.adresse && <p className="text-sm text-muted-foreground">{document.client.adresse}</p>}
            {document.client.telephone && <p className="text-sm text-muted-foreground">Tél: {document.client.telephone}</p>}
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

        {document.modePaiement === "Crédit" && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${document.paye ? "bg-green-50" : "bg-red-50"}`}>
            <span className="font-semibold">Paiement: </span>
            {document.paye ? (
              <span className="text-green-700 font-medium">Payé</span>
            ) : (
              <span className="text-red-600 font-medium">Non payé</span>
            )}
            {document.dateLimitePaiement && (
              <span className="ml-4">
                Date limite: <strong>{new Date(document.dateLimitePaiement).toLocaleDateString("fr-FR")}</strong>
                {!document.paye && new Date(document.dateLimitePaiement) < new Date() && (
                  <span className="ml-2 text-red-600 font-medium">(Dépassée)</span>
                )}
              </span>
            )}
            {document.datePaiement && (
              <span className="ml-4">
                Payée le: <strong>{new Date(document.datePaiement).toLocaleDateString("fr-FR")}</strong>
              </span>
            )}
          </div>
        )}

        {document.observation && (
          <div className="mt-6 p-3 bg-muted/20 rounded-lg text-sm">
            <span className="font-semibold">Observation: </span>{document.observation}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FactureVentePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Chargement...</div>}>
      <FactureVenteContent />
    </Suspense>
  );
}