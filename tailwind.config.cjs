/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'cream': '#FFFBF0',
        'silver': '#BCBABE',
        'light-blue': '#ACF0F4',
        'primary': '#56CCF2',
        'medium-blue': '#5B9BD5',
        'dark-blue': '#2C3E50',
        'lime': '#C7EA46',
        'pale-yellow': '#FFFE8D',
        'terracotta': '#AB5729',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'dynapuff': ['DynaPuff', 'cursive']
      }
    },
  },
  plugins: [],
}