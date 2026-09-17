"use client";

import {useState, useEffect, useCallback, ChangeEvent, useRef} from "react";
import Link from "next/link";
import {Download, FileSpreadsheet, CheckCircle, AlertCircle} from "lucide-react";
import LoadingDots from "@/components/LoadingDots";
import Pagination from "@/components/Pagination";
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

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const PAGE_LIMIT = 20;


export default function ProduitsPage() {
    const {user} = useAuth();
    const isResponsable = user?.role === "RESPONSABLE";
    const [produits, setProduits] = useState<Produit[]>([]);
    const [categorie, setCategorie] = useState<[string[] | string]>();
    const [recherche, setRecherche] = useState("");
    const [loading, setLoading] = useState(true);
    const [filtrParCtegories, setFiltrParCtegories] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; results?: { produits: number; errors: string[] } } | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

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
                    console.log('Erreur dans la récupération des catégories')
                }
            } catch (err) {
                console.error(err);
            }

            const params = new URLSearchParams();
            if (recherche) params.set("search", recherche);
            if (filtrParCtegories) params.set("categoier", filtrParCtegories);
            params.set("page", String(page));
            params.set("limit", String(PAGE_LIMIT));
            const res = await fetch(`/api/produits?${params}&categoier=${filtrParCtegories}`);
            const data = await res.json();
            if (res.ok) {
                setProduits(data.produits);
                if (data.pagination) setPagination(data.pagination);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [recherche, filtrParCtegories, page]);

    useEffect(() => {
        fetchProduits();
    }, [fetchProduits]);

    const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/import", { method: "POST", body: formData });
            const data = await res.json();
            setImportResult(data);
            if (data.success) fetchProduits();
        } catch {
            setImportResult({ success: false, message: "Erreur de connexion" });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Produits</h1>
                    <p className="text-sm text-muted-foreground md:text-base">Gestion des produits et articles</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.open("/api/export/produits/?format=xlsx")} disabled={loading}
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-7 gap-1 px-2.5 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 gap-2">
                        <Download className="h-4 w-4"/>
                        XLSX
                    </button>
                    {isResponsable && (
                        <>
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleImport}
                            />
                            <button
                                onClick={() => importInputRef.current?.click()}
                                disabled={importing}
                                className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-7 gap-1 px-2.5 text-xs font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
                            >
                                <FileSpreadsheet className="h-4 w-4"/>
                                {importing ? "Import..." : "Importer XLSX"}
                            </button>
                            <Link href="/dashboard/produits/nouveau">
                                <button
                                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-3 h-9 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 w-full sm:w-auto">Nouveau
                                    produit
                                </button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                  <input
                      placeholder="Rechercher par code ou désignation..."
                      value={recherche}
                      onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
                      className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 w-full sm:max-w-sm"
                  />

                <div className={'flex flex-col gap-4 sm:flex-row sm:items-center'}>
                    <label>filtre:</label>
                    <select name="dddd" id="ss"
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                setFiltrParCtegories(e.target.value);
                                setPage(1);
                            }

                            }
                            className={'flex h-9 w-full rounded-lg border bg-transparent px-3 py-1.5 text-base shadow-sm border-input'}

                    >
                        <option value="">Toutes les catégories</option>
                        {
                            categorie?.map(c => (
                                <option key={categorie.indexOf(c)} value={c}>{c}</option>
                            ))
                        }
                    </select>
                </div>
            </div>

            {importResult && (
                <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    {importResult.success ? (
                        <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600"/>
                    ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600"/>
                    )}
                    <div>
                        <p className="font-medium">{importResult.message}</p>
                        {importResult.results && importResult.results.errors.length > 0 && (
                            <ul className="mt-1 list-inside list-disc text-red-600 text-xs">
                                {importResult.results.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-md border">
                <div className="relative w-full overflow-x-auto">
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
                                <LoadingDots />
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
                {pagination && (
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.pages}
                        total={pagination.total}
                        limit={pagination.limit}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
}
