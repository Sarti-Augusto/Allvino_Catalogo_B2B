import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Catálogo B2B Allvino | Vinhos Importados",
  description: "Catálogo digital de vinhos importados Allvino. Acesse e exporte em formato PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-allvino-dark-950 text-allvino-dark-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
