/**
 * The one field vocabulary for every "add a listing" form.
 *
 * The seven add flows (shop, bills, membership, wish, task, post, piggy pot)
 * are the same job — a creator listing something for sale — and each had
 * invented its own field: four border treatments, six paddings, five focus
 * treatments and three placeholder colours across five files. Two of them had
 * copy-pasted the same `FIELD` constant and it had already drifted
 * (`font-medium` in one, `font-bold` in the other). This is the checkout
 * `Checkout/FormKit` decision applied to the create side; keep them separate,
 * because a checkout field is white-on-hairline and an item field carries the
 * black frame this side of the product uses.
 *
 * 🚨 THE BORDER IS `border-2`, NOT `border-[3px]`. `resources/css/index.css`
 * redefines `.border-black` as a full `border` shorthand OUTSIDE the utilities
 * layer, so an unlayered 2px wins over any width class next to it and every
 * `border-[3px] border-black` in the app has always rendered at 2px. Writing 2
 * changes nothing on screen and stops the source lying about what it draws.
 *
 * 🚨 EVERY FIELD KEEPS A VISIBLE FOCUS INDICATOR. Five of the seven forms
 * carried `focus:outline-none focus:ring-0` with nothing put back, and Tasks
 * indicated focus by MOVING the field 2px — a position change with no contrast
 * change is not a focus indicator (WCAG 2.4.7 / 2.4.11). The ring is the house
 * one: black border + `#FF007F`/25 halo.
 *
 * ⚠️ Placeholders are `text-black/60` (5.74:1). `text-neutral-400` was used in
 * three of these forms and is 2.5:1 — DESIGN.md names placeholders explicitly,
 * and small print gets no exemption.
 *
 * ⚠️ Validation copy is `#C81E5B`, the one colour DESIGN.md allows outside the
 * core palette. The forms previously spoke five error languages: `alert()`,
 * `text-red-500` (3.76:1), `text-[#FF007F]` (the accent, so an error read as a
 * highlight), `text-[#B3123F]` and a pink panel.
 */

export const itemFieldClass =
    "w-full min-h-[48px] rounded-box-sm border-2 border-black bg-white px-4 py-3 text-base font-medium text-black placeholder:font-medium placeholder:text-black/60 transition-colors duration-150 motion-reduce:transition-none focus:outline-none focus:border-black focus:ring-4 focus:ring-[#FF007F]/25 disabled:bg-black/5 disabled:text-black/60";

/**
 * 🚨 A DENSER FIELD STAYS 16px ON A PHONE. iOS Safari — and therefore the
 * installed PWA, which is the same engine — ZOOMS the whole page when a focused
 * input's font-size is below 16px, and in `display: standalone` there is no
 * visible way back out: the viewport stays shifted, the sticky footer leaves the
 * screen and the layout reads as broken. So `text-sm` is applied from `md` up
 * only, where there is a real pointer and no zoom behaviour. Never put a bare
 * `text-sm`/`text-xs` on an input in this app.
 */
export const itemFieldCompactClass = `${itemFieldClass} md:text-sm`;

/** Same recipe, sized for a multi-line answer. */
export const itemTextAreaClass = `${itemFieldClass} min-h-[120px] resize-y leading-[1.55]`;

/** A checkbox or radio inside an item form. `rounded-box-xs` is the smallest house radius; a bare `rounded` is Tailwind's 4px default and off-token. */
export const itemCheckboxClass =
    "h-5 w-5 shrink-0 rounded-box-xs border-2 border-black text-[#FF007F] accent-[#FF007F] focus:outline-none focus:ring-4 focus:ring-[#FF007F]/25";

export const itemLabelClass =
    "mb-2 block text-left text-[12px] font-black uppercase tracking-[0.14em] text-black";

/** Helper copy under a label or field. Bottom of the ink ramp, never a gray. */
export const itemHintClass = "text-sm font-medium text-black/60";

export const itemErrorClass =
    "mt-2 text-left text-[13px] font-bold text-[#C81E5B]";

export function ItemLabel({
    htmlFor,
    children,
    optional = false,
    className = "",
}) {
    return (
        <label htmlFor={htmlFor} className={`${itemLabelClass} ${className}`}>
            {children}
            {optional && (
                <span className="ml-2 font-bold text-black/60">Optional</span>
            )}
        </label>
    );
}

export function ItemHint({ children, className = "" }) {
    return <p className={`${itemHintClass} ${className}`}>{children}</p>;
}

/**
 * `role="alert"` so a validation message that appears after a failed submit is
 * announced rather than only drawn. Renders nothing when there is no problem,
 * which keeps the caller free of `{error && …}` noise.
 */
export function ItemError({ children, className = "" }) {
    if (!children) return null;
    return (
        <p role="alert" className={`${itemErrorClass} ${className}`}>
            {children}
        </p>
    );
}

/**
 * 🚨 A SWITCH AND THE FIELD IT CONTROLS ARE ONE OBJECT.
 *
 * An optional setting on an item form is a card that carries its own switch and
 * reveals its input when that switch is on. The layout this replaced put a bare
 * checkbox beside a label, and the input it governed appeared further down the
 * form out of nowhere — so on a phone, where the two were rarely on screen
 * together, turning something on made an unexplained field materialise.
 *
 * ⚠️ THE WHOLE CARD IS THE LABEL. `htmlFor` makes the title, the hint and the
 * padding around them all hit the checkbox, which on a touch screen is the
 * difference between a 20px target and a 300px one.
 *
 * ⚠️ CHILDREN RENDER ONLY WHEN IT IS ON, and are OUTSIDE the `<label>`. An
 * `<input>` nested inside a label whose `htmlFor` points at the checkbox has its
 * own clicks forwarded to that checkbox — so typing in the box would toggle the
 * switch that reveals it.
 *
 * ⚠️ House rules this follows, each of which has its own note above: radius from
 * the tokens (`rounded-box` / `rounded-box-sm`, never the named scale, which is
 * overridden in this project); NO shadow — the frame is the border; no scale on
 * interaction; and `border-black` is a full 2px `border` SHORTHAND here, so a
 * width class beside it is silently discarded and none is written.
 */
export function OptionCard({ id, title, hint, checked, onChange, children }) {
    return (
        <div
            className={`rounded-box border-black transition-colors duration-150 motion-reduce:transition-none ${
                checked ? "bg-[#F2FBF5]" : "bg-white"
            }`}
        >
            <label
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 p-4"
            >
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className={`mt-0.5 cursor-pointer ${itemCheckboxClass}`}
                />
                <span className="min-w-0">
                    <span className="block text-sm font-black text-black">
                        {title}
                    </span>
                    {hint && (
                        <span className={`mt-1 block ${itemHintClass}`}>
                            {hint}
                        </span>
                    )}
                </span>
            </label>

            {checked && children && (
                <div className="border-t-2 border-black/10 px-4 pb-4 pt-3">
                    {children}
                </div>
            )}
        </div>
    );
}
