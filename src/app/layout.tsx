import type {Metadata} from "next";
import "./globals.css";
import {AuthProvider} from "@/context/AuthContext";
import { Inter } from "next/font/google";


export const metadata: Metadata = {
  title: "MagasinPilot",
  description: "MagasinPilot - Application de gestion de stock et de magasin",
  icons:{
    icon:"/erp.png",
    shortcut:"/erp.png"

  }
};
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`h-full antialiased ${inter.variable}`}
    >
      <body className="min-h-full text-base font-sans selection:bg-primary/20 ">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
