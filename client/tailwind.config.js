import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        rail: {
          blue: "#003DA5",
          blueDark: "#002D7A",
          saffron: "#F47920",
          bg: "#F4F6FA",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Poppins", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.06)",
        cardHover: "0 4px 12px -2px rgba(0,61,165,0.12), 0 2px 6px -2px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
