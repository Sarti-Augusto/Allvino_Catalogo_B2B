import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Allvino B2B",
    short_name: "Allvino B2B",
    description:
      "Catálogo digital B2B de vinhos importados da Allvino.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ab162a",
    theme_color: "#ab162a",
    lang: "pt-BR",
    categories: ["business", "shopping", "food"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
