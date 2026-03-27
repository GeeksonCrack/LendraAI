/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--background)',
          foreground: 'var(--foreground)',
          accent: 'var(--primary)', // Maps the UI's brand color highlights to the new twitter-esque --primary
        },
        secondary: {
          DEFAULT: 'var(--card)', // Maps our old dark slate backgrounds to the new --card
          foreground: 'var(--card-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        warning: 'var(--chart-3)',
        danger: 'var(--destructive)',
        text: {
          primary: 'var(--foreground)',
          secondary: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        ring: 'var(--ring)',
        muted: 'var(--muted)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
