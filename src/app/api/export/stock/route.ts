import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get("format")?.toLowerCase() || "csv";

        const stocks = await prisma.stock.findMany({
            orderBy: { produit: { code: "asc" } },
            include: {
                produit: { select: { code: true, designation: true, unite: true, stockMin: true } },
            },
        });

        const data = stocks.map((s) => ({
            Code: s.produit.code,
            Désignation: s.produit.designation,
            Unité: s.produit.unite,
            "Stock initial": s.stockInitial,
            Achats: s.totalAchats,
            Ventes: s.totalVentes,
            "Stock actuel": s.stockActuel,
            "Seuil min": s.produit.stockMin,
            Statut: s.statutStock,
            "Valeur coût": Number(s.valeurAchat).toFixed(2),
            "Valeur vente": Number(s.valeurVente).toFixed(2),
            "Marge potentielle": Number(s.margePotentielle).toFixed(2),
        }));

        const filenameBase = `stock_${new Date().toISOString().slice(0, 10)}`;

        if (format === "xlsx") {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");
            const excelBuffer = XLSX.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
            });

            return new NextResponse(excelBuffer, {
                headers: {
                    "Content-Type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
                },
            });
        } else {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csvContent = "\ufeff" + XLSX.utils.sheet_to_csv(worksheet, { FS: ";" });

            return new NextResponse(csvContent, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
                },
            });
        }
    } catch (err) {
        console.error("Export stock error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}