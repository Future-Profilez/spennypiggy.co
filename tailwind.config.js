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
        'bg-[#FF007F]',
        'text-[#FF007F]',
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
                // Preserve full Tailwind palettes so utilities like bg-[#FF007F] work
                pink: colors.pink,
                yellow: colors.yellow,
                violet: colors.violet,
                // Brand aliases (single values)
                brandPink: '#FF007F',
                brandYellow: '#E6EA7B',
                mint: '#05EFB8',
                voilet: '#8C52FF',
            },
            boxShadow: {
                black: '5px 5px 0 0 rgba(0,0,0,1)',
                pink: '5px 5px 0 0 #FF007F',
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
                },
                /*
                 * A rejected sign-in. `animate-shake` was already being set by
                 * Login.jsx on a failed attempt and was defined in NO stylesheet, so
                 * the class emitted nothing and the feedback never existed.
                 */
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '20%, 60%': { transform: 'translateX(-6px)' },
                    '40%, 80%': { transform: 'translateX(6px)' },
                },
            },
            animation: {
                fading: 'fading both linear',
                float: 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                wiggle: 'wiggle 0.5s ease-in-out infinite',
                slide: 'slide 18s linear infinite',
                shake: 'shake 0.4s ease-in-out 1',
            },
            zIndex: {
                ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: i.toString() }), {}),
                'auto': 'auto',
            },
            order: {
                ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: i.toString() }), {}),
            },
            flexGrow: {
                ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: i.toString() }), {}),
            },
            flexShrink: {
                 ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: i.toString() }), {}),
             },
             opacity: {
                 ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: (i / 100).toString() }), {}),
             },
             spacing: {
                ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: `${i * 0.25}rem` }), {}),
            },
            borderRadius: {
                'none': '0',
                'sm': '0.125rem',
                DEFAULT: '0.25rem',
                'md': '0.375rem',
                'lg': '1rem',
                'xl': '3rem',
                '2xl': '3.5rem',
                '3xl': '4rem',
                '4xl': '4.5rem',
                'full': '9999px',
                /*
                 * House corner radii, shared with the admin app. Use these on new
                 * work instead of arbitrary values — mixed radii are the fastest
                 * way for a UI to look unfinished.
                 *
                 *   rounded-box     30px — containers: cards, panels, modals, sections
                 *   rounded-box-sm  20px — things inside one: buttons, inputs, chips
                 *
                 * Pills and avatars stay rounded-full.
                 */
                box: '30px',
                'box-sm': '20px',
                 ...Array.from({ length: 51 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: `${i}px` }), {}),
            },
            borderWidth: {
                 ...Array.from({ length: 21 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: `${i}px` }), {}),
             },
              fontSize: {
                  ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: `${i}px` }), {}),
              },
              lineHeight: {
                  ...Array.from({ length: 101 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: `${i}px` }), {}),
              },
              scale: {
                  ...Array.from({ length: 201 }, (_, i) => i).reduce((acc, i) => ({ ...acc, [i]: (i / 100).toString() }), {}),
              },
              rotate: {
                  ...Array.from({ length: 361 }, (_, i) => i - 180).reduce((acc, i) => ({ ...acc, [i]: `${i}deg` }), {}),
              },
          },
      },
    plugins: [forms, require('@midudev/tailwind-animations')],
};
