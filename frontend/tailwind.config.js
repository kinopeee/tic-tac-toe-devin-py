/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
        'winner-glow': {
          '0%, 100%': { 
            transform: 'scale(1) rotate(0deg)',
            boxShadow: '0 0 0 rgba(255, 215, 0, 0)',
            filter: 'brightness(1)'
          },
          '50%': { 
            transform: 'scale(1.3) rotate(5deg)',
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.9)',
            filter: 'brightness(1.2)'
          }
        },
        'loser-shake': {
          '0%': { transform: 'translateX(0) scale(1)', filter: 'grayscale(0)' },
          '25%': { transform: 'translateX(-4px) scale(0.97)', filter: 'grayscale(0.5)' },
          '50%': { transform: 'translateX(0) scale(0.95)', filter: 'grayscale(0.8)' },
          '75%': { transform: 'translateX(4px) scale(0.97)', filter: 'grayscale(0.5)' },
          '100%': { transform: 'translateX(0) scale(1)', filter: 'grayscale(0)' }
        },
        'celebration-bounce': {
          '0%, 100%': { 
            transform: 'translateY(0) scale(1) rotate(0deg)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
          },
          '25%': {
            transform: 'translateY(-45%) scale(1.2) rotate(-5deg)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
          },
          '75%': {
            transform: 'translateY(-45%) scale(1.2) rotate(5deg)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
          }
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' }
        },
        'pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.95)' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'winner-glow': 'winner-glow 2s ease-in-out infinite',
        'loser-shake': 'loser-shake 0.8s ease-in-out',
        'celebration-bounce': 'celebration-bounce 1s infinite',
        'text-shimmer': 'text-shimmer 2s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 1s cubic-bezier(0.4, 0, 0.2, 1)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

