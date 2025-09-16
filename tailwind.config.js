/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "./src/**/*.{html,ts}" ],
  theme: {
    extend: {
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

