module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0F0F1A",
        lilac: "#C084FC",
        coral: "#FF6B6B",
        mint: "#A0F0C2"
      },
      fontFamily: {
        sans: ["Satoshi", "Inter", "Manrope", "sans-serif"]
      }
    }
  },
  plugins: []
};
