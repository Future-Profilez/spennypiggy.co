// Minimal React Children preload to prevent production errors
// This creates a fallback for React.Children if it's accessed before React loads


if (typeof window !== 'undefined') {
    // Create minimal React Children fallback
    const minimalChildren = {
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
    
    // Store the fallback for our React fix to use
    window.__MINIMAL_REACT_CHILDREN__ = minimalChildren;
}
