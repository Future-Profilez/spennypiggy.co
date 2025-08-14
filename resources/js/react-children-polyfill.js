/**
 * React Children Polyfill
 * 
 * This module ensures React.Children is available globally
 * to prevent "Cannot set properties of undefined (setting 'Children')" errors
 * in production builds where React might be split across chunks.
 */

import React, { Children } from 'react';

// Comprehensive React.Children polyfill
const ensureReactChildren = () => {
    // Fix React.Children on the main React object
    if (typeof React === 'object' && React && !React.Children) {
        React.Children = Children;
    }
    
    // Fix React.Children on window.React if it exists
    if (typeof window !== 'undefined' && window.React && !window.React.Children) {
        window.React.Children = Children;
    }
    
    // Ensure global React is available with Children
    if (typeof window !== 'undefined') {
        if (!window.React) {
            window.React = React;
        }
        
        // Double-check Children is available on global React
        if (window.React && !window.React.Children) {
            window.React.Children = Children;
        }
    }
    
    // Also check if there are any React references in global scope that need fixing
    if (typeof global !== 'undefined' && global.React && !global.React.Children) {
        global.React.Children = Children;
    }
};

// Apply the fix immediately
ensureReactChildren();

// Re-apply the fix whenever the module is imported
export default ensureReactChildren;

// Also export the fixed React object
export { React };
