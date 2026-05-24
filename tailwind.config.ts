import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        muted: "#737373",
        line: "#e7e5e4",
        paper: "#fbfaf8",
        cream: "#f5efe5",
        gold: "#b9822b",
        amberSoft: "#fff7ed",
      },
      boxShadow: {
        soft: "0 18px 55px rgba(23, 23, 23, 0.08)",
        hairline: "0 1px 0 rgba(23, 23, 23, 0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
