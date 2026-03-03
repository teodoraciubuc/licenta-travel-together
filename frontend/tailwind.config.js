export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "background-light": "#f8fafc",
        "background-dark": "#0f172a",
        primary: "#3b82f6",
        "primary-hover": "#2563eb",
        "surface-dark": "#1e293b",
        "surface-hover": "#334155",
        accent: "#0ea5e9",
      },
      fontFamily: { display: ["Plus Jakarta Sans", "sans-serif"] },
      boxShadow: { glow: "0 0 20px rgba(59, 130, 246, 0.3)" },
    },
  },
  plugins: [],
};