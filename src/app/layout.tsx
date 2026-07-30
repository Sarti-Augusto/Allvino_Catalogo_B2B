import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  applicationName: "Allvino B2B",
  title: "Catálogo B2B Allvino | Vinhos Importados",
  description:
    "Catálogo digital de vinhos importados Allvino. Acesse e exporte em formato PDF.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Allvino B2B",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ab162a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-allvino-background text-allvino-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
