/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "./src/**/*.{html,ts}" ],
  theme: {
    extend: {
      height: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      colors: {
        'primary-blue': '#4DAAE8',
        'primary-orange': '#EE5F02',
        'secondary-blue': '#93C9F1',
        'text-gray': '#898989',
    },
    },
  },
  plugins: [],
}

