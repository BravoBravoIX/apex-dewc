/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Organization branding colors (will be overridden by CSS variables)
        'brand': {
          'primary': 'var(--brand-primary)',
          'secondary': 'var(--brand-secondary)',
          'accent': 'var(--brand-accent)',
          'light': 'var(--brand-light)',
          'dark': 'var(--brand-dark)'
        },
        // Status colors for exercise monitoring
        'status': {
          'active': '#10b981',
          'paused': '#f59e0b',
          'stopped': '#ef4444',
          'pending': '#6b7280',
          'completed': '#3b82f6'
        },
        // Severity colors for alerts and notifications
        'severity': {
          'info': '#3b82f6',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444',
          'critical': '#dc2626'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px var(--brand-primary, #3b82f6)',
            opacity: '1'
          },
          '50%': { 
            boxShadow: '0 0 20px var(--brand-primary, #3b82f6)',
            opacity: '0.8'
          },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxHeight: {
        'screen-80': '80vh',
        'screen-60': '60vh',
      },
      scale: {
        '102': '1.02'
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem'
      }
    },
  },
  plugins: [
    // Custom plugin for professional dashboard theming
    function({ addUtilities, addComponents }) {
      addUtilities({
        '.brand-gradient': {
          background: `linear-gradient(135deg, var(--brand-primary, #3b82f6), var(--brand-secondary, #1e40af))`,
        },
        '.brand-shadow': {
          boxShadow: `0 4px 6px -1px rgba(var(--brand-primary-rgb, 59, 130, 246), 0.1)`,
        },
        '.glass-effect': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.text-shadow': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        }
      })
      
      addComponents({
        '.btn': {
          '@apply px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900': {},
        },
        '.btn-primary': {
          '@apply btn text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5': {},
          'background': 'var(--brand-primary)',
          '&:hover': {
            'background': 'var(--brand-secondary)',
          }
        },
        '.btn-secondary': {
          '@apply btn bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600': {},
        },
        '.btn-success': {
          '@apply btn bg-green-600 text-white hover:bg-green-700': {},
        },
        '.btn-warning': {
          '@apply btn bg-yellow-600 text-white hover:bg-yellow-700': {},
        },
        '.btn-danger': {
          '@apply btn bg-red-600 text-white hover:bg-red-700': {},
        },
        '.card': {
          '@apply bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm': {},
        },
        '.card-hover': {
          '@apply card hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer': {},
        },
        '.input': {
          '@apply w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary': {},
        },
        '.badge': {
          '@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium': {},
        },
        '.badge-primary': {
          '@apply badge text-white': {},
          'background': 'var(--brand-primary)',
        },
        '.badge-success': {
          '@apply badge bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': {},
        },
        '.badge-warning': {
          '@apply badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': {},
        },
        '.badge-danger': {
          '@apply badge bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': {},
        }
      })
    }
  ],
}