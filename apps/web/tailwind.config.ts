import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        local: 'rgb(var(--local) / <alpha-value>)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #1B47A1 0%, #6C63FF 100%)',
        'brand-radial': 'radial-gradient(100% 100% at 0% 0%, #1B47A1 0%, #6C63FF 50%, #FFB100 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.16)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
}
export default config
