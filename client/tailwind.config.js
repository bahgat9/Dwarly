/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 900:"#0a1831", 800:"#11264d", 700:"#163262", 600:"#1a3d76" },
        accent: { 500:"#b2ff3a", 600:"#90e32b" }
      },
      boxShadow: { glow: "0 0 0 3px rgba(178,255,58,0.35)" },
      borderRadius: { '2xl':'1.25rem', '3xl':'1.5rem' }
    },
  },
  plugins: [],
};
