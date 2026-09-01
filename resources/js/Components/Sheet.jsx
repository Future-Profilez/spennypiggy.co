import { Fragment, useCallback, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

/**
 * The creation surface for every sellable item.
 *
 * On a phone this is a true full-screen surface — full width and height, no
 * rounded top, no gap. The app ships as an installable PWA, and a small centred
 * card floating on a dimmed page is the single clearest tell that you are
 * looking at a website rather than an app. On a desktop it is a centred modal,
 * wide enough to show the form and a live preview side by side.
 *
 * Behaviour that the old Popup lacked and every form had to improvise:
 *  - the body cannot scroll behind the sheet;
 *  - the header and footer stay put while only the body scrolls, so the
 *    primary action is always reachable without scrolling to the end of a long
 *    form;
 *  - iOS safe areas are respected on both edges;
 *  - `onHide` may return false to veto a close (unsaved-changes guard).
 */
export default function Sheet({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    header = null,
    headerAction = null,
    size = "xl",
    initialFocus,
}) {
    const fallbackFocus = useRef(null);

    // `size` is accepted and ignored: the sheet is full-page now, and the inner
    // content is what constrains its own measure. Kept in the signature so the
    // half-dozen call sites that still pass it do not have to change.
    void size;

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
        // bottom navigation must not sit on top of its footer — the CONTINUE
        // button was landing behind the tab bar. Native apps hide the tab bar
        // inside a full-screen sheet for the same reason. Driven by a body
        // class (see resources/css/app.css) so no component needs a prop.
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

                {/* ⚠️ Full page at EVERY size, matching the post composer.
                    Selling something is the creator's main job, and it was being
                    done in a `max-w-3xl` card capped at 88dvh — a stepped form
                    with a preview column, a validation notice and a footer CTA
                    all competing for a box two-thirds the height of the screen,
                    with its own scrollbar inside the page's. */}
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
                        <Dialog.Panel
                            className="flex h-dvh w-full flex-col overflow-hidden bg-[#F2EFE7]"
                        >
                            {/* Black bar, same as the composer: this panel owns
                                the whole screen, and a pink header edge-to-edge
                                at 1440px is a wall of accent colour rather than a
                                heading. Colour stays on the step meter and the
                                CTA, where it means something. */}
                            <header className="relative shrink-0 bg-black px-4 pb-4 text-white sm:px-6" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
                                <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
                                    <button
                                        type="button"
                                        ref={fallbackFocus}
                                        onClick={requestClose}
                                        aria-label="Close"
                                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                                    >
                                        <X size={18} strokeWidth={3} />
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <Dialog.Title className="truncate text-left font-GillSans text-lg uppercase leading-none tracking-wide sm:text-2xl">
                                            {title}
                                        </Dialog.Title>
                                        {subtitle && (
                                            <p className="mt-1 truncate text-left text-[12px] font-black uppercase tracking-[0.16em] text-white/60">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>

                                    {/* The primary action, kept at the top where
                                        it is reachable without scrolling past the
                                        whole form. The same action repeats at the
                                        end of the flow; neither is pinned. */}
                                    {headerAction}
                                </div>
                                {header && (
                                    <div className="mx-auto mt-3 w-full max-w-6xl">{header}</div>
                                )}
                            </header>

                            {/* ⚠️ The footer scrolls WITH the form; it is not
                                pinned. A fixed bar here overlaid the last option
                                in the list — the tier picker's final row was cut
                                in half by it — and on a phone it also stacked on
                                top of the app's own fixed bottom navigation. */}
                            <div
                                className="customScrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 md:py-8"
                                style={{ paddingBottom: "max(7rem, env(safe-area-inset-bottom))" }}
                            >
                                <div className="mx-auto w-full max-w-6xl">
                                    {children}

                                    {footer && <div className="mt-6">{footer}</div>}
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
