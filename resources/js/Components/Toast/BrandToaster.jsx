import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import BrandToast from './BrandToast';

/*
 * Below this width the toast is centred; at or above it, it sits top-right
 * (client direction, 14 Aug 2026). Matches Tailwind's `md`, which is the
 * breakpoint the rest of the app treats as "phone vs not".
 */
const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * ⚠️ react-hot-toast's `position` is a plain prop, NOT a CSS class, so it
 * cannot be made responsive with a `md:` variant — the placement has to be
 * decided in JS and re-decided when the viewport changes.
 *
 * ⚠️ Read once during the initial state so the first paint is already correct.
 * Defaulting to one value and correcting in an effect makes a toast fired on
 * page load visibly jump across the screen.
 */
const useIsDesktop = () => {
    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return true;
        return window.matchMedia(DESKTOP_QUERY).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const mq = window.matchMedia(DESKTOP_QUERY);
        const onChange = (e) => setIsDesktop(e.matches);

        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return isDesktop;
};

/**
 * The ONE toast mount for the whole website app.
 *
 * 🚨 Mount this exactly once per layout and never render a second `<Toaster>`
 * anywhere else. Two mounts means every toast is drawn twice, and because both
 * copies animate and dismiss independently it reads as a rendering bug rather
 * than as duplicate configuration. Before this component there were two mounts
 * with two DIFFERENT configs (the authenticated layout carried react-hot-toast's
 * `#713200` brown docs sample), so the same message looked like a different
 * product depending on whether the visitor was signed in.
 *
 * 🚨 The `children` render function is what brands EVERY toast, including the
 * 122 raw `toast.success(...)` / `toast.error(...)` call sites that know nothing
 * about `useAlerts()`. Styling via `toastOptions.style` instead would have left
 * all of those on the library's default white card.
 *
 * ⚠️ ONE exception, and it is a library rule we cannot override: the Toaster
 * renders `t.type === 'custom'` toasts by drawing their message directly and
 * SKIPS this renderer entirely. So `toast.custom()` is unbranded by
 * construction — use `toast()` / `toast.success()` / `toast.error()`, or
 * `useAlerts()`, and never `toast.custom()` for a normal notice.
 */
export default function BrandToaster() {
    const isDesktop = useIsDesktop();

    return (
        <Toaster
            position={isDesktop ? 'top-right' : 'top-center'}
            gutter={12}
            containerStyle={{
                /*
                 * ⚠️ The site header is FIXED (~75px, and `includes/Header.jsx`
                 * renders its own 75px spacer below it). The library's default
                 * `top: 16` puts the toast underneath the header, where it
                 * covers the nav and is itself half-hidden. 88px clears it.
                 *
                 * The `max()` keeps it clear of the notch in standalone PWA
                 * mode, where `env(safe-area-inset-top)` is non-zero and the
                 * header sits lower.
                 */
                top: 'max(88px, calc(env(safe-area-inset-top) + 84px))',
                left: 16,
                right: 16,
                bottom: 16,
            }}
            toastOptions={{
                duration: 4500,
                /*
                 * The enter/exit transition in BrandToast is 300ms. `removeDelay`
                 * is how long the library keeps a dismissed toast mounted, so it
                 * must outlast that or the card is torn out of the DOM mid-fade.
                 */
                removeDelay: 400,
            }}
        >
            {(t) => <BrandToast toast={t} />}
        </Toaster>
    );
}
