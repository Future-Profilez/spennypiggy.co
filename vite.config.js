import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    resolve: {
        alias: {
            // Force single React instance to prevent version conflicts
            'react': 'react',
            'react-dom': 'react-dom'
        },
        dedupe: ['react', 'react-dom']
    },
    define: {
        // Fix React 18 Children undefined issue in production
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        // Global React Children fix
        'global': 'globalThis',
        // Ensure React runtime is properly configured
        '__REACT_DEVTOOLS_GLOBAL_HOOK__': 'undefined'
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react({
            // Use automatic JSX runtime (React 17+ style)
            jsxRuntime: 'automatic',
            include: ['resources/**/*.{jsx,tsx}'],
            exclude: [/node_modules/]
        }),
        // Only include Sentry in production
        process.env.NODE_ENV === 'production' && sentryVitePlugin({
            org: "spenny-piggy",
            project: "javascript-react",
            authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
        // Bundle analyzer - only when ANALYZE env is set
        process.env.ANALYZE && visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        })
    ].filter(Boolean),

    server: {
        host: 'localhost', // Explicitly use localhost
        port: 5173,
        // Enable HTTP/2 for development
        https: false, // Set to true for HTTPS/HTTP2 in dev
        // http2: true, // Temporarily disable HTTP/2 to avoid IPv6 issues
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
            input: {
                main: 'resources/js/app.jsx',
            },
            output: {
                // Manual chunk splitting strategy
                manualChunks(id) {
                    // Vendor libraries
                    if (id.includes('node_modules')) {
                        // Large libraries get their own chunks
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor';
                        }
                        // Keep scheduler with React to prevent Children issues
                        if (id.includes('scheduler')) {
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
                    
                    // Keep React polyfill with the main app bundle to ensure it loads first
                    if (id.includes('react-polyfill')) {
                        return 'app';
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
                drop_console: false, // Temporarily keep console for debugging
                drop_debugger: true,
            }
        }
    }
});