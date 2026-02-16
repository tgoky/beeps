/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Kept your existing dark mode strategy
  theme: {
    extend: {
      // 1. Add Manrope Font for the Premium Menu
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
      },
      // 2. Add Animations (restored from your previous request)
      animation: {
        blink: "blink 1s step-start infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { borderColor: "transparent" },
          "50%": { borderColor: "#011618" }, // Tailwind blue-500
        },
      },
      // 3. Colors
      colors: {
        // --- Your Existing Custom Colors ---
        primary: {
          light: "#6d28d9",
          dark: "#a78bfa",
        },
        background: {
          light: "#ffffff",
          dark: "#000000ff",
        },
        text: {
          light: "#1a1a1a",
          dark: "#e5e7eb",
        },

        // --- New Premium Theme Extensions (Required for Menu) ---
        // These specific zinc shades allow for the "layered" dark look
        zinc: {
          850: '#1f1f22', // Used for card backgrounds in the menu
          950: '#09090b', // Used for ultra-dark modals/dropdowns
        },
        // Premium Purple accents for the Music theme (replaces the green in the example)
        brandPurple: {
          DEFAULT: '#8b5cf6', // violet-500
          glow: '#7c3aed',    // violet-600
        }
      },
    },
  },
  plugins: [],
};