// CRITICAL React Children Emergency Patch
// This must run before ANY React code executes to prevent Children undefined error

// Immediate console log to verify loading
console.log('🚨 EMERGENCY REACT CHILDREN PATCH LOADING...');

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
    console.log('🔧 Emergency Children patch installed on window');
}

if (typeof globalThis !== 'undefined') {
    globalThis.__REACT_CHILDREN_EMERGENCY_PATCH__ = EmergencyChildren;
    console.log('🔧 Emergency Children patch installed on globalThis');
}

// Now import React - this should trigger after our emergency patch
import React, { Children } from 'react';

console.log('🚀 React imported, applying comprehensive fix...');

// Comprehensive React Children fix function
const applyComprehensiveReactFix = () => {
    const originalReact = React;
    const workingChildren = Children || EmergencyChildren;
    
    console.log('🔧 Comprehensive React fix starting...', {
        'Original React.Children': !!originalReact.Children,
        'Imported Children': !!Children,
        'Emergency Children': !!EmergencyChildren
    });
    
    // Fix 1: Direct assignment
    if (!originalReact.Children) {
        originalReact.Children = workingChildren;
        console.log('✅ Step 1: Assigned Children to React.Children');
    }
    
    // Fix 2: Make React globally available
    if (typeof window !== 'undefined') {
        window.React = originalReact;
        if (!window.React.Children) {
            window.React.Children = workingChildren;
            console.log('✅ Step 2: Fixed window.React.Children');
        }
        
        // Use defineProperty to lock it down
        try {
            Object.defineProperty(window.React, 'Children', {
                value: workingChildren,
                writable: true, // Keep writable in case React needs to modify it
                enumerable: true,
                configurable: true
            });
            console.log('✅ Step 3: Protected window.React.Children with defineProperty');
        } catch (e) {
            console.warn('⚠️ Could not use defineProperty on window.React.Children:', e);
        }
    }
    
    // Fix 3: Also fix globalThis
    if (typeof globalThis !== 'undefined') {
        if (!globalThis.React) {
            globalThis.React = originalReact;
        }
        if (!globalThis.React.Children) {
            globalThis.React.Children = workingChildren;
            console.log('✅ Step 4: Fixed globalThis.React.Children');
        }
    }
    
    // Fix 4: Create a React proxy that ensures Children is always available
    const ReactProxy = new Proxy(originalReact, {
        get: function(target, prop) {
            if (prop === 'Children' && !target.Children) {
                console.log('🚨 Proxy intercepted React.Children access - providing emergency implementation');
                return workingChildren;
            }
            return target[prop];
        },
        
        set: function(target, prop, value) {
            target[prop] = value;
            return true;
        }
    });
    
    // Replace React references
    if (typeof window !== 'undefined') {
        window.React = ReactProxy;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.React = ReactProxy;
    }
    
    console.log('✅ Comprehensive React Children fix completed successfully!', {
        'React.Children available': !!(originalReact.Children || workingChildren),
        'window.React.Children available': !!(typeof window !== 'undefined' && window.React && window.React.Children),
        'globalThis.React.Children available': !!(typeof globalThis !== 'undefined' && globalThis.React && globalThis.React.Children),
        'Proxy installed': true
    });
    
    return ReactProxy;
};

// Apply the comprehensive fix immediately
const FixedReact = applyComprehensiveReactFix();

// Export the fixed React
export { FixedReact as React, Children };
export default FixedReact;
