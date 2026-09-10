import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: { extend: { colors: { ink: '#111111', paper: '#f7f7f5', muted: '#777777', line: '#e6e6e2' }, fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] } } },
  plugins: [],
};
export default config;