/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      fontSize: {
        'xs': ['10px', { lineHeight: '14px', letterSpacing: '0.02em' }], 
        'sm': ['12px', { lineHeight: '18px' }], 
        'base': ['14px', { lineHeight: '22px' }], 
        'lg': ['16px', { lineHeight: '24px' }], 
        'xl': ['18px', { lineHeight: '26px' }], 
        '2xl': ['20px', { lineHeight: '30px' }], 
        '3xl': ['24px', { lineHeight: '32px' }], 
        '4xl': ['30px', { lineHeight: '38px' }], 
        '5xl': ['36px', { lineHeight: '42px' }],
      },
      height: { 'control': '44px', 'control-textArea': '160px', },
      zIndex: { 'glass': '10', 'sticky': '40', 'overlay': '50', 'modal': '100', 'toast': '9999', },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))", },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))", },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))", },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))", },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))", },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))", },
        palette: {
          mustard: '#8b5cf6', // Shifted to Purple as primary brand
          copper: '#f59e0b',  // Warning/Orange
          green: '#10b981',   // Success
          navy: '#0b0c15',    // Deep Dark BG
          navyLight: '#151621', // Card BG
          purple: '#a855f7',
          pink: '#ec4899',
          cyan: '#06b6d4',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: { 
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
        'slide-in': 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
        'zoom-in': 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
        'spin-slow': 'spin 8s linear infinite', 
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', 
        'shimmer': 'shimmer 2.5s infinite linear', 
        'float': 'float 6s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s infinite',
      },
      keyframes: { 
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(5px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } }, 
        slideIn: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { opacity: '1', transform: 'translateY(0)' } }, 
        zoomIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { opacity: '1', transform: 'scale(1)' } }, 
        shimmer: { '0%': { transform: 'translateX(-150%) skewX(-20deg)' }, '100%': { transform: 'translateX(200%) skewX(-20deg)' } }, 
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        bounceSoft: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } }
      }
    },
  },
  plugins: [],
}
