/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sapphire: '#0F52BA',
        navy: '#000926',
        'ice-blue': '#D6E6F3',
        'powder-blue': '#A6C5D7',
        primary: '#0F52BA',
        success: '#2E7D32',
        warning: '#F57C00',
        error: '#D32F2F',
        info: '#0F52BA',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(15,82,186,0.08)',
        'card-hover': '0 8px 24px rgba(15,82,186,0.16)',
        glass: '0 4px 32px rgba(15,82,186,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        door: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        250: '250ms',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shake: 'shake 0.4s ease',
      },
    },
  },
  plugins: [],
}
