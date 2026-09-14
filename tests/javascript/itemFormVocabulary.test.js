/**
 * The seven "add a listing" forms must keep speaking one language.
 *
 * 🚨 THIS TEST EXISTS BECAUSE THE DRIFT ALREADY HAPPENED, TWICE. `AddBills` and
 * `AddMembership` each carried a copy-pasted `FIELD` constant and the copies had
 * come apart (`font-medium` in one, `font-bold` in the other); across all seven
 * forms there were four border treatments, six paddings, five focus treatments
 * and three placeholder colours for the same input. Nothing errors when a new
 * form invents its own field — it simply looks like a different product, and the
 * next reader copies whichever file they opened first.
 *
 * ⚠️ It asserts the RULES, never the exact class strings. A test pinning
 * `px-4 py-3` fails on an ordinary tuning change to the shared recipe, which is
 * not what this is about — the recipe is allowed to change, in one place.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../resources/js");

/** Every add-item surface reachable from a creator's own profile page. */
const FORMS = {
    shop: "Pages/shop/AddItem.jsx",
    bills: "Pages/bills/AddBills.jsx",
    membership: "Pages/membership/AddMembership.jsx",
    wish: "Pages/Auth/Wishlist.jsx",
    task: "Pages/Tasks/Create.jsx",
    post: "Pages/feed/AddPost.jsx",
    piggyPot: "Components/PiggyPotModal.jsx",
};

/**
 * `AddPost` is the deliberate exception to the shared FIELD recipe: it is a
 * composer whose title and body are frameless by design (the sheet is the
 * frame), so it has no bordered input to share. It is still held to the focus,
 * placeholder and error rules below.
 */
const FRAMELESS = ["post"];

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

/** Comments name several of these classes while explaining why they went. */
const withoutComments = (source) =>
    source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/**
 * Every `<input>`, `<textarea>` and `<select>` opening tag, with its line. Brace
 * depth is tracked because these tags carry JSX expressions containing `>`.
 */
const openingTags = (source) => {
    const found = [];
    const pattern = /<(input|textarea|select)\b/g;
    let match;
    while ((match = pattern.exec(source)) !== null) {
        let index = match.index + match[0].length;
        let depth = 0;
        while (index < source.length) {
            const character = source[index];
            if (character === "{") depth += 1;
            else if (character === "}") depth -= 1;
            else if (character === ">" && depth === 0) break;
            index += 1;
        }
        found.push({
            tag: source.slice(match.index, index),
            line: source.slice(0, match.index).split("\n").length,
        });
    }
    return found;
};

describe("add-item form vocabulary", () => {
    it.each(Object.entries(FORMS).filter(([key]) => !FRAMELESS.includes(key)))(
        "%s imports the shared field recipe instead of declaring its own",
        (_key, file) => {
            expect(read(file)).toContain("@/Components/ItemForm/ItemFormKit");
        },
    );

    it.each(Object.entries(FORMS))(
        "%s never removes a focus indicator without putting one back",
        (_key, file) => {
            const source = withoutComments(read(file));
            // `focus:ring-0` is only ever legitimate beside a replacement
            // indicator, and none of these files needs one — the shared recipe
            // carries the house ring. A 2px `focus:translate-*` is not an
            // indicator either: it changes position, not contrast (WCAG 2.4.7).
            expect(source).not.toMatch(/focus:ring-0/);
            expect(source).not.toMatch(/focus:translate-/);
        },
    );

    it.each(Object.entries(FORMS))(
        "%s keeps placeholders and small print on the ink ramp",
        (_key, file) => {
            const source = withoutComments(read(file));
            // text-neutral-400 is 2.5:1 and text-black/40/50 fail AA; DESIGN.md
            // names placeholders explicitly and gives small print no exemption.
            expect(source).not.toMatch(/text-neutral-[34]00/);
            expect(source).not.toMatch(/text-black\/(?:[1-5])0\b/);
            expect(source).not.toMatch(/text-gray-[1-5]00/);
        },
    );

    it.each(Object.entries(FORMS))("%s reports a problem inline, never in a browser dialog", (_key, file) => {
        const source = withoutComments(read(file));
        // A native alert() cannot be styled, cannot sit beside the field it is
        // about, and on iOS pulls focus out of the form — a mistyped price then
        // reads as the site breaking rather than as a rule.
        expect(source).not.toMatch(/(?<![.\w])alert\(/);
    });

    it.each(Object.entries(FORMS))("%s does not claim a border width the stylesheet discards", (_key, file) => {
        const source = withoutComments(read(file));
        // `resources/css/index.css` redefines `.border-black` as a full `border`
        // shorthand OUTSIDE the utilities layer, so a width class next to it is
        // silently dropped and every one of these rendered at 2px. Write what it
        // draws, or set the colour with an arbitrary value that carries no
        // shorthand (`border-[#000]`).
        expect(source).not.toMatch(/border-\[\d+px\] border-black/);
        expect(source).not.toMatch(/border-[34] border-black/);
    });

    it.each(Object.entries(FORMS))(
        "%s keeps every input at 16px on a phone",
        (_key, file) => {
            // 🚨 iOS Safari — and the installed PWA, which is the same engine —
            // ZOOMS the page when a focused input's font-size is under 16px, and
            // in `display: standalone` there is no visible way back out of that
            // zoom: the viewport stays shifted and the layout reads as broken.
            // A denser field is allowed from `md` up (`md:text-sm`), where there
            // is a real pointer and no zoom behaviour.
            const source = withoutComments(read(file));
            openingTags(source).forEach(({ tag, line }) => {
                const small = tag.match(/(?<![-:\w])text-(?:sm|xs|\[(?:[89]|1[0-5])px\])\b/);
                if (!small) return;
                throw new Error(
                    `${file}:${line} sets ${small[0]} on a <${tag.match(/^<(\w+)/)[1]}>. ` +
                        "Use itemFieldCompactClass (or `md:text-sm`) so the phone stays at 16px.",
                );
            });
        },
    );

    it("white type never sits on a brand-pink fill", () => {
        // 3.78:1 against 5.56:1 for black — the house rule for any #FF007F fill.
        Object.values(FORMS).forEach((file) => {
            withoutComments(read(file))
                .split("\n")
                .forEach((line) => {
                    if (!/bg-\[#FF007F\]/.test(line)) return;
                    expect(line).not.toMatch(/text-white(?![/\w])/);
                });
        });
    });
});
