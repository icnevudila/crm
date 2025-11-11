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
  				'50': '#E6F7FF',
  				'100': '#BAE7FF',
  				'200': '#91D5FF',
  				'300': '#69C0FF',
  				'400': '#40A9FF',
  				'500': '#00AEEF',   // Accent (premium sky blue)
  				'600': '#1890FF',
  				'700': '#096DD9',
  				'800': '#0050B3',
  				'900': '#003A8C',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#E9EDF5',
  				'100': '#C9D0E3',
  				'200': '#A8B3D0',
  				'300': '#8796BE',
  				'400': '#6679AC',
  				'500': '#1B263B',   // Main background (Deep Space Blue)
  				'600': '#162033',
  				'700': '#10182A',
  				'800': '#0B1221',
  				'900': '#060B18',
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
  				gold: '#FFD700',
  				mint: '#A1FFF0',
  				gray: '#F5F7FA',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: '#22C55E',
  			warning: '#FACC15',
  			error: '#EF4444',
  			info: '#00AEEF',
  			neutral: '#1E293B',
  			glass: 'rgba(255, 255, 255, 0.05)',
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
  			'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  			glass: '0 4px 30px rgba(0, 0, 0, 0.2)'
  		},
  		backdropBlur: {
  			xs: '2px',
  			sm: '4px',
  			md: '8px'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'shimmer': 'shimmer 3s infinite',
  			'float': 'float 6s ease-in-out infinite',
  			'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
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
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-20px)'
  				}
  			},
  			pulseGlow: {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
  				},
  				'50%': {
  					boxShadow: '0 0 40px rgba(139, 92, 246, 0.8)'
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
