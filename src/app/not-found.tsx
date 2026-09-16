import Link from "next/link";
import { PackageSearch, LayoutDashboard, Home } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-lg flex-col items-center rounded-2xl bg-card p-8 text-center text-card-foreground shadow-sm ring-1 ring-border md:p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PackageSearch className="h-8 w-8" />
        </div>

        <p className="mt-6 text-6xl font-extrabold tracking-tight text-foreground md:text-7xl">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Désolé, la page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <BackButton label="Retour en arrière" fallbackHref="/dashboard" />

          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <LayoutDashboard className="h-4 w-4" />
            Tableau de bord
          </Link>

          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-background px-3 text-sm font-medium transition-all hover:bg-muted hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
