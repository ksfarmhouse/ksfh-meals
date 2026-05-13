import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fh: {
          green: "var(--fh-green)",
          gold: "var(--fh-gold)",
          white: "var(--fh-white)",
          "light-green": "var(--fh-light-green)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
