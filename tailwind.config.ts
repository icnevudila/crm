import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#eef2ff',
  				'100': '#e0e7ff',
  				'200': '#c7d2fe',
  				'300': '#a5b4fc',
  				'400': '#818cf8',
  				'500': '#6366f1',
  				'600': '#4f46e5',
  				'700': '#4338ca',
  				'800': '#3730a3',
  				'900': '#312e81',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#faf5ff',
  				'100': '#f3e8ff',
  				'200': '#e9d5ff',
  				'300': '#d8b4fe',
  				'400': '#c084fc',
  				'500': '#8b5cf6',
  				'600': '#7c3aed',
  				'700': '#6d28d9',
  				'800': '#5b21b6',
  				'900': '#4c1d95',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': '#fdf2f8',
  				'100': '#fce7f3',
  				'200': '#fbcfe8',
  				'300': '#f9a8d4',
  				'400': '#f472b6',
  				'500': '#ec4899',
  				'600': '#db2777',
  				'700': '#be185d',
  				'800': '#9f1239',
  				'900': '#831843',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: '#10b981',
  			warning: '#f59e0b',
  			error: '#ef4444',
  			info: '#3b82f6',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			surface: '#f8fafc',
			'text-primary': '#0f172a',
			'text-secondary': '#64748b',
			'text-muted': '#94a3b8',
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			}
		},
		backgroundImage: {
			'gradient-primary': 'linear-gradient(to right, #6366f1, #8b5cf6)',
			'gradient-secondary': 'linear-gradient(to right, #8b5cf6, #ec4899)',
			'gradient-to-r-primary': 'linear-gradient(to right, #6366f1, #8b5cf6)',
			'gradient-to-r-secondary': 'linear-gradient(to right, #8b5cf6, #ec4899)'
		},
  		boxShadow: {
  			card: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  			'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

export default config

