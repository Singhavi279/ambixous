/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {
      config: {
        important: false,
      },
      future: {
        hoverOnlyWhenSupported: true,
      },
    },
    autoprefixer: {},
  },
};

export default config;
