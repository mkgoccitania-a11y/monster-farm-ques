import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // Tailwind named text sizes bumped +1px each pour une lisibilité enfant
      fontSize: {
        xs:    ["13px", { lineHeight: "1.4" }],   // 12 → 13
        sm:    ["15px", { lineHeight: "1.45" }],  // 14 → 15
        base:  ["17px", { lineHeight: "1.55" }],  // 16 → 17
        lg:    ["19px", { lineHeight: "1.5" }],   // 18 → 19
        xl:    ["21px", { lineHeight: "1.45" }],  // 20 → 21
        "2xl": ["25px", { lineHeight: "1.35" }],  // 24 → 25
        "3xl": ["31px", { lineHeight: "1.3" }],   // 30 → 31
        "4xl": ["37px", { lineHeight: "1.25" }]   // 36 → 37
      },
      colors: {
        // Palette moderne arcade
        skyJoy: "#71D4FF",
        grassPop: "#87E04A",
        peachSpark: "#FFB86C",
        berryHit: "#FF6F91",
        lemonBoost: "#FFD447",
        ink: "#0F172A",
        // Nouvelles teintes neon / pokemon
        violetGlow: "#A78BFA",
        indigoDeep: "#4F46E5",
        cyanSpark: "#22D3EE",
        firePop: "#F97316",
        waterPop: "#38BDF8",
        plantPop: "#22C55E",
        electricPop: "#FACC15",
        nightSky: "#0B1226",
        cardGlass: "rgba(255,255,255,0.12)"
      },
      boxShadow: {
        bubble: "0 10px 30px rgba(32, 50, 74, 0.18)",
        glow: "0 0 24px rgba(167, 139, 250, 0.55), 0 0 60px rgba(34, 211, 238, 0.25)",
        glowFire: "0 0 18px rgba(249, 115, 22, 0.6)",
        glowWater: "0 0 18px rgba(56, 189, 248, 0.6)",
        glowPlant: "0 0 18px rgba(34, 197, 94, 0.6)",
        glowElectric: "0 0 18px rgba(250, 204, 21, 0.7)",
        cardLift: "0 12px 32px -8px rgba(15, 23, 42, 0.45)"
      },
      backgroundImage: {
        "hero-night": "radial-gradient(ellipse at top, #1e1b4b 0%, #0B1226 70%)",
        "hero-day": "radial-gradient(ellipse at top, #5eead4 0%, #38bdf8 70%)",
        "card-glass": "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))"
      },
      animation: {
        "float-slow": "float 5s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "shimmer": "shimmer 2.6s linear infinite",
        "shake": "shake 0.4s ease-in-out"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
