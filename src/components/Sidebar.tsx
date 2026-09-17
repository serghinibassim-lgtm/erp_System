"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Package, ShoppingCart, TrendingUp,
  ClipboardList, Building2, Users, Settings, LogOut, Menu, X, CreditCard, UserCog,
} from "lucide-react";
import { useState } from "react";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/produits", label: "Produits", icon: Package },
  { href: "/dashboard/achats", label: "Achats", icon: ShoppingCart },
  { href: "/dashboard/ventes", label: "Ventes", icon: TrendingUp },
  { href: "/dashboard/stock", label: "Stock", icon: ClipboardList },
  { href: "/dashboard/fournisseurs", label: "Fournisseurs", icon: Building2 },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/recouvrement", label: "Recouvrement", icon: CreditCard },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
  { href: "/dashboard/utilisateurs", label: "Utilisateurs", icon: UserCog },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navItems = allNavItems.filter(item =>
    item.href === "/dashboard/parametres" || item.href === "/dashboard/utilisateurs"
      ? user?.role === "RESPONSABLE"
      : true
  );

  const roleLabel = user?.role === "RESPONSABLE" ? "Responsable" : user?.role === "EMPLOYER" ? "Employé" : user?.role || "";

  const handleNav = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b px-6 py-6">
        <Image src="/erp.png" alt="MagasinPilot" width={48} height={48} className="h-12 w-12 rounded-xl object-cover shadow-md" />
        <span className="text-2xl font-extrabold tracking-tight text-foreground">MagasinPilot</span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-4 rounded-xl px-5 py-3.5 text-lg font-semibold transition-all ${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 shrink-0 transition-transform ${isActive(item.href) ? "" : "group-hover:scale-110"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-6 py-6">
          <div className="flex items-center gap-4 px-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-foreground">{user?.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            {roleLabel && (
              <span className="inline-flex mt-1 h-5 items-center rounded-full border border-transparent bg-primary/10 px-2 text-xs font-medium text-primary">
                {roleLabel}
              </span>
            )}
          </div>
        </div>
        <button onClick={handleLogout} className="mt-6 bg-red-100 inline-flex w-full items-center gap-3 rounded-xl px-5 py-3.5 text-lg font-semibold whitespace-nowrap transition-all hover:bg-destructive/10 hover:text-destructive text-muted-foreground disabled:pointer-events-none disabled:opacity-50">
          <LogOut className="h-6 w-6 shrink-0 " />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-sm md:hidden"
        aria-label="Menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 border-r bg-card shadow-xl transition-transform md:static md:z-0 md:block md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 hover:bg-muted md:hidden"
          aria-label="Fermer"
        >
          <X className="h-6 w-6" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
