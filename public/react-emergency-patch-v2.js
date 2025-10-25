// CRITICAL EMERGENCY REACT CHILDREN PATCH - Production Version
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
    
    // CRITICAL: Override Object.defineProperty to intercept React.Children assignments
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(target, prop, descriptor) {
        // Intercept the specific error in production - when React tries to set Children on undefined
        if (prop === 'Children' && (!target || typeof target !== 'object')) {
            console.warn('🚨 Intercepted attempt to set Children on invalid target:', target);
            
            // Create a placeholder target to avoid the error
            target = window.React || { version: '18.3.1' };
            console.log('✅ Created valid target for Children property');
        }
        
        // Fix undefined Children value - only if descriptor has a value property
        if (prop === 'Children' && descriptor.hasOwnProperty('value') && (!descriptor.value || descriptor.value === undefined)) {
            console.warn('⚠️ Fixing undefined Children value in descriptor');
            descriptor.value = emergencyChildren;
            // Remove any conflicting accessor properties
            delete descriptor.get;
            delete descriptor.set;
        }
        
        return originalDefineProperty.call(this, target, prop, descriptor);
    };
    
    // Pre-install React with Children to prevent the error
    if (!window.React) {
        window.React = { 
            version: '18.3.1',
            Children: emergencyChildren
        };
        console.log('✅ Installed window.React with Children');
    } else if (!window.React.Children) {
        window.React.Children = emergencyChildren;
        console.log('✅ Added Children to existing window.React');
    }
    
    // Also handle globalThis for modern environments
    if (typeof globalThis !== 'undefined') {
        if (!globalThis.React) {
            globalThis.React = window.React || { 
                version: '18.3.1',
                Children: emergencyChildren
            };
        } else if (!globalThis.React.Children) {
            globalThis.React.Children = emergencyChildren;
        }
    }
    
    // Store emergency references globally
    window.__EMERGENCY_REACT_CHILDREN__ = emergencyChildren;
    
    // Handle AMD/UMD modules
    if (typeof define === 'function' && define.amd) {
        const originalDefine = define;
        define = function(name, deps, factory) {
            // If this is a React definition, ensure it has Children
            if (name === 'react' || (Array.isArray(deps) && deps.indexOf('react') !== -1)) {
                console.log('🔍 Intercepted AMD define for React');
                const originalFactory = factory;
                factory = function() {
                    const reactModule = originalFactory.apply(this, arguments);
                    if (reactModule && !reactModule.Children) {
                        console.log('✅ Added Children to AMD React module');
                        reactModule.Children = emergencyChildren;
                    }
                    return reactModule;
                };
            }
            return originalDefine.call(this, name, deps, factory);
        };
        define.amd = originalDefine.amd;
    }
    
    // Enhanced monitoring for React.Children
    // Set up a more robust monitoring system instead of Function.prototype override
    const monitorReactChildren = () => {
        // Check if window.React exists and fix Children if needed
        if (typeof window !== 'undefined') {
            if (window.React && typeof window.React === 'object' && !window.React.Children) {
                console.warn('⚠️ React.Children was undefined - restoring emergency implementation');
                window.React.Children = emergencyChildren;
            }
            
            // Also check globalThis
            if (typeof globalThis !== 'undefined' && globalThis.React && typeof globalThis.React === 'object' && !globalThis.React.Children) {
                globalThis.React.Children = emergencyChildren;
            }
        }
    };
    
    // Run monitoring immediately and repeatedly
    monitorReactChildren();
    
    // Use both setInterval and requestAnimationFrame for comprehensive coverage
    setInterval(monitorReactChildren, 10); // Very frequent checks
    
    if (typeof requestAnimationFrame !== 'undefined') {
        const rafMonitor = () => {
            monitorReactChildren();
            requestAnimationFrame(rafMonitor);
        };
        requestAnimationFrame(rafMonitor);
    }
    
    // Start a monitoring interval to ensure React.Children remains available
    setInterval(() => {
        if (window.React && !window.React.Children) {
            console.warn('⚠️ React.Children was lost - restoring emergency implementation');
            window.React.Children = emergencyChildren;
        }
    }, 50); // Check frequently
    
    console.log('✅ Global React Children emergency patch completed successfully!');
    
    // Debug information
    console.log('🔍 Emergency patch status:', {
        'window.React exists': !!window.React,
        'window.React.Children exists': !!(window.React && window.React.Children),
        'globalThis.React.Children exists': !!(typeof globalThis !== 'undefined' && globalThis.React && globalThis.React.Children),
        'Emergency implementation available': !!emergencyChildren
    });
})();
