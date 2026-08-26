/**
 * A browser that refuses site data must not be able to take the page down.
 *
 * Reading `window.localStorage` THROWS a SecurityError when cookies are blocked for
 * the site, inside a sandboxed iframe, and in some in-app webviews — so
 * `typeof window !== "undefined"` never guarded anything. In app.jsx the call sits
 * at module top level, which means the throw happened while the bundle was
 * evaluating and the whole SPA failed to boot.
 */

import { safeGet, safeRemove, safeSet, storageAvailable } from "../../resources/js/lib/safeStorage";

describe("safeStorage", () => {
    const realStorage = Object.getOwnPropertyDescriptor(window, "localStorage");

    const denyStorage = () => {
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            get() {
                throw new DOMException(
                    "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
                    "SecurityError",
                );
            },
        });
    };

    afterEach(() => {
        if (realStorage) {
            Object.defineProperty(window, "localStorage", realStorage);
        }
    });

    it("reads and writes normally when storage works", () => {
        expect(safeSet("sp_test", "hello")).toBe(true);
        expect(safeGet("sp_test")).toBe("hello");
        expect(safeRemove("sp_test")).toBe(true);
        expect(safeGet("sp_test")).toBeNull();
    });

    it("does not throw when the browser denies storage", () => {
        denyStorage();

        expect(() => safeGet("anything")).not.toThrow();
        expect(() => safeSet("anything", "value")).not.toThrow();
        expect(() => safeRemove("anything")).not.toThrow();
    });

    it("reports a miss rather than an error when storage is denied", () => {
        denyStorage();

        expect(safeGet("anything")).toBeNull();
        expect(safeSet("anything", "value")).toBe(false);
        expect(storageAvailable()).toBe(false);
    });
});
