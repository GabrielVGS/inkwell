import { Crimson_Pro, DM_Sans } from "next/font/google";

import type { Metadata } from "next";

import { Nav } from "@/components/nav";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inkwell",
  description: "Diario pessoal com reflexao por IA",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${crimsonPro.variable} ${dmSans.variable} font-sans antialiased`}>
        <div className="noise" />
        <Nav />
        {children}
      </body>
    </html>
  );
}
