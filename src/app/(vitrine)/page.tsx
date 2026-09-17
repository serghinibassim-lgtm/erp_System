import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import {
  ArrowRight, BarChart3, BellRing, HandCoins, FileText, FileSpreadsheet,
  TrendingUp, CheckCircle2, ChevronDown, PackageCheck, AlertTriangle,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    color: "bg-blue-500/10 text-blue-500",
    title: "Suivi du stock en temps réel",
    desc: "Votre stock se met à jour automatiquement à chaque achat et vente. Valorisez-le en direct et suivez vos marges.",
  },
  {
    icon: BellRing,
    color: "bg-red-500/10 text-red-500",
    title: "Alertes de stock et de prix",
    desc: "Soyez prévenu dès qu'un produit atteint son seuil minimum, ou quand un prix d'achat ou de vente sort des limites.",
  },
  {
    icon: FileSpreadsheet,
    color: "bg-emerald-500/10 text-emerald-500",
    title: "Import & export Excel",
    desc: "Importez vos produits, achats et ventes depuis Excel, et exportez vos données en CSV ou XLSX en un clic.",
  },
  {
    icon: FileText,
    color: "bg-purple-500/10 text-purple-500",
    title: "Factures PDF",
    desc: "Générez des factures d'achat et de vente professionnelles, téléchargeables en PDF et imprimables.",
  },
  {
    icon: HandCoins,
    color: "bg-amber-500/10 text-amber-500",
    title: "Recouvrement & relance",
    desc: "Suivez les crédits clients, les retards de paiement et relancez directement par WhatsApp.",
  },
  {
    icon: BarChart3,
    color: "bg-orange-500/10 text-orange-500",
    title: "Tableau de bord & analytics",
    desc: "Indicateurs clés et graphiques : ventes, achats, valeur du stock et marges, le tout en temps réel.",
  },
];

const faqs = [
  {
    q: "Puis-je importer mes produits depuis un fichier Excel ?",
    a: "Oui. Vous pouvez importer vos produits, achats et ventes historiques depuis des fichiers .xlsx et .xls, avec une détection automatique des colonnes.",
  },
  {
    q: "Mon stock est-il modifié automatiquement à chaque mouvement ?",
    a: "Absolument. Chaque achat et chaque vente met à jour votre stock en temps réel, ainsi que la valorisation et les marges.",
  },
  {
    q: "Comment fonctionnent les alertes de stock ?",
    a: "Vous définissez un stock minimum par produit. Dès que le stock atteint ce seuil, une alerte est déclenchée et visible dans votre tableau de bord.",
  },
  {
    q: "Puis-je suivre les paiements de mes clients à crédit ?",
    a: "Oui, la partie recouvrement vous permet de suivre les créances, les retards de paiement et de relancer vos clients directement par WhatsApp.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Oui. L'accès est protégé par authentification, les accès sont contrôlés par rôle (responsable / employé) et vos données sont stockées de manière sécurisée.",
  },
];

export default function VitrinePage() {
  return (
    <div className="w-full">

      <section className="w-full px-4 py-24 sm:py-32 flex flex-col items-center text-center space-y-8 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto w-full max-w-4xl flex flex-col items-center space-y-8">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground w-full leading-tight">
            Gérez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">stock</span> sans stress, sans erreur avec  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">MagasinPilot</span>
          </h1>

          <p className="text-xl text-muted-foreground w-full max-w-2xl">
            Suivez vos achats, pilotez vos ventes et maîtrisez vos coûts en temps réel.
            Gagnez du temps, évitez les ruptures de stock et les pertes de marchandise.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/register" className="group inline-flex h-12 items-center justify-center rounded-full bg-primary text-primary-foreground px-8 text-base font-medium shadow-sm transition-colors hover:bg-primary/90">
              Essai gratuit
              <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="w-full max-w-5xl pt-8">
          <div className="rounded-2xl border bg-card p-2 shadow-2xl">
            <Image src="/dashbordScren.png" alt="Capture du tableau de bord MagasinPilot" width={1280} height={800} className="w-full h-auto rounded-xl object-cover" />
          </div>
        </div>
      </section>


      <Reveal className="w-full">
        <section className="w-full bg-background py-24">
          <div className="mx-auto w-full max-w-6xl px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Fini les galères de gestion manuelle</h2>
            <p className="mt-4 text-lg text-muted-foreground">Remplacez le chaos par un outil clair et fiable.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 text-left">
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8">
                <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Avec Excel
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-2"><span className="text-red-500">✗</span> Erreurs de saisie et de calcul</li>
                  <li className="flex gap-2"><span className="text-red-500">✗</span> Ruptures de stock inattendues</li>
                  <li className="flex gap-2"><span className="text-red-500">✗</span> Pertes de marchandise invisibles</li>
                  <li className="flex gap-2"><span className="text-red-500">✗</span> Prix et marges non maîtrisés</li>
                  <li className="flex gap-2"><span className="text-red-500">✗</span> Aucune alerte automatique</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50/50 p-8">
                <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Avec MagasinPilot
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-2"><span className="text-green-600">✓</span> Données fiables et automatiques</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span> Alertes avant la rupture de stock</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span> Valorisation du stock en temps réel</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span> Marges protégées par des alertes de prix</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span> Alertes automatiques en un clic</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </Reveal>


      <Reveal className="w-full">
        <section className="w-full bg-gradient-to-b from-muted/20 to-background py-24">
          <div className="mx-auto w-full max-w-6xl px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Tout ce dont vous avez besoin pour piloter votre activité</h2>
            <p className="mt-4 text-lg text-muted-foreground">Des fonctions pensées pour le terrain, simples à prendre en main.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 text-left">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={i * 100}>
                    <div className="flex flex-col items-start p-6 bg-card rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                      <div className={`h-12 w-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      </Reveal>

      {/* 4. FAQ */}
      <Reveal className="w-full">
        <section className="w-full bg-muted/20 py-24">
          <div className="mx-auto w-full max-w-3xl px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Questions fréquentes</h2>
            <p className="mt-4 text-lg text-muted-foreground">Vous hésitez encore ? Voici les réponses.</p>
            <div className="space-y-4 mt-12 text-left">
              {faqs.map((f, i) => (
                <Reveal key={f.q} delay={i * 60}>
                  <details className="group rounded-xl border bg-card p-5">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold list-none">
                      {f.q}
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* CTA final */}
      <Reveal className="w-full">
        <section className="w-full py-24  ">
          <div className="mx-auto w-full max-w-4xl px-4 text-center space-y-8">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Prêt à transformer votre magasin ?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Rejoignez des centaines de commerçants qui gèrent leurs stocks avec sérénité. C&apos;est gratuit pour démarrer.
            </p>
            <Link href="/register" className="group inline-flex h-12 items-center justify-center rounded-full bg-background text-primary px-8 text-base font-medium shadow-sm transition-colors hover:bg-background/90">
              Créer mon compte gratuit
              <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
