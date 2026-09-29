/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fff8f0",
        surface: "#faf8f0",
        "surface-dim": "#f4ede2",
        "surface-card": "#ffffff",
        "surface-muted": "#efe8dc",
        "outline-dim": "#e4ddd2",
        "outline-mid": "#cfc7bc",
        "on-surface": "#1e1b15",
        "on-surface-variant": "#5a544c",
        outline: "#8a8378",
        "accent-ochre": "#b45309",
        "accent-ochre-bg": "#fef3c7",
        "accent-ochre-border": "#fcd34d",
        "accent-rose": "#be123c",
        "accent-rose-bg": "#ffe4e6",
        "accent-rose-border": "#fecdd3",
        "accent-green": "#065f46",
      },
      fontFamily: {
        editorial: ["Newsreader", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
