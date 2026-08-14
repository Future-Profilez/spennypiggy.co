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
            /*
             * 🚨 NO boxShadow SCALE, DELIBERATELY (client direction, 14 Aug 2026).
             * Every frame on this site is a LINE — `border-[3px] border-black` for a
             * container, `border-2` for a control — and depth is carried by border
             * weight, border colour and space. ~850 elements and 65 CSS declarations
             * were de-shadowed in one pass; a token defined here is how one screen at
             * a time puts them back. Buttons press with brightness plus a 2px shift.
             */
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
                /*
                 * The countdown bar under a toast. Deliberately has NO duration
                 * of its own — `BrandToast` sets `animationDuration` inline from
                 * the toast's real `duration`, so the bar empties exactly as the
                 * toast dismisses. A duration baked in here would be a bar that
                 * lies about how long the message is staying.
                 */
                toastProgress: {
                    from: { transform: 'scaleX(1)' },
                    to: { transform: 'scaleX(0)' },
                },
            },
            animation: {
                fading: 'fading both linear',
                float: 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                wiggle: 'wiggle 0.5s ease-in-out infinite',
                slide: 'slide 18s linear infinite',
                shake: 'shake 0.4s ease-in-out 1',
                'toast-progress': 'toastProgress linear forwards',
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
                 * House corner radii. Use these on new work instead of arbitrary
                 * values — mixed radii are the fastest way for a UI to look
                 * unfinished.
                 *
                 *              mobile   md+ (≥768px)   use on
                 *   box          24px       30px       containers: cards, panels, modals, sections
                 *   box-sm       16px       20px       inside one: buttons, inputs, chips, tiles
                 *   box-xs       10px       12px       genuinely small: badges, counters, 24–32px tiles
                 *
                 * ⚠️ THE VALUES LIVE IN `resources/css/theme.css`, not here. A radius
                 * is read against the size of the element it is on, so one fixed
                 * number cannot be right on a 358px phone card and a 1440px desktop
                 * one — 30px is a third of the width of the first and a quiet curve
                 * on the second. The custom properties scale at Tailwind's own `md`
                 * breakpoint, so every existing `rounded-box` in the app follows with
                 * no per-file change.
                 *
                 * Pills and avatars stay rounded-full.
                 */
                box: 'var(--sp-radius-box)',
                'box-sm': 'var(--sp-radius-box-sm)',
                'box-xs': 'var(--sp-radius-box-xs)',
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
