import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [laravel({
        input: 'resources/js/app.jsx',
        // ssr: 'resources/js/ssr.js',
        refresh: true,
    }), react(), sentryVitePlugin({
        org: "spenny-piggy",
        project: "javascript-react"
    })],

    server: {
    cors: {
      origin: '*',
      // origin: 'https://3147-122-180-247-198.ngrok-free.app',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    } 
  },

    build: {
        sourcemap: true
    }
});