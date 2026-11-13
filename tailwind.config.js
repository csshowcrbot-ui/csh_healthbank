/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        washi: '#FAF8F5',       // 和紙白 - 主背景色
        wakatake: {
          DEFAULT: '#4A7C59',   // 若竹色 - 主品牌色
          light: '#619B73',
          dark: '#3A6347',
          50: '#F2F7F4',
          100: '#E2ECE5',
          200: '#C7DBCF',
        },
        sumikuro: '#2B2D2F',    // 深木炭 - 主文字色
        chausu: '#8C8D8A',      // 茶臼白 - 次要文字/輔助標籤
        shiraki: {
          DEFAULT: '#F0EBE1',   // 素木色 - 卡片底色/次級按鈕
          light: '#F8F5EE',
          dark: '#E2DCCF',
        },
        kohaku: {
          DEFAULT: '#D49B48',   // 琥珀金 - 點數與成就
          light: '#E5B56D',
          dark: '#B57E2F',
        },
        nadeshiko: {
          DEFAULT: '#C85A54',   // 撫子緋 - 愛心公益
          light: '#D97A75',
          dark: '#A6413C',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'source-han-serif-tc', 'Georgia', 'serif'],
        sans: ['"Noto Sans TC"', 'system-ui', '-apple-system', 'sans-serif'],
        number: ['"EB Garamond"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'zen': '0 4px 20px rgba(0, 0, 0, 0.03)',
        'zen-hover': '0 8px 30px rgba(0, 0, 0, 0.06)',
        'zen-card': '0 2px 12px rgba(74, 124, 89, 0.06)',
      },
      borderRadius: {
        'zen': '16px',
        'pill': '24px',
      }
    },
  },
  plugins: [],
}

