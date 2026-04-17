/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11212d",
        paper: "#f7f3eb",
        accent: "#c26d3a",
        accentDark: "#8f4d26",
        moss: "#667a54",
        alert: "#c84b31",
      },
      boxShadow: {
        card: "0 18px 40px rgba(17, 33, 45, 0.12)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Trebuchet MS", "sans-serif"],
      },
    },
  },
  plugins: [],
};
