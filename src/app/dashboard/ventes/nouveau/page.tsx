"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Printer } from "lucide-react";

interface ProductOption {
  id: string;
  code: string;
  designation: string;
  prixVenteRef: number;
  stock?: { stockActuel: number };
}

interface ClientOption {
  id: string;
  nom: string;
}

interface LineItem {
  key: string;
  produitId: string;
  quantite: string;
  prixUnitaire: string;
  montantTotal: string;
}

export default function NouvelleVentePage() {
  const router = useRouter();
  const [produits, setProduits] = useState<ProductOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [numeroVente, setNumeroVente] = useState("");
  const [clientId, setClientId] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [observation, setObservation] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: crypto.randomUUID?.() || "1", produitId: "", quantite: "1", prixUnitaire: "", montantTotal: "" },
  ]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [createdDocNum, setCreatedDocNum] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/produits?limit=100").then(r => r.json()),
      fetch("/api/clients?limit=100").then(r => r.json()).catch(() => ({ clients: [] })),
    ]).then(([prodData, cliData]) => {
      if (prodData.produits) setProduits(prodData.produits);
      if (cliData.clients) setClients(cliData.clients);
    }).catch(() => {});
  }, []);

  const addLine = () => {
    setLineItems(prev => [...prev, {
      key: crypto.randomUUID?.() || String(Date.now()),
      produitId: "",
      quantite: "1",
      prixUnitaire: "",
      montantTotal: "",
    }]);
  };

  const removeLine = (key: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(li => li.key !== key));
  };

  const updateLine = (key: string, field: keyof LineItem, value: string) => {
    setLineItems(prev => prev.map(li => {
      if (li.key !== key) return li;
      const updated = { ...li, [field]: value };
      if (field === "produitId" && value) {
        const produit = produits.find(p => p.id === value);
        if (produit) updated.prixUnitaire = String(Number(produit.prixVenteRef));
      }
      if ((field === "quantite" || field === "prixUnitaire") && updated.quantite && updated.prixUnitaire) {
        updated.montantTotal = String((parseInt(updated.quantite) || 0) * (parseFloat(updated.prixUnitaire) || 0));
      }
      return updated;
    }));
    setFieldErrors({});
  };

  const getStock = (produitId: string) => {
    const p = produits.find(pr => pr.id === produitId);
    return p?.stock?.stockActuel ?? 0;
  };

  const totalAmount = lineItems.reduce((sum, li) => sum + ((parseInt(li.quantite) || 0) * (parseFloat(li.prixUnitaire) || 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/ventes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          numeroVente: numeroVente || undefined,
          clientId: clientId || undefined,
          modePaiement: modePaiement || undefined,
          observation: observation || undefined,
          lineItems: lineItems.map(li => ({
            produitId: li.produitId,
            quantite: parseInt(li.quantite) || 0,
            prixUnitaire: parseFloat(li.prixUnitaire) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const docNum = numeroVente || `VENTE-${Date.now()}`;
        setCreatedDocNum(docNum);
      } else {
        setError(data.error || "Erreur");
        if (data.errors) setFieldErrors(data.errors);
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  if (createdDocNum) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Vente enregistrée !</h2>
          <p className="text-muted-foreground mb-6">
            Document: <strong>{createdDocNum}</strong><br />
            Montant total: <strong>{totalAmount.toFixed(2)} DH</strong>
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium"
              onClick={() => window.open(`/dashboard/ventes/facture?doc=${createdDocNum}`, "_blank")}
            >
              <Printer className="h-4 w-4" />
              Télécharger la facture PDF
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background hover:bg-muted px-3 h-9 text-sm font-medium"
              onClick={() => router.push("/dashboard/ventes")}
            >
              Retour aux ventes
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background hover:bg-muted px-3 h-9 text-sm font-medium"
              onClick={() => {
                setCreatedDocNum(null);
                setLineItems([{ key: crypto.randomUUID?.() || "1", produitId: "", quantite: "1", prixUnitaire: "", montantTotal: "" }]);
                setNumeroVente("");
                setClientId("");
                setModePaiement("");
                setObservation("");
                setDate(new Date().toISOString().slice(0, 10));
              }}
            >
              Nouvelle vente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nouvelle vente</h1>
        <p className="text-sm text-muted-foreground md:text-base">Enregistrer une sortie de stock avec plusieurs produits</p>
      </div>

      <div className="flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 px-4 pt-4">
          <h3 className="text-lg font-semibold leading-snug">Détails de la vente</h3>
        </div>
        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="date" className="flex items-center gap-2 text-base leading-none font-medium select-none">Date <span className="text-destructive">*</span></label>
                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3" />
              </div>
              <div className="space-y-2">
                <label htmlFor="clientId" className="flex items-center gap-2 text-base leading-none font-medium select-none">Client</label>
                <select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base shadow-sm">
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="numeroVente" className="flex items-center gap-2 text-base leading-none font-medium select-none">N° vente</label>
                <input id="numeroVente" placeholder="V-001" value={numeroVente} onChange={(e) => setNumeroVente(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3" />
              </div>
              <div className="space-y-2">
                <label htmlFor="modePaiement" className="flex items-center gap-2 text-base leading-none font-medium select-none">Mode de paiement</label>
                <select id="modePaiement" value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base shadow-sm">
                  <option value="">Sélectionner</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Carte">Carte</option>
                  <option value="Crédit">Crédit</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base leading-none font-medium select-none">Produits <span className="text-destructive">*</span></label>
              <div className="relative w-full overflow-x-auto rounded-md border">
                <table className="w-full caption-bottom text-base border-collapse">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="h-10 px-2 text-left font-semibold text-xs uppercase w-2/5">Produit</th>
                      <th className="h-10 px-2 text-left font-semibold text-xs uppercase w-16">Qté</th>
                      <th className="h-10 px-2 text-left font-semibold text-xs uppercase w-24">Prix unit.</th>
                      <th className="h-10 px-2 text-left font-semibold text-xs uppercase w-24">Total</th>
                      <th className="h-10 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, idx) => (
                      <tr key={li.key} className="border-b border-border/60">
                        <td className="p-1">
                          <select
                            value={li.produitId}
                            onChange={(e) => updateLine(li.key, "produitId", e.target.value)}
                            className={`flex h-8 w-full rounded border bg-transparent px-2 text-sm ${fieldErrors[`lineItems.${idx}.produitId`] ? "border-red-500" : "border-input"}`}
                          >
                            <option value="">Choisir...</option>
                            {produits.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.code} - {p.designation} (stock: {p.stock?.stockActuel ?? 0})
                              </option>
                            ))}
                          </select>
                          {li.produitId && (
                            <p className="text-xs text-muted-foreground mt-0.5">Dispo: {getStock(li.produitId)}</p>
                          )}
                        </td>
                        <td className="p-1">
                          <input type="number" min="1" value={li.quantite} onChange={(e) => updateLine(li.key, "quantite", e.target.value)} className={`h-8 w-full rounded border bg-transparent px-2 text-sm ${fieldErrors[`lineItems.${idx}.quantite`] ? "border-red-500" : "border-input"}`} />
                        </td>
                        <td className="p-1">
                          <input type="number" step="0.01" min="0" value={li.prixUnitaire} onChange={(e) => updateLine(li.key, "prixUnitaire", e.target.value)} className={`h-8 w-full rounded border bg-transparent px-2 text-sm ${fieldErrors[`lineItems.${idx}.prixUnitaire`] ? "border-red-500" : "border-input"}`} />
                        </td>
                        <td className="p-1 text-sm font-medium">
                          {((parseInt(li.quantite) || 0) * (parseFloat(li.prixUnitaire) || 0)).toFixed(2)}
                        </td>
                        <td className="p-1">
                          {lineItems.length > 1 && (
                            <button type="button" onClick={() => removeLine(li.key)} className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-red-50 text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1">
                <Plus className="h-4 w-4" /> Ajouter un produit
              </button>
            </div>

            <div className="flex justify-end">
              <div className="text-base font-bold">Total: {totalAmount.toFixed(2)} DH</div>
            </div>

            <div className="space-y-2">
              <label htmlFor="observation" className="flex items-center gap-2 text-base leading-none font-medium select-none">Observation</label>
              <input id="observation" placeholder="Optionnel" value={observation} onChange={(e) => setObservation(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3" />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => router.push("/dashboard/ventes")} className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted px-3 h-9 text-sm font-medium w-full sm:w-auto">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium w-full sm:w-auto">
                {loading ? "Enregistrement..." : "Enregistrer la vente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}