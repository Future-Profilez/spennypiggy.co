import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig((env) => {
    const ssrBuild = env.ssrBuild || process.argv.includes('--ssr');
    return { 
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            ssr: 'resources/js/ssr-marketing.jsx',
            refresh: true,
        }), 
        react(),
        sentryVitePlugin({
            org: "spenny-piggy",
            project: "javascript-react"
        }),
        // Add bundle analyzer (only when needed)
        // process.env.ANALYZE && visualizer({
        //     filename: 'dist/bundle-analysis.html',
        //     open: true,
        //     gzipSize: true,
        //     brotliSize: true,
        // })
    ].filter(Boolean),
    build: {
        sourcemap: true,
        rollupOptions: {
            output: ssrBuild ? {
                entryFileNames: 'ssr.js',
            } : {
                manualChunks: {
                    'vendor-core': ['react', 'react-dom', '@inertiajs/react', 'axios'],
                    'vendor-ui': ['@headlessui/react', '@heroicons/react', 'lucide-react', 'react-icons'],
                    'vendor-charts': ['recharts'],
                    'vendor-uploadcare': ['@uploadcare/blocks'],
                    'vendor-utils': ['clsx', 'canvas-confetti', 'aos', 'swiper'],
                    'vendor-sentry': ['@sentry/react']
                },
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith('.css')) {
                        return 'css/[name]-[hash][extname]';
                    }
                    if (/\.(png|jpe?g|svg|gif|webp|ico)$/i.test(assetInfo.name)) {
                        return 'images/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        },
        target: 'es2020',
        minify: 'esbuild',
        chunkSizeWarningLimit: 1500,
    },
    ssr: {
        noExternal: true
    },
    
    // Optimize dev server
    server: {
        host: '0.0.0.0',
        port: 5175,
        strictPort: false,
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        hmr: {
            host: 'localhost',
            overlay: false,
        } 
    },
    resolve: {
        alias: {
            '@': '/resources/js',
            'react': path.resolve(process.cwd(), 'node_modules/react'),
            'react-dom': path.resolve(process.cwd(), 'node_modules/react-dom'),
            ...(ssrBuild ? { 
                '^html2canvas$': path.resolve(process.cwd(), 'resources/js/ssr-html2canvas-mock.js') 
            } : {}),
        },
        dedupe: ['react', 'react-dom'],
    },
    
    // Dependency pre-bundling optimizations
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'axios'
        ]
    }
    }
});
