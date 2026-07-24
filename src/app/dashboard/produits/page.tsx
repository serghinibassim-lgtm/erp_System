"use client";

import {useState, useEffect, useCallback, ChangeEvent} from "react";
import Link from "next/link";
import {Download} from "lucide-react";
import {useAuth} from "@/context/AuthContext";

interface Stock {
    stockActuel: number;
    statutStock: string;
}

interface Produit {
    id: string;
    code: string;
    designation: string;
    categorie: string;
    unite: string;
    prixAchatRef: number;
    prixVenteRef: number;
    stockInitial: number;
    stockMin: number;
    stock: Stock | null;
}


export default function ProduitsPage() {
    const {user} = useAuth();
    const isResponsable = user?.role === "RESPONSABLE";
    const [produits, setProduits] = useState<Produit[]>([]);
    const [categorie, setCategorie] = useState<[string[] | string]>();
    const [recherche, setRecherche] = useState("");
    const [loading, setLoading] = useState(true);
    const [filtrParCtegories, setFiltrParCtegories] = useState("");


    let all: string;

    const fetchProduits = useCallback(async () => {
        setLoading(true);
        try {

            try {
                const allParametres = await fetch('/api/parametres');
                const parametreeData = await allParametres.json();
                if (parametreeData) {
                    const cat = parametreeData.parametres.find((p: { cle: string }) => p.cle === "categories");

                    if (cat?.valeur) {
                        let listcategorie = cat.valeur.split("\n").filter((s: string) => s.trimStart());
                        setCategorie(listcategorie);
                    }
                } else {
                    console.log(' err dna la recuperation des categorie')
                }
            } catch (err) {
                console.error(err);
            }


            const params = new URLSearchParams();
            if (recherche) params.set("search", recherche);
            if (filtrParCtegories) params.set("categoier", filtrParCtegories);
            const res = await fetch(`/api/produits?${params}&categoier=${filtrParCtegories}`);
            const data = await res.json();
            if (res.ok) setProduits(data.produits);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [recherche, filtrParCtegories]);

    useEffect(() => {
        fetchProduits();
    }, [fetchProduits]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Produits</h1>
                    <p className="text-sm text-muted-foreground md:text-base">Gestion des produits et articles</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-7 gap-1 px-2.5 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 gap-2"
                        onClick={() => window.open("/api/export/produits/?format=csv")}
                    >
                        <Download className="h-4 w-4"/>
                        CSV
                    </button>
                    <button onClick={() => window.open("/api/export/produits/?format=xlsx")} disabled={loading}
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-7 gap-1 px-2.5 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 gap-2">
                        <Download className="h-4 w-4"/>
                        XLSX
                    </button>
                    {isResponsable && (
                        <Link href="/dashboard/produits/nouveau">
                            <button
                                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto">Nouveau
                                produit
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                  <input
                      placeholder="Rechercher par code ou désignation..."
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 w-full sm:max-w-sm"
                  />

                <div className={'flex flex-col gap-4 sm:flex-row sm:items-center'}>
                    <label>filtre:</label>
                    <select name="dddd" id="ss"
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                setFiltrParCtegories(e.target.value);
                            }

                            }
                            className={'flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm border-input'}

                    >
                        <option value="">toute les  catégorie</option>
                        {
                            categorie?.map(c => (
                                <option key={categorie.indexOf(c)} value={c}>{c}</option>
                            ))
                        }
                    </select>
                </div>
            </div>


            <div className="relative w-full overflow-x-auto rounded-md border">
                <table className="w-full caption-bottom text-base border-collapse">
                    <thead className="[&_tr]:border-b">
                    <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Code</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Désignation</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Catégorie</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Prix
                            achat
                        </th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Prix
                            vente
                        </th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Stock</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Statut</th>
                        <th className="h-11 px-3 text-left align-middle font-semibold whitespace-nowrap text-foreground bg-muted/30 text-xs uppercase">Action</th>
                    </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                    {loading ? (
                        <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                            <td colSpan={7}
                                className="p-3 align-middle whitespace-nowrap text-sm text-center py-8 text-muted-foreground">
                                Chargement...
                            </td>
                        </tr>
                    ) : produits.length === 0 ? (
                        <tr className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40">
                            <td colSpan={7}
                                className="p-3 align-middle whitespace-nowrap text-sm text-center py-8 text-muted-foreground">
                                Aucun produit trouvé
                            </td>
                        </tr>
                    ) : (
                        produits.map((produit) => (
                            <tr key={produit.id}
                                className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40 ">
                                <td className="p-3 align-middle whitespace-nowrap text-sm font-medium whitespace-nowrap">{produit.code}</td>
                                <td className="p-3 align-middle whitespace-nowrap text-sm whitespace-nowrap">{produit.designation}</td>
                                <td className="p-3 align-middle whitespace-nowrap text-sm">{produit.categorie}</td>
                                <td className="p-3 align-middle whitespace-nowrap text-sm whitespace-nowrap">{Number(produit.prixAchatRef).toFixed(2)}</td>
                                <td className="p-3 align-middle whitespace-nowrap text-sm whitespace-nowrap">{Number(produit.prixVenteRef).toFixed(2)}</td>
                                <td className="p-3 align-middle whitespace-nowrap text-sm">{produit.stock?.stockActuel ?? "-"}</td>
                                <td className="p-3 align-middle whitespace-nowrap text-sm">
                    <span
                        className={`inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${produit.stock?.statutStock === "Alerte" ? "bg-red-300 text-secondary-foreground" : "bg-green-200 text-secondary-foreground"}`}>
                      {produit.stock?.statutStock === "Alerte" ? "Vérifier stock" : "OK"}
                    </span>
                                </td>
                                <td>
                                    <button onClick={() => window.location.href = `/dashboard/produits/${produit.id}`}
                                            className="inline-flex h-6 w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap bg-amber-100 hover:bg-amber-200 cursor-pointer">
                                        plus
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
