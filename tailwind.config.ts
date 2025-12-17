import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx,mdx}",
    "./src/features/**/*.{ts,tsx,mdx}",
    "./src/lib/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core design tokens wired to CSS variables (HSL)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",

        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",

        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",

        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",

        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",

        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",

        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Sidebar tokens
        "sidebar-background": "hsl(var(--sidebar-background))",
        "sidebar-foreground": "hsl(var(--sidebar-foreground))",
        "sidebar-primary": "hsl(var(--sidebar-primary))",
        "sidebar-primary-foreground": "hsl(var(--sidebar-primary-foreground))",
        "sidebar-accent": "hsl(var(--sidebar-accent))",
        "sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        "sidebar-border": "hsl(var(--sidebar-border))",
        "sidebar-ring": "hsl(var(--sidebar-ring))",

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

        // Brand colors (approximate but consistent)
        "remax-red": "#e41b3d",
        "remax-blue": "#0051ba",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "luxury": "var(--shadow-luxury)",
        "elegant": "var(--shadow-elegant)",
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


