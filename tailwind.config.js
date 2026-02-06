import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],

    safelist: [
        'text-transparent',
        'bg-clip-text',
        'bg-gradient-to-r',
        'from-yellow-300',
        'via-pink-500',
        'to-purple-500',
        'from-yellow-300',
        'via-pink-300',
        'to-purple-300',
        // Common palette utilities to ensure availability
        'bg-pink-500',
        'text-pink-500',
        'bg-yellow-400',
        'bg-purple-600',
        'text-yellow-400',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['CeraGRMedium', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Preserve full Tailwind palettes so utilities like bg-pink-500 work
                pink: colors.pink,
                yellow: colors.yellow,
                violet: colors.violet,
                // Brand aliases (single values)
                brandPink: '#F94F97',
                brandYellow: '#E6EA7B',
                mint: '#05EFB8',
                voilet: '#8C52FF',
            },
            boxShadow: {
                black: '5px 5px 0 0 rgba(0,0,0,1)',
                pink: '5px 5px 0 0 #F94F97',
                pinks: '0 10px 15px -3px rgba(236, 72, 153, 0.1), 0 4px 6px -2px rgba(236, 72, 153, 0.05)',
                mint: '5px 5px 0 0 #05EFB8',
                voilet: '5px 5px 0 0 #8C52FF',
                violet: '5px 5px 0 0 #8C52FF',
            },
            keyframes: {
                fading: {
                    'from': { opacity: '0', boxShadow: 'none', transform: 'scale(.9) translateY(8vh)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(10deg)' },
                },
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                slide: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                }
            },
            animation: {
                fading: 'fading both linear',
                float: 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                wiggle: 'wiggle 0.5s ease-in-out infinite',
                slide: 'slide 18s linear infinite',
            },
        },
    },
    plugins: [forms, require('@midudev/tailwind-animations')],
};
