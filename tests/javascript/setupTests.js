/**
 * Jest setup, referenced by `setupFilesAfterEnv` in jest.config.cjs.
 *
 * The config pointed here from the start but the file was never created, so
 * `npm test` failed to even start — one of three reasons Jest could not run in
 * this project (the others: the config was CommonJS under `"type": "module"`,
 * and `moduleNameMapping` is a typo for `moduleNameMapper`, so the `@/` alias
 * never resolved).
 *
 * Deliberately minimal. Add jsdom shims here only when a test actually needs
 * one — a setup file that silently patches globals makes tests pass for reasons
 * the application does not share.
 */

// jsdom implements neither of these, and components that call them throw rather
// than degrade. Both are read-only observers, so a no-op is a faithful stand-in.
if (typeof window !== 'undefined') {
    window.matchMedia = window.matchMedia || ((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }));

    global.IntersectionObserver = global.IntersectionObserver || class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    global.ResizeObserver = global.ResizeObserver || class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
