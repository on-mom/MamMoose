/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 한글은 전부 NanumSquare 로 통일. 타이틀/날짜는 라틴 문자만 Times New Roman.
        serif: ['"Times New Roman"', 'NanumSquare', 'serif'],
        sans: ['Inter', 'NanumSquare', 'system-ui', 'sans-serif'],
      },
      colors: {
        // 맘무 마스코트 기반 팔레트
        moose: {
          // heart(버튼/포인트) · night(배경) 은 설정에서 커스터마이징 가능 → CSS 변수
          heart: 'rgb(var(--c-accent) / <alpha-value>)', // 하트 뿔 · 더스티 로즈 (accent)
          berry: '#d76b8e', // 진한 로즈 (hover/그라데이션)
          cream: '#f0e1c9', // 카라멜 크림 (하이라이트)
          cocoa: '#6b5344', // 발굽 브라운
          night: 'rgb(var(--c-bg) / <alpha-value>)', // 따뜻한 밤하늘 (배경)
          dusk: '#1d1826', // 카드 표면
          edge: '#302738', // 경계선
        },
      },
      maxWidth: { mobile: '430px' },
      boxShadow: { frame: '0 24px 60px -20px rgba(238,134,169,0.25)' },
    },
  },
  plugins: [],
};
