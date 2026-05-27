/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2c2c2c",
        paper: "#fffef9",
        mist: "#f3f1ea",
        coral: "#c45c4a",
        cyan: "#5b7c99",
        gold: "#b8954a",
        sage: "#7a9a7e",
        "moe-pink": "#ffb7c5",
        "moe-pink-soft": "#fff0f4",
        "moe-rose": "#d4738f",
        "moe-mint": "#c8ebe0",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "'PingFang SC'", "'Microsoft YaHei'", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "serif"],
      },
      boxShadow: {
        soft: "3px 3px 0 rgba(44, 44, 44, 0.12)",
        sketch: "3px 3px 0 rgba(44, 44, 44, 0.88)",
      },
    },
  },
  plugins: [],
};
