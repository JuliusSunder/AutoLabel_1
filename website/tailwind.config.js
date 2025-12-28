/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1f2937",
          light: "#374151",
          lighter: "#6b7280",
        },
        accent: {
          DEFAULT: "#10b981", // emerald-500
          light: "#34d399", // emerald-400
          lighter: "#d1fae5", // emerald-100
          dark: "#059669", // emerald-600
        },
        vinted: {
          DEFAULT: "#10b981",
          light: "#34d399",
          lighter: "#d1fae5",
        },
      },
      maxWidth: {
        "7xl": "1200px",
      },
    },
  },
  plugins: [],
};

