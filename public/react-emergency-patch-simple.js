// SIMPLE REACT CHILDREN EMERGENCY PATCH
// This addresses the specific "Cannot set properties of undefined (setting 'Children')" error

(function() {
    'use strict';
    
    console.log('🚨 SIMPLE REACT EMERGENCY PATCH LOADING...');
    
    // Create emergency Children implementation
    const EmergencyChildren = {
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
    
    // CRITICAL FIX: Override Object.defineProperty to prevent the error
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
        try {
            // If trying to set Children property and obj is undefined/null, create a valid target
            if (prop === 'Children' && (!obj || typeof obj !== 'object')) {
                console.warn('🛑 Preventing Children assignment to invalid object:', obj);
                obj = window.React || {};
            }
            
            // Call original defineProperty
            return originalDefineProperty.call(this, obj, prop, descriptor);
        } catch (error) {
            console.warn('🚨 Object.defineProperty error intercepted:', error.message);
            
            // If it's the Children property, try to fix it
            if (prop === 'Children') {
                if (!window.React) {
                    window.React = {};
                }
                window.React.Children = EmergencyChildren;
                console.log('✅ Applied emergency Children fix after error');
                return window.React;
            }
            
            // Re-throw other errors
            throw error;
        }
    };
    
    // Pre-install React.Children to prevent the error in the first place
    if (typeof window !== 'undefined') {
        if (!window.React) {
            window.React = {};
        }
        if (!window.React.Children) {
            window.React.Children = EmergencyChildren;
            console.log('✅ Pre-installed React.Children on window.React');
        }
    }
    
    if (typeof globalThis !== 'undefined') {
        if (!globalThis.React) {
            globalThis.React = {};
        }
        if (!globalThis.React.Children) {
            globalThis.React.Children = EmergencyChildren;
            console.log('✅ Pre-installed React.Children on globalThis.React');
        }
    }
    
    // Store emergency reference
    window.__EMERGENCY_CHILDREN__ = EmergencyChildren;
    
    console.log('✅ Simple React Children emergency patch completed!');
    console.log('🔍 Status:', {
        'window.React.Children': !!(window.React && window.React.Children),
        'Emergency available': !!EmergencyChildren
    });
    
})();
