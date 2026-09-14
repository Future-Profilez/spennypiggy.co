import { Fragment } from 'react';
import useHideBottomBar from "@/hooks/useHideBottomBar";
import { Dialog, Transition } from '@headlessui/react';

/**
 * The second panel primitive, and now the same surface as `Popup` and `Sheet`.
 *
 * 🚨 FULL-SCREEN AT EVERY WIDTH, NOTHING PINNED BUT THE CLOSE CONTROL (client
 * direction, 12 Sep 2026). This used to be a centred card with a grey backdrop
 * — the clearest tell that you are looking at a website rather than an app, on
 * a product that ships as an installable PWA — and it meant the app had three
 * panel languages at once depending on which primitive a screen reached for.
 *
 * ⚠️ `variant` is INERT now (there is one layout) and is accepted only so this
 * change stays one file rather than nine. `maxWidth` survives and has changed
 * meaning: it is the READING MEASURE of the column inside the panel, not the
 * width of a card.
 *
 * ⚠️ Children keep their own padding and, in several cases, their own white
 * card — `ConfirmDestructive` draws `bg-white rounded-box border-[3px]`. That
 * is correct on this ground and is why the column adds no padding of its own
 * beyond clearing the close button.
 */
export default function Modal({ children, show = false, maxWidth = '2xl', closeable = true, onClose = () => {}, variant = 'card' }) {
    void variant;

    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    /*
     * 🚨 The bottom bar is z 999999 and this Dialog is z-50, so on a phone the
     * bar painted over the foot of the panel — which on every form this hosts
     * (FeatureSuggestionModal, DeleteUserForm, ConfirmDestructive…) is the
     * submit row. Same mechanism Popup and Sheet use; see the hook.
     */
    useHideBottomBar(show);

    /**
     * ⚠️ Literal strings per size. Tailwind's JIT only reads class names it can
     * see in the source, so a computed `max-w-${maxWidth}` emits no CSS at all
     * and every panel would stretch to the full width of the screen.
     */
    const measure = {
        sm: 'max-w-lg',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-3xl',
        '2xl': 'max-w-3xl',
    }[maxWidth] || 'max-w-2xl';

    return (
        <Transition show={show} as={Fragment} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                // bottom-bar-safe: useHideBottomBar(show) hides the bar while open
                className="popupmodal fixed inset-0 z-50 flex items-stretch justify-center"
                onClose={close}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-black/50" />
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    /* ⚠️ No scale. The panel is the whole viewport, and scaling a
                       full-screen surface reads as the page zooming rather than
                       as a sheet arriving. */
                    enterFrom="opacity-0 translate-y-full sm:translate-y-0"
                    enterTo="opacity-100 translate-y-0"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-full sm:translate-y-0"
                >
                    {/* ⚠️ `data-sheet-scroll` marks the scroll container, matching
                        `Sheet` and `Popup` — the PANEL is the scroller here, so
                        `window.scrollTo` is a no-op and anything needing to scroll
                        a panel back to the top looks for that handle. */}
                    <Dialog.Panel
                        data-sheet-scroll
                        className="customScrollbar relative h-dvh w-full overflow-y-auto overscroll-contain bg-[#FFF6EC] text-left"
                    >
                        {closeable && (
                            /* 🚨 THE ONE FIXED ELEMENT — `fixed`, not `sticky`: a
                               sticky child of a scroller reserves a row in the
                               flow, which is the header bar this language
                               removed, wearing a different word. Left-hand side,
                               so a right-handed thumb cannot reach it by accident
                               while scrolling.

                               ⚠️ Gated on `closeable`, which is what
                               `TermsUpdatePopup` uses to make its panel
                               unskippable — a close control there would be a way
                               past a consent the account has to give. */
                            <button
                                type="button"
                                onClick={close}
                                aria-label="Close"
                                className="fixed left-4 z-20 grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white text-black transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 motion-reduce:transition-none md:left-6"
                                style={{ top: "max(1rem, env(safe-area-inset-top))" }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}

                        {/* ⚠️ The top padding CLEARS the close button rather than
                            being a guess: a 44px control, its own inset, and
                            breathing room. It is applied whether or not the button
                            renders, so an unskippable panel does not open at a
                            different height from every other one.
                            ⚠️ The bottom inset is ADDED to the padding, never
                            max()'d against it — a device with a home indicator
                            gets clearance on top of the space, not instead of it.
                            ⚠️ Horizontal padding only below `sm`: children carry
                            their own from there, and several draw their own card. */}
                        <div
                            className={`mx-auto w-full px-4 sm:px-6 ${measure}`}
                            style={{
                                paddingTop: "calc(env(safe-area-inset-top) + 5rem)",
                                paddingBottom: "calc(env(safe-area-inset-bottom) + 3rem)",
                            }}
                        >
                            {children}
                        </div>
                    </Dialog.Panel>
                </Transition.Child>
            </Dialog>
        </Transition>
    );
}
