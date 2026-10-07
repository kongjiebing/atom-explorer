/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070b14",
        surface: "#0f1622",
        surface2: "#161f2e",
        ink: "#e8eef7",
        muted: "#8a9bb3",
        line: "#1e2939",
        accent: "#22d3ee",
        accent2: "#fbbf24",
        danger: "#f87171",
        ok: "#34d399",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 30px rgba(34, 211, 238, 0.25)",
        "glow-amber": "0 0 30px rgba(251, 191, 36, 0.25)",
        "glow-danger": "0 0 30px rgba(248, 113, 113, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "spin-rev": "spin 12s linear infinite reverse",
        float: "float 6s ease-in-out infinite",
        gradient: "gradient 4s ease infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
