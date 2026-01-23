// React initialization fix - DEPRECATED
// This file is no longer needed as React is properly initialized in app.jsx

// Force console logs in production for debugging
if (typeof window !== 'undefined') {
    window.console = window.console || {};
    const originalLog = console.log;
    console.log = (...args) => {
        if (args[0] && args[0].includes && args[0].includes('React Fix')) {
            originalLog.apply(console, args);
        } else if (typeof originalLog === 'function') {
            originalLog.apply(console, args);
        }
    };
}

// Import React explicitly to ensure it's available
import ReactModule from 'react';

// Ensure React is properly loaded before any components initialize
const ensureReactChildren = (ReactInstance) => {
    try {
        // Check if React exists
        if (typeof ReactInstance === 'undefined' || !ReactInstance) {
            console.error('🚨 React Fix: React is not available');
            return false;
        }

        // Check if React.Children exists and is an object
        if (!ReactInstance.Children || typeof ReactInstance.Children !== 'object') {
            console.warn('🔧 React Fix: React.Children is missing, restoring from fallback');
            
            // Use the preloaded minimal Children or create our own
            const minimalChildren = (typeof window !== 'undefined' && window.__MINIMAL_REACT_CHILDREN__) 
                || {
                    map: (children, fn) => {
                        if (!children) return children;
                        if (Array.isArray(children)) {
                            return children.map(fn);
                        }
                        return [fn(children, 0)];
                    },
                    forEach: (children, fn) => {
                        if (!children) return;
                        if (Array.isArray(children)) {
                            children.forEach(fn);
                        } else {
                            fn(children, 0);
                        }
                    },
                    count: (children) => {
                        if (!children) return 0;
                        if (Array.isArray(children)) return children.length;
                        return 1;
                    },
                    only: (children) => {
                        if (Array.isArray(children) && children.length === 1) {
                            return children[0];
                        }
                        if (!Array.isArray(children)) {
                            return children;
                        }
                        throw new Error('React.Children.only expected to receive a single React element child.');
                    },
                    toArray: (children) => {
                        if (!children) return [];
                        if (Array.isArray(children)) return children;
                        return [children];
                    }
                };
            
            ReactInstance.Children = minimalChildren;
        }

        // Verify React.Children methods exist
        const requiredMethods = ['map', 'forEach', 'count', 'only', 'toArray'];
        const missingMethods = requiredMethods.filter(method => typeof ReactInstance.Children[method] !== 'function');
        
        if (missingMethods.length > 0) {
            console.error('🚨 React Fix: React.Children missing methods:', missingMethods);
            return false;
        }
        return true;
    } catch (error) {
        console.error('🚨 React Fix: Error during React.Children initialization:', error);
        return false;
    }
};

// Apply the fix immediately when this module is loaded
const applyReactFix = () => {
    
    // Use the imported React module
    if (!ReactModule) {
        console.error('🚨 React Fix: Could not import React module');
        return false;
    }
    
    // Try to fix React.Children on the imported module
    const childrenFixed = ensureReactChildren(ReactModule);
    if (!childrenFixed) {
        console.error('🚨 React Fix: Could not fix React.Children');
        return false;
    }
    
    // Fix JSX runtime issues
    try {
        console.log('🔧 React Fix: Checking JSX runtime compatibility');
        
        // Ensure createElement exists
        if (!ReactModule.createElement) {
            console.error('🚨 React Fix: React.createElement is missing');
            return false;
        }
        
        // Check for JSX runtime functions
        if (!ReactModule.Fragment) {
            console.warn('🔧 React Fix: React.Fragment is missing, creating fallback');
            ReactModule.Fragment = 'react.fragment';
        }
        
    } catch (jsxError) {
        console.error('🚨 React Fix: JSX runtime error:', jsxError);
    }
    
    // Make React globally available
    try {
        if (typeof window !== 'undefined') {
            window.React = ReactModule;
            
            // Ensure React DevTools compatibility
            if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers = 
                    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers || new Map();
            }
        }
        // Only set global.React if global exists (Node.js environment)
        if (typeof global !== 'undefined') {
            global.React = ReactModule;
        }
    } catch (globalError) {
        console.warn('🔧 React Fix: Could not set global React:', globalError);
        // This is not critical for the fix to work
    }
    
    console.log('✅ React Fix: All React initialization checks passed');
    return true;
};

// Apply the fix
const fixResult = applyReactFix();

// Also make the fix function available for manual calling if needed
if (typeof window !== 'undefined') {
    window.applyReactFix = applyReactFix;
    window.ReactModule = ReactModule; // Make the React module available globally
}

export default {
    applyReactFix,
    fixResult,
    ReactModule
};
