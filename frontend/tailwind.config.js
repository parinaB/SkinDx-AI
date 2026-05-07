/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 4px 24px rgba(45,90,61,0.08)",
      },
      colors: {
        sage: "var(--sage)",
        forest: "var(--forest)",
        mint: "var(--mint)",
        "mint-dark": "var(--mint-dark)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        white: "var(--white)",
      },
      fontFamily: {
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui"],
        fraunces: ['"Fraunces"', "serif"],
      },
    },
  },
  plugins: [],
};

