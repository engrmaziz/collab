/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        base: "#0f172a",
        card: "#1e293b",
        text: "#f8fafc",
        muted: "#334155",
        accent: "#3b82f6",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
