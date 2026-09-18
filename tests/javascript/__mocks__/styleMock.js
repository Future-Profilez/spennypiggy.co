/**
 * Stylesheet stub for Jest.
 *
 * 🚨 `jest.config.cjs` used to map every stylesheet at `identity-obj-proxy`,
 * WHICH IS NOT INSTALLED — so any test importing a component that imports a
 * stylesheet died on "Could not locate module", naming the CSS file rather than
 * the missing package. Every component in `resources/js` that uses a CSS module
 * was therefore untestable, and nothing said so because no test imported one yet.
 *
 * Behaves like identity-obj-proxy: `styles.whatever` answers "whatever", so a
 * className assertion still reads the name the source used.
 */
module.exports = new Proxy(
    {},
    {
        get: (target, key) => (key === "__esModule" ? false : String(key)),
    },
);
