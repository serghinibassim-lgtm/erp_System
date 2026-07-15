import Link from "next/link";
import { ArrowRight, BarChart3, Box, ShieldCheck, Zap } from "lucide-react";

export default function VitrinePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full px-4 py-24 sm:py-32 flex flex-col items-center text-center space-y-8 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10">
          Nouveau ! La version 2.0 est disponible
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl leading-tight">
          Gérez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">magasin</span> et vos stocks avec simplicité
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          L&apos;application de gestion de stock nouvelle génération. Suivez vos achats, contrôlez vos ventes, et maximisez vos marges sans effort.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105">
            Démarrer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
            Se connecter
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Fonctionnalités puissantes</h2>
          <p className="mt-4 text-lg text-muted-foreground">Tout ce dont vous avez besoin pour gérer votre activité.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-start p-6 bg-card rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
              <Box className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Suivi des Stocks</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Gérez vos articles, surveillez le niveau de vos stocks en temps réel et recevez des alertes automatiques.</p>
          </div>
          
          <div className="flex flex-col items-start p-6 bg-card rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Achats & Ventes</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Enregistrez vos mouvements avec précision. L&apos;application calcule automatiquement les marges et tendances.</p>
          </div>
          
          <div className="flex flex-col items-start p-6 bg-card rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Alertes Intelligentes</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Système avancé d&apos;alertes sur les prix d&apos;achats trop élevés et les prix de ventes trop bas.</p>
          </div>
          
          <div className="flex flex-col items-start p-6 bg-card rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Performant</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Une interface fluide et rapide, conçue pour vous faire gagner du temps au quotidien.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Prêt à transformer votre magasin ?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">Rejoignez-nous et découvrez la manière la plus simple de gérer vos stocks et fournisseurs.</p>
          <div className="pt-4">
            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-full bg-background text-primary px-8 text-base font-bold shadow-lg transition-transform hover:scale-105">
              Créer mon compte maintenant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
