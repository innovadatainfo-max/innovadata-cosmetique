/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        marque: {
          DEFAULT: "#8A2846", // Bordeaux profond, couleur signature InnovaData Cosmétique
          light: "#F3E6EB",
        },
      },
    },
  },
  plugins: [],
};
