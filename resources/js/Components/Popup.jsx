import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

/**
 * Every panel in the app.
 *
 * 🚨 FULL-SCREEN AT EVERY WIDTH, AND NOTHING IS PINNED BUT THE CLOSE CONTROL
 * (client direction, 12 Sep 2026). This is the same surface `Sheet` draws for
 * the listing forms, and the same language the "You're all set" moment is
 * written in — one cream ground, one scroll, a close button and then the work.
 *
 * What it replaced, and why none of it is coming back:
 *  - **A pink band with three "traffic light" dots.** That is a drawing of a
 *    desktop WINDOW, and this ships as an installable PWA where the panel is
 *    the screen. Edge to edge at 1440px it was also a wall of accent colour
 *    standing in for a heading, which the house rule spends on the one action
 *    instead.
 *  - **A centred card from `md` up.** A small card floating on a dimmed page is
 *    the clearest tell that you are looking at a website rather than an app,
 *    and it meant one component had two layouts — so a panel that read well on
 *    a phone routinely did not on a laptop, and nobody found out until a
 *    screenshot.
 *  - **A per-caller `space` padding and a `size` modal width.** Both are now
 *    the panel's own, so thirty-eight callers cannot each answer "how much room
 *    does a panel have" differently.
 *
 * ⚠️ Props kept for compatibility and now INERT: `hidecontrols` (there is no
 * band to hide), `space` (the panel owns its padding), `bodyclass`. They are
 * accepted rather than removed so this change is one file rather than
 * thirty-nine, and a caller still passing one is not a bug.
 *
 * ⚠️ `modalclass` still lands on the panel, so a caller may override the
 * ground. 🚨 Note `pinkmodal` — passed by 27 call sites — is defined in NO
 * stylesheet in this project and never has been; it styles nothing. Do not
 * "restore" a pink panel background on the strength of seeing that class.
 */
export default function Popup(props) {
  const {
    children,
    text,
    classes,
    action,
    hidecontrols, // inert — see the docblock
    hideclose,
    size,
    space, // inert — see the docblock
    modalclass,
    bodyclass,
    fullscreen,
    title,
    dismissable,
  } = props;
  void hidecontrols;
  void space;

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (action === true) {
      setOpen(true);
    } else if (action === false) {
      setOpen(false);
    }
  }, [action]);

  const closeModal = () => {
    // An onHide that returns false vetoes the close — used by forms to confirm
    // before discarding unsaved input. Returning undefined keeps old behaviour.
    if (props.onHide && props.onHide() === false) return;
    setOpen(false);
  };

  /**
   * 🚨 THE BOTTOM BAR MUST NOT PAINT OVER AN OPEN PANEL. The bar is
   * `position: fixed; z-index: 999999` and this Dialog is `z-[9995]`, so on a
   * phone the bar sat on top of the panel and ate whatever was at the bottom of
   * it, which on a form is the submit button.
   *
   * `body.sheet-open` is the EXISTING mechanism (`app.css` hides
   * `.retro-bottom-bar` and drops the page's bar clearance while it is set).
   * Reusing it rather than raising this z-index keeps one answer to "who hides
   * the nav".
   *
   * ⚠️ Scroll is locked at the same time, or the page behind scrolls under the
   * panel whenever its content is shorter than the screen.
   * ⚠️ Nested popups share one body class, so an inner one closing un-hides the
   * bar while the outer is still open. Rare here, and the same caveat `Sheet`
   * carries — worth knowing before nesting two.
   */
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("sheet-open");
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("sheet-open");
    };
  }, [open]);

  /**
   * `size` is a READING MEASURE now, not a modal width — the panel is always
   * the whole screen, and this is how wide the column of content inside it is
   * allowed to get. A 1400px-wide form field is unreadable and looks unfinished.
   *
   * ⚠️ Literal strings per size. Tailwind's JIT only reads class names it can
   * see in the source, so a computed `max-w-${size}` emits no CSS at all and
   * every panel would silently stretch to full width.
   */
  const measure =
    {
      sm: "max-w-lg",
      md: "max-w-2xl",
      lg: "max-w-3xl",
      xl: "max-w-4xl",
    }[size] || "max-w-2xl";

  return (
    <>
      {typeof text !== "undefined" && (
        <button onClick={() => setOpen(true)} className={`font-cera-medium ${classes}`}>
          {text}
        </button>
      )}
      <Transition appear show={open} as={Fragment}>
        {/* 🚨 Esc and the backdrop are dead unless a caller opts in with
            `dismissable`. Headless UI routes both gestures through this one
            prop, and it was `() => {}` — so a Popup could only ever be left
            through its own X, which is a keyboard trap.

            ⚠️ It is OPT-IN rather than the default, and deliberately: six of
            the thirty-eight callers are payment checkouts and two are OTP
            steps, where a stray backdrop tap would throw away a part-entered
            payment or a code that has already been sent. `dismissable` goes on
            panels that either hold nothing worth losing or pass an `onHide`
            dirty guard — `closeModal` honours that veto, so a form confirms
            before it discards. Give the rest Esc only once each has a guard. */}
        <Dialog
          as="div"
          className="relative z-[9995]"
          onClose={dismissable ? closeModal : () => {}}
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
            {/* bottom-bar-safe: Popup sets body.sheet-open while open (see the effect above) */}
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* bottom-bar-safe: Popup sets body.sheet-open while open (see the effect above) */}
          <div className="fixed inset-0 flex items-stretch justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              /* ⚠️ No `scale` anywhere now. The panel is the whole viewport at
                 every width, and scaling a full-screen surface reads as the page
                 zooming rather than as a sheet arriving. */
              enterFrom="opacity-0 translate-y-full md:translate-y-0"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-full md:translate-y-0"
            >
              {/* ⚠️ `!rounded-none !border-0` carry `!` and that is load-bearing
                  rather than defensive. Callers pass their own frame through
                  `modalclass` (several say `border-2 border-black`), and
                  `index.css` redefines `.border-black` as a full `border`
                  shorthand AFTER the utilities layer — so an unflagged reset
                  loses on source order and a full-screen panel keeps a stray
                  frame and rounded corners hard against the screen edge.

                  ⚠️ `data-sheet-scroll` marks the scroll container, matching
                  `Sheet` — anything that needs to scroll a panel back to the top
                  looks for that handle, because the PANEL is the scroller here
                  and `window.scrollTo` is a no-op. */}
              <Dialog.Panel
                data-sheet-scroll
                className={`customScrollbar mymodal relative h-dvh w-full overflow-y-auto overscroll-contain bg-[#FFF6EC] text-left !rounded-none !border-0 ${
                  fullscreen ? "flex flex-col overflow-hidden" : ""
                } ${modalclass || ""}`}
                onClick={(event) => event.stopPropagation()}
              >
                {/* 🚨 A Dialog with no `Dialog.Title` is announced unnamed — a
                    screen reader says "dialog" and nothing else. Panels draw
                    their own visual heading, so the name is carried
                    visually-hidden rather than printed twice. */}
                {title ? <Dialog.Title className="sr-only">{title}</Dialog.Title> : null}

                {!hideclose && (
                  /* 🚨 THE ONE FIXED ELEMENT. `fixed`, not `sticky`: the panel
                     is the scroll container, and a sticky child of a scroller
                     reserves a row in the flow — which is the header bar this
                     replaced, wearing a different word. It sits on the LEFT so a
                     right-handed thumb cannot reach it by accident while
                     scrolling, and it is opaque so it stays legible over
                     whatever passes beneath. */
                  <button
                    onClick={closeModal}
                    aria-label="Close"
                    className="fixed left-4 z-20 grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white text-black transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 motion-reduce:transition-none md:left-6"
                    style={{ top: "max(1rem, env(safe-area-inset-top))" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}

                {/* 🚨 `fullscreen` STILL MEANS "THE CHILD OWNS THE LAYOUT", and
                    that is why it survives a change that made every panel
                    full-screen. Two callers (the post composer, the setup
                    celebration) build their own scrolling column and their own
                    footer inside it; handing them a padded, centred, separately
                    scrolling column would break both. Everything else gets the
                    standard measure below. */}
                {fullscreen ? (
                  <div className={`flex min-h-0 w-full flex-1 flex-col ${bodyclass || ""}`}>
                    {children}
                  </div>
                ) : (
                  /* ⚠️ The top padding CLEARS the close button rather than being
                     a guess: a 44px control, its own inset, and breathing room.
                     The bottom inset is ADDED to the padding, never max()'d
                     against it — a device with a home indicator gets clearance on
                     top of the space, not instead of it. */
                  <div
                    className={`mx-auto w-full px-5 md:px-8 ${measure} ${bodyclass || ""}`}
                    style={{
                      paddingTop: "calc(env(safe-area-inset-top) + 5rem)",
                      paddingBottom: "calc(env(safe-area-inset-bottom) + 3rem)",
                    }}
                  >
                    {children}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
