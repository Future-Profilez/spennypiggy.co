// EMERGENCY REACT CHILDREN PATCH - Must run before ANY React code
// This script must be loaded in the HTML <head> before any other JavaScript

(function() {
    'use strict';
    
    // console.log('🚨 GLOBAL REACT EMERGENCY PATCH LOADING...');
    
    // Create a comprehensive Children API implementation
    const createEmergencyChildrenAPI = () => {
        return {
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
    };
    
    const emergencyChildren = createEmergencyChildrenAPI();
    
    // Store emergency implementation globally
    window.__EMERGENCY_REACT_CHILDREN__ = emergencyChildren;
    
    // Create a global React object if it doesn't exist
    if (typeof window.React === 'undefined') {
        window.React = {};
    }
    
    // Ensure React.Children is available
    if (!window.React.Children) {
        window.React.Children = emergencyChildren;
        // console.log('✅ Emergency React.Children installed on window.React');
    }
    
    // Also patch globalThis
    if (typeof globalThis !== 'undefined') {
        if (typeof globalThis.React === 'undefined') {
            globalThis.React = {};
        }
        if (!globalThis.React.Children) {
            globalThis.React.Children = emergencyChildren;
            // console.log('✅ Emergency React.Children installed on globalThis.React');
        }
    }
    
    // Create a monitoring system to detect and fix React.Children if it becomes undefined
    const monitorAndFixReactChildren = () => {
        setInterval(() => {
            if (window.React && !window.React.Children) {
                // console.warn('🚨 React.Children became undefined! Restoring emergency implementation...');
                window.React.Children = emergencyChildren;
            }
        }, 100); // Check every 100ms
    };
    
    // Start monitoring after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', monitorAndFixReactChildren);
    } else {
        monitorAndFixReactChildren();
    }
    
    // Intercept any attempts to define React without Children
    let originalReact = window.React;
    Object.defineProperty(window, 'React', {
        get: function() {
            return originalReact;
        },
        set: function(newReact) {
            if (newReact && typeof newReact === 'object') {
                // Ensure Children property exists on any React object assigned to window
                if (!newReact.Children) {
                    newReact.Children = emergencyChildren;
                    // console.log('✅ Auto-fixed missing Children on newly assigned React object');
                }
            }
            originalReact = newReact;
        },
        enumerable: true,
        configurable: true
    });
    
    // console.log('✅ Global React Children emergency patch completed successfully!');
})();
