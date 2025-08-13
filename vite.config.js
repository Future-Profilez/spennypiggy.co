import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { criticalCss } from './vite-plugins/critical-css.js';
import { visualizer } from 'rollup-plugin-visualizer';
import { GenerateSW } from 'workbox-webpack-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            // ssr: 'resources/js/ssr.js',
            refresh: true,
        }), 
        react(), 
        // criticalCss({
        //     inlineThreshold: 1024, // Inline styles smaller than 1KB
        //     minimumExternalSize: 1024,
        //     pruneSource: false, // Keep original CSS files
        //     preload: 'media',
        //     noscriptFallback: true,
        //     compress: true
        // }),
        sentryVitePlugin({
            org: "spenny-piggy",
            project: "javascript-react"
        }),
        // Bundle analyzer - only in production
        process.env.ANALYZE && visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        })
    ],

    server: {
        // Enable HTTP/2 for development
        https: false, // Set to true for HTTPS/HTTP2 in dev
        http2: true, // Enable HTTP/2
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
        headers: {
            // Security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
        },
    },

    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                // Manual chunk splitting strategy
                manualChunks(id) {
                    // Vendor libraries
                    if (id.includes('node_modules')) {
                        // Large libraries get their own chunks
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor';
                        }
                        if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('redux')) {
                            return 'redux-vendor';
                        }
                        if (id.includes('@apollo/client') || id.includes('graphql')) {
                            return 'apollo-vendor';
                        }
                        if (id.includes('bootstrap') || id.includes('react-bootstrap')) {
                            return 'bootstrap-vendor';
                        }
                        if (id.includes('@sentry')) {
                            return 'sentry-vendor';
                        }
                        if (id.includes('chart.js') || id.includes('recharts')) {
                            return 'charts-vendor';
                        }
                        if (id.includes('@stripe') || id.includes('stripe')) {
                            return 'stripe-vendor';
                        }
                        // Group smaller vendors together
                        return 'vendor';
                    }
                    
                    // Framework and app code
                    if (id.includes('@inertiajs')) {
                        return 'inertia-framework';
                    }
                    
                    // Redux store gets its own chunk
                    if (id.includes('redux/Store')) {
                        return 'app-store';
                    }
                },
                // Optimize chunk file names
                chunkFileNames: (chunkInfo) => {
                    const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '') : 'chunk';
                    return `js/[name]-[hash].js`;
                },
                entryFileNames: `js/[name]-[hash].js`,
                assetFileNames: `[ext]/[name]-[hash].[ext]`
            }
        },
        // Optimize build performance
        target: 'es2020',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            }
        }
    }
});