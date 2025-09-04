import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }), 
        react(),
        sentryVitePlugin({
            org: "spenny-piggy",
            project: "javascript-react"
        }),
        // Add bundle analyzer (only when needed)
        process.env.ANALYZE && visualizer({
            filename: 'dist/bundle-analysis.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        })
    ].filter(Boolean),

    build: {
        sourcemap: false,
        // Simplified chunk splitting to avoid bundling issues
        rollupOptions: {
            output: {
                manualChunks: {
                    // Keep vendors separate for better caching
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-inertia': ['@inertiajs/react'],
                    'vendor-other': ['axios', 'react-bootstrap']
                },
                
                // Optimize chunk naming for better caching
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
        
        // Performance optimizations
        target: 'es2020',
        minify: 'esbuild', // Use esbuild instead of terser for better compatibility
        chunkSizeWarningLimit: 1000,
    },
    
    // Optimize dev server
    server: {
        hmr: {
            overlay: false
        }
    },
    
    // Resolve optimizations
    resolve: {
        alias: {
            '@': '/resources/js',
        },
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
});
