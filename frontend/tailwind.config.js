/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "modal-in": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "backdrop-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "modal-in": "modal-in 180ms ease-out both",
        "backdrop-in": "backdrop-in 180ms ease-out both",
      },
      colors: {
        background: "#111827", // Main page background
        card: "#1F2937",       // Cards and sections
        border: "#D1D5DB",     // Borders/dividers
        primary: "#3B82F6",
        primaryHover: "#2563EB", // Darker red on hover
        text: "#F9FAFB",       // Main headings/text
        muted: "#9CA3AF",      // Secondary text
      },
    },
  },
  plugins: [],
}
