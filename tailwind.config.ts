import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amber: { DEFAULT: "#FFB400", dark: "#FF6B00" },
        indigo: { DEFAULT: "#4B5FD5" },
        surface: { DEFAULT: "#141414", elevated: "#1E1E1E", border: "#2A2A2A" },
      },
    },
  },
  plugins: [],
};

export default config;
