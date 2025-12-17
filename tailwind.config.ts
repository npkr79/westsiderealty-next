import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core design tokens wired to CSS variables (HSL)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Luxury theme custom colors (HSL variables already defined in globals.css)
        "luxury-gold": "hsl(var(--luxury-gold))",
        "luxury-gold-light": "hsl(var(--luxury-gold-light))",
        "luxury-gold-dark": "hsl(var(--luxury-gold-dark))",
        "luxury-navy": "hsl(var(--luxury-navy))",
        "luxury-navy-light": "hsl(var(--luxury-navy-light))",
        "luxury-slate": "hsl(var(--luxury-slate))",
        "luxury-cream": "hsl(var(--luxury-cream))",
        "luxury-charcoal": "hsl(var(--luxury-charcoal))",
        // Heading blue
        "heading-blue": "hsl(var(--heading-blue))",
        "heading-blue-dark": "hsl(var(--heading-blue-dark))",
        // Brand colors (Lovable SPA exact hex)
        "remax-blue": "#003da5",
        "remax-red": "#e31837",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        luxury: "var(--shadow-luxury)",
        elegant: "var(--shadow-elegant)",
      },
      backgroundImage: {
        "gradient-luxury": "var(--gradient-luxury)",
        "gradient-elegant": "var(--gradient-elegant)",
        "gradient-subtle": "var(--gradient-subtle)",
        "gradient-royal": "var(--gradient-royal)",
      },
    },
  },
  plugins: [],
};

export default config;


