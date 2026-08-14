import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import '../../css/pull-to-refresh.css';

/**
 * Pull-to-refresh, PWA (standalone) only — a browser tab already has its own.
 *
 * 🚨 THIS FIRED ON ALMOST ANY DOWNWARD TOUCH. Three separate causes, all fixed
 * below; keep every guard:
 *
 *  1. `touchstart` only recorded the finger position when `scrollY === 0`, but
 *     `touchmove` ran on any move that FOUND `scrollY === 0`. So a normal scroll
 *     up from mid-page reached the top mid-gesture and was then measured against
 *     a start position left over from an EARLIER touch — an instant "pull" of
 *     hundreds of pixels, and a refresh. A gesture now only counts if it was
 *     claimed at `touchstart`, and the claim is dropped on every end/cancel.
 *  2. There was no direction test, so a horizontal or diagonal swipe with enough
 *     downward drift counted as a pull.
 *  3. `preventDefault()` was called after 5px, which captured the gesture before
 *     anyone could have meant it.
 *
 * The pull is also deliberately LONG and rubbery now: the indicator travels at
 * roughly half the speed of the finger, so reaching the trigger takes ~170px of
 * real travel. A refresh throws away what is on screen — it should cost a
 * deliberate gesture, never a twitch.
 */

// The finger must start in the top part of the screen. A drag begun with the
// thumb resting at the bottom of a phone is someone scrolling, not refreshing.
const START_ZONE = 0.6;
// Nothing happens — and the gesture is NOT captured — below this. Under it the
// browser keeps the touch and the page behaves normally.
const ACTIVATE_PX = 24;
// Damping. The indicator moves slower than the finger, which is what makes the
// pull feel long and gives an obvious point of no return.
const RESISTANCE = 0.55;
// Travel (after damping) needed to arm the refresh.
const THRESHOLD_PX = 80;
const MAX_PX = 150;
// A pull is vertical. Anything flatter than this belongs to a carousel or a
// horizontally scrolling tab strip.
const VERTICAL_RATIO = 1.5;

export default function PullToRefresh() {
    // ⚠️ State, not a ref: the standalone check used to live in a ref set inside
    // the effect, so the first render returned null and nothing re-rendered to
    // put the indicator back.
    const [isStandalone, setIsStandalone] = useState(false);
    const [phase, setPhase] = useState('idle'); // idle | pull | ready | refresh

    const barRef = useRef(null);
    // ⚠️ Everything the listeners read lives in refs, so the effect can register
    // ONCE. It used to list `pullDistance` in its deps and therefore tore down
    // and re-attached three document listeners on every touchmove frame.
    const g = useRef({ active: false, startY: 0, startX: 0, travel: 0, refreshing: false });

    useEffect(() => {
        setIsStandalone(
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://'),
        );
    }, []);

    useEffect(() => {
        if (!isStandalone) return;

        const paint = () => {
            if (!barRef.current) return;
            barRef.current.style.transform =
                `translateX(-50%) translateY(${g.current.travel}px)`;
        };

        const reset = () => {
            g.current.active = false;
            g.current.travel = 0;
            paint();
            setPhase('idle');
        };

        const onStart = (e) => {
            if (g.current.refreshing || e.touches.length !== 1) return;
            // Both halves matter: the PAGE must be at the top, and the FINGER must
            // be in the top part of the screen.
            if (window.scrollY > 0) return;
            const t = e.touches[0];
            if (t.clientY > window.innerHeight * START_ZONE) return;

            g.current.active = true;
            g.current.startY = t.clientY;
            g.current.startX = t.clientX;
            g.current.travel = 0;
        };

        const onMove = (e) => {
            if (!g.current.active || g.current.refreshing) return;
            // Scrolled away, or a second finger landed — this is no longer a pull.
            if (window.scrollY > 0 || e.touches.length !== 1) {
                reset();
                return;
            }

            const t = e.touches[0];
            const dy = t.clientY - g.current.startY;
            const dx = Math.abs(t.clientX - g.current.startX);

            if (dy <= 0) {
                // Pulling back up: let go of the gesture entirely rather than
                // holding it captive for the rest of the touch.
                if (g.current.travel > 0) reset();
                return;
            }
            if (dy < ACTIVATE_PX) return;          // not yet ours
            if (dy < dx * VERTICAL_RATIO) return;  // sideways: not a pull

            // Only now do we take the gesture off the browser.
            if (e.cancelable) e.preventDefault();

            g.current.travel = Math.min((dy - ACTIVATE_PX) * RESISTANCE, MAX_PX);
            paint();
            setPhase(g.current.travel >= THRESHOLD_PX ? 'ready' : 'pull');
        };

        const onEnd = () => {
            if (!g.current.active || g.current.refreshing) return;

            if (g.current.travel < THRESHOLD_PX) {
                reset();
                return;
            }

            g.current.refreshing = true;
            g.current.active = false;
            g.current.travel = THRESHOLD_PX;
            paint();
            setPhase('refresh');

            const done = () => {
                g.current.refreshing = false;
                reset();
            };
            router.reload({ onFinish: done, onError: done });
        };

        // touchstart is passive: it only reads. touchmove is not, because it may
        // call preventDefault once the pull is genuinely under way.
        document.addEventListener('touchstart', onStart, { passive: true });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('touchcancel', reset);

        return () => {
            document.removeEventListener('touchstart', onStart);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            document.removeEventListener('touchcancel', reset);
        };
    }, [isStandalone]);

    if (!isStandalone) return null;

    const label = phase === 'refresh' ? 'Refreshing'
        : phase === 'ready' ? 'Release to refresh'
        : 'Keep pulling';

    return (
        <div
            ref={barRef}
            aria-live="polite"
            className="ptr-indicator"
            data-phase={phase}
            style={{ transform: 'translateX(-50%) translateY(0px)' }}
        >
            <span className="ptr-spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}
