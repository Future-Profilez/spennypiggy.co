import { Fragment, useCallback, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

/**
 * The creation surface for every sellable item.
 *
 * 🚨 NOTHING IS PINNED BUT THE CLOSE CONTROL (client direction, 12 Sep 2026).
 * This used to be a three-part frame — a header bar that owned the title, the
 * step meter and a repeated primary action, a scrolling middle, and a footer —
 * and on a phone that chrome ate ~190px before the first field. The whole panel
 * is ONE scroll now, drawn like the "You're all set" moment: cream ground,
 * eyebrow, display headline, then the work. The close button is the single
 * fixed element, because it is the only control a person needs to reach at any
 * point in a form they have not finished.
 *
 * What that buys, and what it costs: every pixel of height goes to the form,
 * and the primary action is at the END of the flow rather than repeated at the
 * top. That is the right trade for a stepped form — each step is short, and a
 * CTA you can press before reading the step is a CTA that produces a validation
 * error instead of a listing.
 *
 * Behaviour kept from the old sheet:
 *  - the body cannot scroll behind it;
 *  - the app's fixed bottom navigation is hidden while it is open (body.sheet-open);
 *  - iOS safe areas are respected on both edges;
 *  - `onClose` may return false to veto a close (unsaved-changes guard).
 *
 * @param {"2xl"|"4xl"} size  the reading measure. `4xl` is for a form that ships
 *   a side preview; everything else is held to a single readable column.
 */
export default function Sheet({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    header = null,
    size = "2xl",
    initialFocus,
}) {
    const fallbackFocus = useRef(null);

    // ⚠️ `size` is a MEASURE, not a modal width — the panel is always the whole
    // screen. It exists so the headline, the eyebrow and the form all sit on one
    // left edge: a title held to 2xl above a form spread to 5xl reads as two
    // unrelated blocks.
    const measure = size === "4xl" ? "max-w-5xl" : "max-w-2xl";

    // An onClose that returns false vetoes the dismissal — forms use it to
    // confirm before discarding input.
    const requestClose = useCallback(() => {
        if (onClose && onClose() === false) return false;
        return true;
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        // A full-screen sheet owns the whole viewport, so the app's fixed
        // bottom navigation must not sit on top of its last control. Native
        // apps hide the tab bar inside a full-screen sheet for the same reason.
        // Driven by a body class (see resources/css/app.css) so no component
        // needs a prop.
        document.body.classList.add("sheet-open");
        return () => {
            document.body.style.overflow = previous;
            document.body.classList.remove("sheet-open");
        };
    }, [open]);

    return (
        <Transition appear show={!!open} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-[9995]"
                onClose={requestClose}
                initialFocus={initialFocus || fallbackFocus}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    {/* bottom-bar-safe: Sheet sets body.sheet-open while open */}
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" />
                </Transition.Child>

                {/* bottom-bar-safe: Sheet sets body.sheet-open while open */}
                <div className="fixed inset-0 flex items-stretch justify-center">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-250"
                        enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
                        enterTo="opacity-100 translate-y-0 md:scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0 md:scale-100"
                        leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
                    >
                        {/* ⚠️ `data-sheet-scroll` is the handle `ItemFormShell`
                            scrolls to the top on a step change. The panel IS the
                            scroll container, so `window.scrollTo` is a no-op
                            here and the reader would be left at the foot of the
                            step they just finished. */}
                        <Dialog.Panel
                            data-sheet-scroll
                            className="customScrollbar relative h-dvh w-full overflow-y-auto overscroll-contain bg-[#FFF6EC]"
                        >
                            {/* 🚨 THE ONE FIXED ELEMENT. `fixed`, not `sticky`:
                                the panel itself is the scroll container, and a
                                sticky child of a scroller reserves a row in the
                                flow — which is the header bar this replaced,
                                wearing a different word. It sits on the LEFT so
                                a right-handed thumb cannot reach it by accident
                                while scrolling a long form, and it is opaque so
                                it stays legible over whatever scrolls beneath. */}
                            <button
                                type="button"
                                ref={fallbackFocus}
                                onClick={requestClose}
                                aria-label="Close"
                                className="fixed left-4 z-20 grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white text-black transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 motion-reduce:transition-none md:left-6"
                                style={{ top: "max(1rem, env(safe-area-inset-top))" }}
                            >
                                <X size={18} strokeWidth={3} />
                            </button>

                            {/* ⚠️ The top padding CLEARS the close button rather
                                than being a guess: 44px control + its own inset
                                + breathing room. The bottom inset is ADDED to
                                the padding, never max()'d against it — a device
                                with a home indicator gets clearance on top of
                                the space, not instead of it. */}
                            <div
                                className={`mx-auto flex w-full flex-col px-5 md:px-8 ${measure}`}
                                style={{
                                    paddingTop: "calc(env(safe-area-inset-top) + 5rem)",
                                    paddingBottom: "calc(env(safe-area-inset-bottom) + 3rem)",
                                }}
                            >
                                {/* The eyebrow slot — the step rail lives here,
                                    above the headline, the way the setup-complete
                                    panel carries its state pill. */}
                                {header && <div className="mb-4">{header}</div>}

                                <Dialog.Title className="font-gulfs text-[32px] uppercase leading-[1.05] text-black md:text-[46px]">
                                    {title}
                                </Dialog.Title>

                                {subtitle && (
                                    <p className="mt-3 text-base font-bold leading-[1.55] text-black/70 md:text-lg">
                                        {subtitle}
                                    </p>
                                )}

                                <div className="mt-7">{children}</div>

                                {footer && <div className="mt-8">{footer}</div>}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
