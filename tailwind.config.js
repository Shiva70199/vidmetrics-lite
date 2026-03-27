/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f5f1eb",
        foreground: "#111111",
        accent: {
          DEFAULT: "#ff4b1f",
          foreground: "#ffffff"
        },
        frame: "#111111",
        subtle: "#f9f4ee"
      },
      boxShadow: {
        soft: "0 18px 40px rgba(15, 15, 15, 0.18)"
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "SF Pro Text", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

