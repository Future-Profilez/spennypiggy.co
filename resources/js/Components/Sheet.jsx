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
    size = "xl",
    initialFocus,
}) {
    const fallbackFocus = useRef(null);

    const maxWidth =
        {
            md: "md:max-w-md",
            lg: "md:max-w-lg",
            xl: "md:max-w-xl",
            "2xl": "md:max-w-2xl",
            "3xl": "md:max-w-3xl",
            "4xl": "md:max-w-4xl",
        }[size] || "md:max-w-3xl";

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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-stretch justify-center md:items-center md:p-6">
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
                            // Mobile: a true full-screen surface (full width AND
                            // height, no rounded top, no gap), so an add-item
                            // form feels like a native screen rather than a card
                            // floating on the page. Desktop stays a centred modal.
                            className={`flex h-dvh w-full flex-col overflow-hidden border-[3px] border-black bg-white md:h-auto md:max-h-[88dvh] md:rounded-box md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] ${maxWidth}`}
                        >
                            <header className="relative shrink-0 bg-[#FF007F] px-5 pb-4 text-white" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
                                {/* Decorative sheet handle — kept for the
                                    familiar bottom-sheet look on mobile. */}
                                <div
                                    className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/70 md:hidden"
                                    aria-hidden="true"
                                />
                                <div className="flex items-start gap-3 pr-12">
                                    <div className="min-w-0 flex-1">
                                        <Dialog.Title className="truncate text-left text-lg font-black uppercase tracking-wide">
                                            {title}
                                        </Dialog.Title>
                                        {subtitle && (
                                            <p className="mt-0.5 text-left text-xs font-semibold text-white/80">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    ref={fallbackFocus}
                                    onClick={requestClose}
                                    aria-label="Close"
                                    className="absolute right-4 top-3 grid h-11 w-11 place-items-center rounded-full border-[3px] border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[1px] active:translate-y-[1px] md:top-4"
                                >
                                    <X size={18} strokeWidth={3} />
                                </button>
                                {header}
                            </header>

                            <div className="customScrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
                                {children}
                            </div>

                            {footer && (
                                <footer
                                    className="shrink-0 border-t-[3px] border-black bg-white px-5 py-4"
                                    style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
                                >
                                    {footer}
                                </footer>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
