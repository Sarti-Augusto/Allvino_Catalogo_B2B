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
          wine: {
            50: "#fdf2f2",
            100: "#fbe8e8",
            200: "#f7d5d5",
            300: "#f1b3b3",
            400: "#e68484",
            500: "#d35858",
            600: "#b93d3d",
            700: "#9b2c2c",
            800: "#80282d", // core wine
            900: "#5c1d20", // dark wine
            950: "#3c1214", // deep dark wine
          },
          gold: {
            50: "#faf8f5",
            100: "#f4ede0",
            200: "#e6d7bc",
            300: "#d4bc91",
            400: "#c5a880", // core gold
            500: "#b48d56",
            600: "#a37a47",
            700: "#876237",
            800: "#6d4e2d",
            900: "#583e25",
            950: "#3d2a18",
          },
          dark: {
            50: "#f6f6f6",
            100: "#e7e7e8",
            200: "#cfcfd1",
            300: "#a9a9ad",
            400: "#7c7c82",
            500: "#5b5b61",
            600: "#49494e",
            700: "#3e3e42",
            800: "#222227", // panel grey
            900: "#18181c", // deep grey
            950: "#0f0f11", // pure background black-grey
          }
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
