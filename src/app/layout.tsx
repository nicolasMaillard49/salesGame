import type { Metadata } from "next";
import { Archivo, Chivo, Chivo_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});
const chivo = Chivo({
  variable: "--font-chivo",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sales Game — Entraînement vente & closing",
  description: "Monte en compétence sur la prospection et le closing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${archivo.variable} ${chivo.variable} ${chivoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
