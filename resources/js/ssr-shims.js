const __noop = function() {};
const __classList = { add: __noop, remove: __noop, toggle: __noop, contains: () => false };
const __createStubEl = (id = '') => {
    let _innerHTML = '';
    const el = {
        id,
        style: {},
        classList: __classList,
        setAttribute: __noop,
        getAttribute: () => null,
        getAttributeNames: () => [],
        hasAttribute: () => false,
        appendChild: __noop,
        removeChild: __noop,
        replaceChild: __noop,
        remove: __noop,
        addEventListener: __noop,
        removeEventListener: __noop,
        textContent: '',
        firstChild: null,
        lastChild: null,
        childNodes: [],
        parentNode: null,
        nextSibling: null,
        previousSibling: null,
        tagName: 'DIV',
        nodeType: 1,
        ownerDocument: null, 
        cloneNode: () => __createStubEl(),
        getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }),
        contains: () => false,
    };

    Object.defineProperty(el, 'innerHTML', {
        get() { return _innerHTML; },
        set(val) {
            _innerHTML = val;
            if (this.tagName === 'TEMPLATE' && this.content) {
                const child = __createStubEl();
                child.innerHTML = val;
                this.content.firstChild = child;
            }
        },
        configurable: true
    });

    return el;
};

if (typeof globalThis.window === 'undefined') {
  const media = () => ({ matches: false, addListener: __noop, removeListener: __noop, addEventListener: __noop, removeEventListener: __noop });
  globalThis.window = {
    matchMedia: media,
    addEventListener: __noop,
    removeEventListener: __noop,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    cancelAnimationFrame: __noop,
    Intercom: __noop,
    location: { href: '', origin: '', protocol: 'http:', host: 'localhost', pathname: '/', search: '' },
    navigator: { vibrate: __noop, userAgent: 'SSR', platform: 'SSR', clipboard: { writeText: async () => {} } },
    screen: { width: 1920, height: 1080 },
    innerWidth: 1920,
    innerHeight: 1080,
    localStorage: { getItem: () => null, setItem: __noop, removeItem: __noop },
    sessionStorage: { getItem: () => null, setItem: __noop, removeItem: __noop },
    document: undefined,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    Image: function() { return __createStubEl(); }
  };
}

if (typeof globalThis.document === 'undefined') {
  const doc = {
    head: { 
        appendChild: __noop, 
        querySelector: () => null,
        firstChild: null,
        childNodes: [],
        nodeType: 1,
        tagName: 'HEAD'
    },
    body: { 
        classList: __classList, 
        appendChild: __noop,
        firstChild: null,
        childNodes: [],
        nodeType: 1,
        tagName: 'BODY'
    },
    createElement: (tag) => {
        const el = __createStubEl();
        el.tagName = (tag || 'div').toUpperCase();
        el.ownerDocument = doc;
        if (el.tagName === 'TEMPLATE') {
            el.content = __createStubEl();
        }
        return el;
    },
    createTextNode: (text) => ({ nodeType: 3, nodeValue: text, textContent: text, parentNode: null }),
    createComment: (text) => ({ nodeType: 8, nodeValue: text, textContent: text, parentNode: null }),
    querySelector: () => __createStubEl(),
    getElementById: (id) => __createStubEl(id),
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    addEventListener: __noop,
    removeEventListener: __noop,
    readyState: 'complete',
    referrer: '',
    cookie: '',
    documentElement: {
        scrollTop: 0,
        scrollLeft: 0,
        style: {},
        firstChild: null,
        lastChild: null,
        childNodes: [],
        nodeType: 1,
        tagName: 'HTML'
    }
  };
  doc.head.ownerDocument = doc;
  doc.body.ownerDocument = doc;
  doc.documentElement.ownerDocument = doc;
  
  globalThis.document = doc;
}

// Patch console.error to suppress specific React SSR warnings
const originalConsoleError = console.error;
console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) {
        return;
    }
    originalConsoleError(...args);
};

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = window.navigator;
}
