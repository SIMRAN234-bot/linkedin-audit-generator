import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1C1714",
        bark: "#33261F",
        copper: "#C88D72",
        rosewood: "#B56B82",
        sage: "#8EB89B",
        linen: "#F7F2EE"
      },
      boxShadow: {
        glow: "0 20px 80px rgba(200, 141, 114, 0.18)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
