import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get("format")?.toLowerCase() || "csv";


        const produits = await prisma.produit.findMany({
            orderBy: { code: "asc" },
            include: { stock: true },
        });

        const data = produits.map((p) => ({
            Code: p.code,
            Désignation: p.designation,
            Catégorie: p.categorie,
            Unité: p.unite,
            "Prix achat réf": Number(p.prixAchatRef).toFixed(2),
            "Prix vente réf": Number(p.prixVenteRef).toFixed(2),
            "Stock initial": p.stockInitial,
            "Stock minimum": p.stockMin,
            "Stock actuel": p.stock?.stockActuel ?? 0,
            Statut: p.stock?.statutStock ?? "N/A",
        }));

        const filenameBase = `produits_${new Date().toISOString().slice(0, 10)}`;

        if (format === "xlsx") {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Produits");
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
        } else if (format === "csv") {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csvContent = "\ufeff" + XLSX.utils.sheet_to_csv(worksheet, { FS: ";" });

            return new NextResponse(csvContent, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
                },
            });
        }

        return NextResponse.json(
            { error: "Format non supporté. Utilisez 'csv' ou 'xlsx'." },
            { status: 400 }
        );
    } catch (err) {
        console.error("Export produits error:", err);
        return NextResponse.json(
            { error: "Erreur serveur lors de l'exportation" },
            { status: 500 }
        );
    }
}