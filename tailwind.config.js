import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['CeraGRMedium', ...defaultTheme.fontFamily.sans],
            },
        },
        boxShadow: {
            black: '5px 5px 0 0 rgba(0,0,0,1)',
        },
    },
    plugins: [forms],
};
