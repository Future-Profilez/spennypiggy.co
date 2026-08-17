import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';

export default function Popup(props) {
  // `hideclose`: for panels that render their own close control in their own
  // header — the floating circle would otherwise land on top of it.
  const { children, text, classes, action, hidecontrols, hideclose, size, space, modalclass, bodyclass, fullscreen } = props;
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (action === true) {
      setOpen(true)
    } else if (action === false) {
      setOpen(false)
    }
  }, [action])

  const closeModal = () => {
    // An onHide that returns false vetoes the close — used by forms to confirm
    // before discarding unsaved input. Returning undefined keeps old behaviour.
    if (props.onHide && props.onHide() === false) return
    setOpen(false)
  }

  /**
   * 🚨 THE BOTTOM BAR MUST NOT PAINT OVER AN OPEN PANEL. The bar is
   * `position: fixed; z-index: 999999` and this Dialog is `z-[9995]`, so on a
   * phone — where the panel is now the whole viewport — the bar sat on top of it
   * and ate whatever was at the bottom of the sheet, which on a form is the
   * submit button. Reported as "content is hidden behind the bottom bar".
   *
   * `body.sheet-open` is the EXISTING mechanism for this (`app.css` hides
   * `.retro-bottom-bar` and drops the page's bar clearance while it is set);
   * `Sheet.jsx` has always used it and Popup never opted in. Reusing it rather
   * than raising this z-index keeps one answer to "who hides the nav".
   *
   * ⚠️ Scroll is locked at the same time, or the page behind scrolls under the
   * sheet whenever the panel's own content is shorter than the screen.
   * ⚠️ Nested popups share one body class, so an inner one closing un-hides the
   * bar while the outer is still open. Rare here, and the same caveat `Sheet`
   * already carries — worth knowing before nesting two.
   */
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('sheet-open');
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('sheet-open');
    };
  }, [open]);

  /**
   * 🚨 EVERY POPUP IS FULL-SCREEN ON A PHONE (client direction). A centred card
   * floating on a dimmed page is the single clearest tell that you are looking at
   * a website rather than an app, and this ships as an installable PWA — the same
   * reasoning `Sheet.jsx` already carries.
   *
   * `fullscreen` (the explicit prop) still means full at EVERY width, which is
   * what the post composer wants. Without it a panel is now full-screen below
   * `md` and the old centred card from `md` up.
   *
   * ⚠️ The md: width must be a LITERAL string per size. Tailwind's JIT only reads
   * class names it can see in the source, so a computed `md:max-w-${size}` emits
   * no CSS at all and every desktop popup would silently stretch to full width.
   * Same trap as the documented `bg-[${accent}]` one.
   */
  const maxWidthClass = {
      'sm': 'md:max-w-sm',
      'md': 'md:max-w-md',
      'lg': 'md:max-w-lg',
      'xl': 'md:max-w-xl',
  }[size] || 'md:max-w-md';

  return <>
      {typeof text !== 'undefined' && (
        <button onClick={() => setOpen(true)} className={`font-cera-medium ${classes}`}>
          {text}
        </button>
      )}
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[9995]" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* ⚠️ `fullscreen` takes the whole viewport: no outer padding to inset
              the panel, no vertical centring to fight, and the panel — not this
              wrapper — owns the scroll. Nothing used this flag before, and its
              half-implemented version left a full-height panel inside a padded,
              centred, separately-scrolling box. */}
          <div
            className={`fixed inset-0 overflow-hidden ${
              fullscreen ? '' : 'md:overflow-y-auto'
            }`}
          >
            <div
              className={
                fullscreen
                  ? 'flex h-full w-full text-left'
                  : 'flex h-full w-full text-left md:min-h-full md:items-center md:justify-center md:p-4 md:text-center'
              }
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                /* ⚠️ No `scale` on the phone transition. The panel is the whole
                   viewport there, and scaling a full-screen surface reads as the
                   page zooming rather than as a sheet arriving. Desktop keeps the
                   scale, where the panel really is a small card. */
                enterFrom="opacity-0 md:scale-95"
                enterTo="opacity-100 md:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 md:scale-100"
                leaveTo="opacity-0 md:scale-95" >
                <Dialog.Panel
                  className={`w-full transform bg-white text-left transition-all ${modalclass} mymodal ${
                    fullscreen
                      ? 'flex h-[100dvh] max-w-none flex-col overflow-hidden'
                      /* ⚠️ The phone panel reaches the physical screen edge, so in
                         an installed PWA its first row sits under the status bar.
                         The inset is carried INSIDE the panel as padding, the same
                         way the bottom bar carries its own. It is a no-op on
                         desktop, where `env()` resolves to 0 and `md:pt-0` applies
                         anyway. */
                      /* ⚠️ `max-md:!rounded-none max-md:!border-0` carries `!`, and
                         that is load-bearing rather than defensive. Callers pass
                         their own frame through `modalclass` (most say
                         `border-2 border-black`), and `index.css` redefines
                         `.border-black` as a full `border` shorthand AFTER the
                         utilities layer — so an unflagged reset loses on source
                         order and the full-screen sheet keeps a stray frame and
                         rounded corners hard against the screen edge. */
                      : `flex h-[100dvh] max-w-none flex-col overflow-hidden pt-[env(safe-area-inset-top)] max-md:!rounded-none max-md:!border-0 md:block md:h-auto md:pt-0 md:align-middle md:rounded-box md:border-[3px] md:border-black ${maxWidthClass}`
                  }`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    className={`flex min-h-0 flex-1 flex-col ${
                      fullscreen ? '' : 'md:block md:min-h-0 md:flex-none md:p-0'
                    } ${bodyclass} `}
                  >
                    {/* 🚨 The three "traffic light" dots are a drawing of a desktop
                        WINDOW, and on a phone the panel is no longer a window — it
                        is the screen. Drawing them there re-asserts the metaphor
                        this sheet exists to remove, so they are desktop-only. The
                        pink band itself stays at every width: it is the sheet's
                        header, and it is what gives the close button something to
                        sit on instead of floating over the first line of content. */}
                    {!hidecontrols ?
 <div className='shrink-0 min-h-[56px] md:min-h-0 px-[30px] py-[20px] bg-[#FF007F] flex !border-l-0 !border-r-0 !border-t-0 border-b-[3px] border-black items-center '>
                        <span className=' border-black border-2 bg-red-500 mr-2 w-4 h-4 rounded-full hidden md:block'></span>
                        <span className=' border-black border-2 bg-yellow-400 mr-2 w-4 h-4 rounded-full hidden md:block'></span>
                        <span className=' border-black border-2 bg-green-400 mr-2 w-4 h-4 rounded-full hidden md:block'></span>
                    </div> : ''
                    }
                    {!hideclose && (
 <button
 onClick={closeModal}
 aria-label="Close"
 className='absolute right-4 top-3 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border-2 border-black rounded-full hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all'
                      // A panel that reaches the screen edge sits under the status bar
                      // in an installed PWA. That is now true of EVERY popup on a
                      // phone, not just `fullscreen` ones — so the inset is applied
                      // whenever the panel is edge-to-edge. `env()` resolves to 0 in a
                      // browser tab and on desktop, so the same value is safe there and
                      // the desktop modal is unaffected.
 style={{ top: 'max(0.75rem, calc(env(safe-area-inset-top) + 0.25rem))' }}
 >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    )}
                    {/* Fullscreen hands the scroll to the child so a form can keep
                        its own sticky footer on screen; the modal form caps its
                        height instead.
                        🚨 The 80dvh cap is scoped to `md:` — on a phone the panel
                        IS the viewport, so an 80% cap stops the content a fifth of
                        the screen short and leaves a dead band under it. The phone
                        grows into the panel and scrolls there instead.
                        ⚠️ The bottom padding clears the home indicator; a form's
                        last field otherwise ends underneath it. */}
                    <div
                      className={
                        fullscreen
                          ? 'flex min-h-0 flex-1 flex-col'
                          /* ⚠️ The home-indicator inset is `max-md:` rather than a
                             base class with an `md:` reset. Written the other way
                             round (`pb-[…] md:pb-0`) it silently strips the DESKTOP
                             modal's bottom padding, because `p-${space}` is the only
                             thing that was providing it — the last field then sits
                             flush against the panel edge at every width above md. */
                          : `p-${space || 0} flex min-h-0 flex-1 flex-col overflow-y-auto customScrollbar max-md:pb-[max(1rem,env(safe-area-inset-bottom))] md:block md:min-h-0 md:flex-none md:max-h-[80dvh]`
                      }
                    >
                       <div className={fullscreen ? 'flex min-h-0 w-full flex-1 flex-col' : 'w-full md:p-2'}> {children}</div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
}
