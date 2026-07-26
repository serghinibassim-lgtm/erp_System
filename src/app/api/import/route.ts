import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import * as XLSX from "xlsx";

const HEADER_ALIASES: Record<string, string[]> = {
  code: ["code produit", "code"],
  designation: ["désignation", "designation", "produit", "article", "libellé", "libelle"],
  categorie: ["catégorie", "categorie", "category", "famille"],
  unite: ["unité de mesure", "unité", "unite", "unite de mesure", "u.m"],
  prixAchat: ["prix achat référence", "prix achat source", "prix achat ref", "prix achat", "pa", "prix d'achat"],
  prixVente: ["prix vente référence", "prix vente source", "prix vente ref", "prix vente", "pv", "prix de vente"],
  stock: ["stock initial", "stock", "qte initiale", "quantité initiale", "quantite initiale"],
  stockMin: ["stock minimum", "stock min", "seuil", "seuil minimum"],
};

function findColumn(header: string[], aliases: string[]): number {
  const lower = header.map(h => String(h).toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx !== -1) return idx;
  }
  for (const alias of aliases) {
    const idx = lower.findIndex(h => h.includes(alias.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function hasSheet(wb: XLSX.WorkBook, name: string): boolean {
  return wb.SheetNames.some(s => s.toLowerCase() === name.toLowerCase());
}

function parseNumber(val: unknown): number {
  if (val == null || val === "") return 0;
  const str = String(val).trim().replace(",", ".");
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function parseDate(val: unknown): Date {
  if (val == null || val === "") return new Date();
  if (typeof val === "number") {
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  }
  const d = new Date(String(val));
  if (isNaN(d.getTime())) return new Date();
  return d;
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });

    const results = { produits: 0, achats: 0, ventes: 0, errors: [] as string[] };

    // --- Import PRODUITS ---
    if (hasSheet(wb, "PRODUITS")) {
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets["PRODUITS"], { header: 1, defval: "" }) as unknown[][];
      const header = (sheet[0] || []).map(h => String(h).trim());
      const col = {
        code: findColumn(header, HEADER_ALIASES.code),
        designation: findColumn(header, HEADER_ALIASES.designation),
        categorie: findColumn(header, HEADER_ALIASES.categorie),
        unite: findColumn(header, HEADER_ALIASES.unite),
        prixAchat: findColumn(header, HEADER_ALIASES.prixAchat),
        prixVente: findColumn(header, HEADER_ALIASES.prixVente),
        stock: findColumn(header, HEADER_ALIASES.stock),
        stockMin: findColumn(header, HEADER_ALIASES.stockMin),
      };

      if (col.code === -1 || col.designation === -1) {
        return NextResponse.json({
          success: false,
          message: "Colonnes 'Code produit' et 'Désignation' introuvables dans la feuille PRODUITS",
          results,
        });
      }

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const code = String(row[col.code] || "").trim();
        const designation = String(row[col.designation] || "").trim();

        if (!code || !designation) continue;

        const categorie = col.categorie !== -1 ? String(row[col.categorie] || "").trim() : "Général";
        const unite = col.unite !== -1 ? String(row[col.unite] || "").trim() : "pièce";
        const stockInitial = col.stock !== -1 ? parseInt(String(row[col.stock] || "0")) || 0 : 0;
        const stockMin = col.stockMin !== -1 ? parseInt(String(row[col.stockMin] || "0")) || 0 : 0;
        const prixAchatRef = col.prixAchat !== -1 ? parseNumber(row[col.prixAchat]) : 0;
        const prixVenteRef = col.prixVente !== -1 ? parseNumber(row[col.prixVente]) : 0;

        try {
          const existing = await prisma.produit.findUnique({ where: { code } });
          if (existing) {
            await prisma.produit.update({
              where: { code },
              data: {
                designation,
                categorie: categorie || existing.categorie,
                unite: unite || existing.unite,
                prixAchatRef: prixAchatRef || existing.prixAchatRef,
                prixVenteRef: prixVenteRef || existing.prixVenteRef,
                stockInitial: stockInitial || existing.stockInitial,
                stockMin: stockMin || existing.stockMin,
              },
            });
          } else {
            await prisma.produit.create({
              data: {
                code,
                designation,
                categorie: categorie || "Général",
                unite: unite || "pièce",
                prixAchatRef: prixAchatRef || 0,
                prixVenteRef: prixVenteRef || 0,
                stockInitial,
                stockMin,
              },
            });
          }

          const p = await prisma.produit.findUnique({ where: { code } });
          if (p) {
            const stock = await prisma.stock.findUnique({ where: { produitId: p.id } });
            if (!stock) {
              const stockActuel = stockInitial;
              await prisma.stock.create({
                data: {
                  produitId: p.id,
                  stockInitial,
                  stockActuel,
                  statutStock: stockActuel <= stockMin ? "Alerte" : "OK",
                  valeurAchat: Number(p.prixAchatRef) * stockActuel,
                  valeurVente: Number(p.prixVenteRef) * stockActuel,
                  margePotentielle: (Number(p.prixVenteRef) - Number(p.prixAchatRef)) * stockActuel,
                },
              });
            } else {
              const stockActuel = stock.stockInitial + stock.totalAchats - stock.totalVentes + stockInitial - stock.stockInitial;
              await prisma.stock.update({
                where: { produitId: p.id },
                data: {
                  stockInitial,
                  stockActuel,
                  statutStock: stockActuel <= stockMin ? "Alerte" : "OK",
                  valeurAchat: Number(p.prixAchatRef) * stockActuel,
                  valeurVente: Number(p.prixVenteRef) * stockActuel,
                  margePotentielle: (Number(p.prixVenteRef) - Number(p.prixAchatRef)) * stockActuel,
                },
              });
            }
          }

          results.produits++;
        } catch (err) {
          results.errors.push(`Produit ${code}: ${err instanceof Error ? err.message : "Erreur"}`);
        }
      }
    }

    // --- Import ACHATS ---
    if (hasSheet(wb, "ACHATS")) {
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets["ACHATS"], { header: 1, defval: "" }) as unknown[][];
      const header = (sheet[0] || []).map(h => String(h).trim());
      const colCode = findColumn(header, HEADER_ALIASES.code);
      const colDate = header.findIndex(h => /date/i.test(h));
      const colQty = header.findIndex(h => /quantité|quantite|qté|qte|quantite/i.test(h));
      const colPrice = header.findIndex(h => /prix.*achat|prix/i.test(h));
      const colDoc = header.findIndex(h => /numéro|numero|document|facture|fact/i.test(h));
      const colFournisseur = header.findIndex(h => /fournisseur|fournisseur/i.test(h));
      const colPaiement = header.findIndex(h => /paiement|mode.*paiement/i.test(h));

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const code = String(row[colCode] || "").trim();
        const qty = parseInt(String(row[colQty] || "0"));
        const price = parseNumber(row[colPrice]);

        if (!code || qty <= 0) continue;

        try {
          const produit = await prisma.produit.findUnique({ where: { code } });
          if (!produit) continue;

          const total = qty * price;
          const documentNumber = colDoc !== -1 ? String(row[colDoc] || "").trim() : null;
          const date = colDate !== -1 ? parseDate(row[colDate]) : new Date();
          const modePaiement = colPaiement !== -1 ? String(row[colPaiement] || "").trim() : null;
          let fournisseurId: string | null = null;

          if (colFournisseur !== -1) {
            const fournisseurName = String(row[colFournisseur] || "").trim();
            if (fournisseurName) {
              const fournisseur = await prisma.fournisseur.findFirst({
                where: { nom: { contains: fournisseurName } },
              });
              if (fournisseur) fournisseurId = fournisseur.id;
            }
          }

          const ecart = price > Number(produit.prixAchatRef)
            ? price - Number(produit.prixAchatRef)
            : null;

          await prisma.achat.create({
            data: {
              date,
              numeroDocument: documentNumber,
              fournisseurId,
              produitId: produit.id,
              quantite: qty,
              prixUnitaire: price,
              montantTotal: total,
              modePaiement,
              ecart,
              alerte: ecart != null && ecart > 0,
            },
          });

          const stock = await prisma.stock.findUnique({ where: { produitId: produit.id } });
          if (stock) {
            const newTotalAchats = stock.totalAchats + qty;
            const newStockActuel = stock.stockInitial + newTotalAchats - stock.totalVentes;
            await prisma.stock.update({
              where: { produitId: produit.id },
              data: {
                totalAchats: newTotalAchats,
                stockActuel: newStockActuel,
                statutStock: newStockActuel <= produit.stockMin ? "Alerte" : "OK",
                valeurAchat: Number(produit.prixAchatRef) * newStockActuel,
                valeurVente: Number(produit.prixVenteRef) * newStockActuel,
                margePotentielle: (Number(produit.prixVenteRef) - Number(produit.prixAchatRef)) * newStockActuel,
              },
            });
          }

          results.achats++;
        } catch (err) {
          results.errors.push(`Achat ${code}: ${err instanceof Error ? err.message : "Erreur"}`);
        }
      }
    }

    // --- Import VENTES ---
    if (hasSheet(wb, "VENTES")) {
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets["VENTES"], { header: 1, defval: "" }) as unknown[][];
      const header = (sheet[0] || []).map(h => String(h).trim());
      const colCode = findColumn(header, HEADER_ALIASES.code);
      const colDate = header.findIndex(h => /date/i.test(h));
      const colQty = header.findIndex(h => /quantité|quantite|qté|qte|quantite/i.test(h));
      const colPrice = header.findIndex(h => /prix.*vente|prix/i.test(h));
      const colNumero = header.findIndex(h => /numéro|numero|vente|facture|fact/i.test(h));
      const colClient = header.findIndex(h => /client|client/i.test(h));
      const colPaiement = header.findIndex(h => /paiement|mode.*paiement/i.test(h));

      const codeIdx = colCode !== -1 ? colCode : 2;
      const qtyIdx = colQty !== -1 ? colQty : 5;
      const priceIdx = colPrice !== -1 ? colPrice : 6;

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const code = String(row[codeIdx] || "").trim();
        const qty = parseInt(String(row[qtyIdx] || "0"));
        const price = parseNumber(row[priceIdx]);

        if (!code || qty <= 0) continue;

        try {
          const produit = await prisma.produit.findUnique({ where: { code } });
          if (!produit) continue;

          const total = qty * price;
          const numeroVente = colNumero !== -1 ? String(row[colNumero] || "").trim() : `HIST-${code}-${i}`;
          const date = colDate !== -1 ? parseDate(row[colDate]) : new Date();
          const modePaiement = colPaiement !== -1 ? String(row[colPaiement] || "").trim() : null;
          let clientId: string | null = null;

          if (colClient !== -1) {
            const clientName = String(row[colClient] || "").trim();
            if (clientName) {
              const client = await prisma.client.findFirst({
                where: { nom: { contains: clientName } },
              });
              if (client) clientId = client.id;
            }
          }

          const ecart = price < Number(produit.prixVenteRef)
            ? Number(produit.prixVenteRef) - price
            : null;

          await prisma.vente.create({
            data: {
              date,
              numeroVente,
              clientId,
              produitId: produit.id,
              quantite: qty,
              prixUnitaire: price,
              montantTotal: total,
              modePaiement,
              ecart,
              alerte: ecart != null && ecart > 0,
            },
          });

          const stock = await prisma.stock.findUnique({ where: { produitId: produit.id } });
          if (stock) {
            const newTotalVentes = stock.totalVentes + qty;
            const newStockActuel = stock.stockInitial + stock.totalAchats - newTotalVentes;
            await prisma.stock.update({
              where: { produitId: produit.id },
              data: {
                totalVentes: newTotalVentes,
                stockActuel: newStockActuel,
                statutStock: newStockActuel <= produit.stockMin ? "Alerte" : "OK",
                valeurAchat: Number(produit.prixAchatRef) * newStockActuel,
                valeurVente: Number(produit.prixVenteRef) * newStockActuel,
                margePotentielle: (Number(produit.prixVenteRef) - Number(produit.prixAchatRef)) * newStockActuel,
              },
            });
          }

          results.ventes++;
        } catch (err) {
          results.errors.push(`Vente ${code}: ${err instanceof Error ? err.message : "Erreur"}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import terminé : ${results.produits} produit(s), ${results.achats} achat(s), ${results.ventes} vente(s) historique(s)`,
      results,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({
      error: "Erreur lors de l'import",
      detail: err instanceof Error ? err.message : "Erreur inconnue",
    }, { status: 500 });
  }
}