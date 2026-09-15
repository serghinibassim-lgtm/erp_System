import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const {searchParams} = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
        const recherche = (searchParams.get("search") || "").toLowerCase();
        const allCreditVentes = await prisma.vente.findMany({
            where: {
                modePaiement: {contains: "Crédit", mode: "insensitive"},
            },
            include: {
                client: {select: {id: true, code: true, nom: true, telephone: true}},
                produit: {select: {code: true, designation: true}},
            },
            orderBy: {date: "desc"},
        });

        const clientMap = new Map<string, {
            id: string;
            code: string;
            nom: string;
            telephone: string | null;
            ventes: typeof allCreditVentes;
            unpaidVentes: typeof allCreditVentes;
        }>();

        for (const v of allCreditVentes) {
            if (!v.client) continue;
            const cid = v.client.id;
            if (!clientMap.has(cid)) {
                clientMap.set(cid, {...v.client, ventes: [], unpaidVentes: []});
            }
            const entry = clientMap.get(cid)!;
            entry.ventes.push(v);
            if (!v.paye) entry.unpaidVentes.push(v);
        }

        const creditClients = Array.from(clientMap.values()).map((c) => {
            const totalCredit = c.ventes.reduce((sum, v) => sum + Number(v.montantTotal), 0);
            const unpaidTotal = c.unpaidVentes.reduce((sum, v) => sum + Number(v.montantTotal), 0);
            const deadlines = c.unpaidVentes
                .filter((v) => v.dateLimitePaiement)
                .map((v) => new Date(v.dateLimitePaiement!));
            const plusProcheEcheance = deadlines.length > 0
                ? new Date(Math.min(...deadlines.map((d) => d.getTime()))).toISOString()
                : null;
            const enRetard = deadlines.some((d) => d < new Date());
            const dernierNumeroVente = c.ventes.find((v) => v.numeroVente)?.numeroVente || null;
            const dernierDatePaiement = c.ventes
                .filter((v) => v.datePaiement)
                .map((v) => v.datePaiement!)
                .sort((a, b) => b.getTime() - a.getTime())[0] || null;
            const derniereActivite = [...c.ventes]
                .map((v) => new Date(v.date).getTime())
                .sort((a, b) => b - a)[0] || 0;

            const details = c.unpaidVentes.slice(0, 10).map((v) => ({
                numeroVente: v.numeroVente,
                dateVente: v.date.toISOString(),
                produitCode: v.produit?.code || null,
                produitDesignation: v.produit?.designation || "Produit",
                quantite: v.quantite,
                montantTotal: Number(v.montantTotal),
                dateLimitePaiement: v.dateLimitePaiement ? v.dateLimitePaiement.toISOString() : null,
            }));

            return {
                id: c.id,
                code: c.code,
                nom: c.nom,
                telephone: c.telephone,
                totalCredit,
                unpaidTotal,
                nombreVentes: c.ventes.length,
                nombreUnpaid: c.unpaidVentes.length,
                dateLimitePaiement: plusProcheEcheance,
                statut: c.unpaidVentes.length === 0 ? "Payé" : enRetard ? "En retard" : "En attente",
                numeroVente: dernierNumeroVente,
                datePaiement: dernierDatePaiement ? dernierDatePaiement.toISOString() : null,
                derniereActivite,
                details,
            };
        });

        creditClients.sort((a, b) => b.derniereActivite - a.derniereActivite);

        const unpaidClients = creditClients.filter((c) => c.statut !== "Payé");
        const totalUnpaid = unpaidClients.reduce((sum, c) => sum + c.unpaidTotal, 0);
        const totalOverdue = unpaidClients
            .filter((c) => c.statut === "En retard")
            .reduce((sum, c) => sum + c.unpaidTotal, 0);

        const filtered = recherche
            ? creditClients.filter(
                (c) =>
                    c.nom.toLowerCase().includes(recherche) ||
                    c.code.toLowerCase().includes(recherche)
            )
            : creditClients;

        const total = filtered.length;
        const pages = Math.ceil(total / limit);
        const paginated = filtered.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            success: true,
            clients: paginated,
            pagination: {page, limit, total, pages},
            stats: {
                unpaidClients: unpaidClients.length,
                unpaidInvoices: unpaidClients.reduce((s, c) => s + c.nombreUnpaid, 0),
                totalUnpaid,
                totalOverdue,
            },
        });
    } catch (err) {
        console.error("Recouvrement GET error:", err);
        return NextResponse.json({error: "Erreur serveur"}, {status: 500});
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const {clientId, numeroVente, paye = true} = body;

        if (!clientId && !numeroVente) {
            return NextResponse.json({error: "clientId ou numeroVente requis"}, {status: 400});
        }

        const where: Record<string, unknown> = {
            modePaiement: {contains: "Crédit", mode: "insensitive"},
            paye: !paye,
        };
        if (clientId) where.clientId = clientId;
        if (numeroVente) where.numeroVente = numeroVente;

        const result = await prisma.vente.updateMany({
            where,
            data: paye ? {paye: true, datePaiement: new Date()} : {paye: false, datePaiement: null},
        });

        return NextResponse.json({success: true, count: result.count});
    } catch (err) {
        console.error("Recouvrement PATCH error:", err);
        return NextResponse.json({error: "Erreur serveur"}, {status: 500});
    }
}
