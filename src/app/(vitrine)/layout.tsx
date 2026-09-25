import Link from "next/link";
import Image from "next/image";

const socials = [
  {
    label: "Instagram — CAD Digital Agency",
    href: "https://www.instagram.com/caddigitalagency/",
    src: "/instagram.svg",
  },
  {
    label: "GitHub — CAD Digital Agency",
    href: "https://github.com/cad-code",
    src: "/github-light.svg",
  },
  {
    label: "LinkedIn — CAD Digital Agency",
    href: "https://www.linkedin.com/company/cad-digital-agency/posts/?feedView=all",
    src: "/linkedin.svg",
  },
  {
    label: "Email — caddigitalagency@gmail.com",
    href: "mailto:caddigitalagency@gmail.com",
    src: "/gmail-2026.svg",
  },
];

export default function VitrineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image src="/erp.png" alt="MagasinPilot" width={40} height={40} className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            <span className="text-xl font-bold tracking-tight">MagasinPilot</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full">{children}</main>

      <footer className="w-full border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Image src="/cad.png" alt="CAD" width={80} height={80} className="h-20 w-20 rounded-2xl object-contain shadow-md" />
            <span className="text-2xl font-extrabold tracking-tight">CAD</span>
          </div>

          <p className="max-w-xl text-sm text-muted-foreground">
            La solution complète de gestion de stock, d&apos;achats et de ventes pour
            piloter votre magasin avec simplicité et sérénité.
          </p>



          <div className="flex items-center justify-center gap-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted"
              >
                <Image src={s.src} alt={s.label} width={20} height={20} className="h-5 w-5" />
              </a>
            ))}
          </div>

          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <a
              href="mailto:caddigitalagency@gmail.com"
              className="font-medium text-foreground hover:underline"
            >
              caddigitalagency@gmail.com
            </a>
            <p>© {new Date().getFullYear()} CAD Digital Agency — Tous droits réservés.</p>
          </div>


        </div>
      </footer>
    </div>
  );
}
