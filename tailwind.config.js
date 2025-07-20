module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}",
  "./public/index.html"],
  theme: {
    extend: {
      spacing: {
        128: "32rem",
      },
      colors: {
        google: {
          blue: "#1a0dab",
          link: "#202124",
          text: "#4d5156",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp"), require("tailwind-scrollbar")],
};
