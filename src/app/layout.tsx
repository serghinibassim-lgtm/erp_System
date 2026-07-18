import type {Metadata} from "next";
import "./globals.css";
import {AuthProvider} from "@/context/AuthContext";


export const metadata: Metadata = {
  title: "ARP Gestion Magasin",
  description: "Application de gestion de stock et de magasin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`h-full antialiased`}
    >
      <body className="min-h-full text-base font-sans selection:bg-primary/20">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
