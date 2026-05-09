/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101826",
        mist: "#eaf1f7",
        coral: "#f26b5b",
        cyan: "#4ab8d6",
        gold: "#f1bc54",
        sage: "#9fc79a",
      },
      fontFamily: {
        sans: ["'Noto Sans SC'", "'PingFang SC'", "'Microsoft YaHei'", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 24, 38, 0.14)",
      },
    },
  },
  plugins: [],
};
