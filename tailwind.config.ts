import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#135bec",
        "primary-hover": "#0f4bc4",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
      },
      fontFamily: {
        display: ["var(--font-lexend)", "sans-serif"],
        body: ["var(--font-noto)", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "inherit",
            strong: { color: "inherit" },
            em: { color: "inherit" },
            h1: { color: "inherit" },
            h2: { color: "inherit" },
            h3: { color: "inherit" },
            h4: { color: "inherit" },
            code: { color: "inherit" },
            blockquote: { color: "inherit", borderLeftColor: "#cbd5e1" },
          },
        },
      },
    },
  },
  plugins: [forms, typography],
};
export default config;
