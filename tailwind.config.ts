import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        allvino: {
          background: "#fcf9f8",
          text: "#1c1b1b",
          primary: "#390009", // Vinho Bordeaux escuro
          "primary-container": "#58111a", // Vinho Bordeaux médio
          "on-primary-container": "#db767b",
          secondary: "#735c00", // Dourado antigo
          "secondary-container": "#fed65b",
          "on-secondary-container": "#745c00",
          outline: "#877272",
          "outline-variant": "#dac0c0",
          
          // Níveis de superfície para Tonal Layering
          surface: "#fcf9f8",
          "surface-dim": "#dcd9d9",
          "surface-container-lowest": "#ffffff",
          "surface-container-low": "#f6f3f2",
          "surface-container": "#f0eded",
          "surface-container-high": "#eae7e7",
          "surface-container-highest": "#e5e2e1",
          "on-surface": "#1c1b1b",
          "on-surface-variant": "#554242",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
