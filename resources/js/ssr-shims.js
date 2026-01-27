// Ensure global objects are available
if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
        location: {
            href: '',
            origin: '',
            protocol: 'https:',
            host: 'spennypiggy.co',
            hostname: 'spennypiggy.co',
            pathname: '/',
            search: '',
            hash: '',
            replace: () => {},
            assign: () => {},
            reload: () => {},
        },
        navigator: {
            userAgent: 'SSR',
            platform: 'Node.js',
            appName: 'Netscape',
        },
        document: {
            createElement: () => ({
                setAttribute: () => {},
                appendChild: () => {},
                style: {},
                classList: { add: () => {}, remove: () => {} },
            }),
            getElementById: () => null,
            getElementsByTagName: () => [],
            head: { appendChild: () => {} },
            body: { appendChild: () => {} },
            documentElement: {
                getAttribute: () => null,
                style: {},
            },
            cookie: '',
        },
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
        },
        sessionStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
        requestAnimationFrame: (cb) => setTimeout(cb, 0),
        cancelAnimationFrame: (id) => clearTimeout(id),
        getComputedStyle: () => ({ getPropertyValue: () => '' }),
        screen: { width: 1920, height: 1080 },
    };
}

if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = globalThis.window.navigator;
}

if (typeof globalThis.document === 'undefined') {
    globalThis.document = globalThis.window.document;
}

if (typeof globalThis.location === 'undefined') {
    globalThis.location = globalThis.window.location;
}

if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = globalThis.window.localStorage;
}

// Shim for getAttributeNames which was missing
if (typeof globalThis.Element === 'undefined') {
    globalThis.Element = class {};
}
if (!globalThis.Element.prototype.getAttributeNames) {
    globalThis.Element.prototype.getAttributeNames = function() { return []; };
}
if (!globalThis.Element.prototype.hasAttribute) {
    globalThis.Element.prototype.hasAttribute = function() { return false; };
}
