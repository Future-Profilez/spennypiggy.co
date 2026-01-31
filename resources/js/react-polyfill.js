// CRITICAL React Children Emergency Patch
// This must run before ANY React code executes to prevent Children undefined error

// Immediate console log to verify loading

// Pre-emptively create a React Children implementation before React loads
const createReactChildrenImplementation = () => {
    // Basic Children API implementation
    const ChildrenAPI = {
        map: function(children, fn, thisArg) {
            if (children == null) return children;
            const result = [];
            let index = 0;
            
            const traverse = (child) => {
                if (child == null || typeof child === 'boolean') return;
                if (Array.isArray(child)) {
                    child.forEach(traverse);
                } else {
                    result.push(fn.call(thisArg, child, index++));
                }
            };
            
            traverse(children);
            return result;
        },
        
        forEach: function(children, fn, thisArg) {
            if (children == null) return;
            let index = 0;
            
            const traverse = (child) => {
                if (child == null || typeof child === 'boolean') return;
                if (Array.isArray(child)) {
                    child.forEach(traverse);
                } else {
                    fn.call(thisArg, child, index++);
                }
            };
            
            traverse(children);
        },
        
        count: function(children) {
            let count = 0;
            this.forEach(children, () => count++);
            return count;
        },
        
        toArray: function(children) {
            return this.map(children, child => child) || [];
        },
        
        only: function(children) {
            // Basic validation for single child
            if (children == null) {
                throw new Error('React.Children.only expected to receive a single React element child.');
            }
            
            const childArray = Array.isArray(children) ? children : [children];
            const validChildren = childArray.filter(child => 
                child != null && typeof child !== 'boolean' && child !== ''
            );
            
            if (validChildren.length !== 1) {
                throw new Error('React.Children.only expected to receive a single React element child.');
            }
            
            return validChildren[0];
        }
    };
    
    return ChildrenAPI;
};

// Create the implementation immediately
const EmergencyChildren = createReactChildrenImplementation();

// Patch global objects BEFORE importing React
if (typeof window !== 'undefined') {
    window.__REACT_CHILDREN_EMERGENCY_PATCH__ = EmergencyChildren;
}

if (typeof globalThis !== 'undefined') {
    globalThis.__REACT_CHILDREN_EMERGENCY_PATCH__ = EmergencyChildren;
}

// Now import React - this should trigger after our emergency patch
import React, { Children } from 'react';

// Diagnostic log
console.log('React Polyfill loaded. React exists:', !!React);

// Comprehensive React Children fix function
const applyComprehensiveReactFix = () => {
    // Safety check for React
    if (!React) {
        console.warn('⚠️ React is undefined in polyfill. Skipping fix.');
        return { Children: EmergencyChildren };
    }

    const originalReact = React;
    const workingChildren = Children || EmergencyChildren;
    
    try {
        // Fix 1: Direct assignment
        if (originalReact && !originalReact.Children) {
            originalReact.Children = workingChildren;
        }
    } catch (e) {
        console.warn('⚠️ Failed to set React.Children directly:', e);
    }
    
    // Fix 2: Make React globally available
    if (typeof window !== 'undefined') {
        try {
            if (!window.React) {
                window.React = originalReact;
            }
            
            // Re-check existence before accessing properties
            if (window.React && !window.React.Children) {
                window.React.Children = workingChildren;
            }
        } catch (e) {
            console.warn('⚠️ Failed to patch window.React:', e);
        }
    }
    
    // Fix 3: Also fix globalThis
    if (typeof globalThis !== 'undefined') {
        try {
            if (!globalThis.React) {
                globalThis.React = originalReact;
            }
            // Re-check existence before accessing properties
            if (globalThis.React && !globalThis.React.Children) {
                globalThis.React.Children = workingChildren;
            }
        } catch (e) {
            console.warn('⚠️ Failed to patch globalThis.React:', e);
        }
    }
    
    return originalReact;
};

// Apply the comprehensive fix immediately
const FixedReact = applyComprehensiveReactFix();

// Export the fixed React
export { FixedReact as React, Children };
export default FixedReact;
