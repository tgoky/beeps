/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Optional: Define custom colors for light and dark themes
        primary: {
          light: "#6d28d9", // Your button color
          dark: "#a78bfa", // Lighter shade for dark mode
        },
        background: {
          light: "#ffffff",
          dark: "#1f2937", // Dark background
        },
        text: {
          light: "#1a1a1a",
          dark: "#e5e7eb",
        },
      },
    },
  },
  plugins: [],
};