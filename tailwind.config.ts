import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#020817",
        foreground: "#E5E7EB",
        muted: {
          DEFAULT: "#111827",
          foreground: "#6B7280"
        },
        card: {
          DEFAULT: "#020617",
          foreground: "#E5E7EB"
        },
        border: "#1F2933",
        accent: {
          DEFAULT: "#0EA5E9",
          foreground: "#020617"
        }
      },
      boxShadow: {
        soft: "0 18px 40px rgba(15, 23, 42, 0.65)"
      }
    }
  },
  plugins: []
};

export default config;
