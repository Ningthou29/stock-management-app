/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          pitch: "#0A251C",       // Darkest rich forest/pitch green
          forest: "#113B2C",      // Deep green for headers/cards
          grass: "#1A5C45",       // Accent brand green
          cream: "#F4F7F5",       // Off-white light background
          gold: "#C5A85A",        // Rich elegant gold
          goldlight: "#DFD1AC",   // Muted gold accents
          accent: "#D4AF37",      // Bright gold
          dark: "#121614",        // Charcoal black
          card: "#FFFFFF",
          muted: "#64748B",
          border: "#E2E8F0"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 4px 20px -2px rgba(11, 45, 32, 0.08), 0 2px 8px -1px rgba(11, 45, 32, 0.04)",
        glass: "0 8px 32px 0 rgba(11, 45, 32, 0.06)",
      }
    },
  },
  plugins: [],
}
