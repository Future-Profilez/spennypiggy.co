import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Thin strip at the top of the app while maintenance is imminent, or while this
 * viewer is only through the wall on a bypass token.
 *
 * Renders nothing in the normal case — `maintenance_notice` is null unless the
 * server has something to say, and the decision of what that is lives entirely in
 * HandleInertiaRequests::maintenanceNotice(). Nothing here derives state.
 *
 * Two audiences, two tones:
 *  - `scheduled` — a warning to a supporter who is about to lose a checkout
 *    halfway through. Amber, dismissible for this session.
 *  - `bypassing` — the site is DOWN for everyone else and this person cannot tell.
 *    Pink, and NOT dismissible: believing the wall never went up is the whole
 *    failure this prevents.
 */

const DISMISS_KEY = 'sp_maintenance_notice_dismissed';

function useCountdown(iso) {
    const [left, setLeft] = useState(null);

    useEffect(() => {
        if (!iso) {
            setLeft(null);

            return undefined;
        }

        const target = new Date(iso).getTime();

        if (Number.isNaN(target)) {
            setLeft(null);

            return undefined;
        }

        const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));

        tick();
        const id = setInterval(tick, 1000);

        return () => clearInterval(id);
    }, [iso]);

    return left;
}

function readable(seconds) {
    if (seconds === null) return null;
    if (seconds <= 0) return 'any moment';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;

    return `${seconds}s`;
}

export default function MaintenanceBanner() {
    const notice = usePage().props?.maintenance_notice ?? null;
    const [dismissed, setDismissed] = useState(false);

    // The scheduled notice may be dismissed for the session. A `bypassing` notice
    // may not — see the note above.
    useEffect(() => {
        if (!notice || notice.mode !== 'scheduled') return;

        try {
            setDismissed(sessionStorage.getItem(DISMISS_KEY) === notice.starts_at);
        } catch {
            // Storage blocked (Safari private mode, hardened profiles) throws
            // SecurityError. Showing the strip is the safe direction.
        }
    }, [notice?.mode, notice?.starts_at]);

    // Hooks must run unconditionally, so the countdown is set up before any early
    // return and simply receives null when there is nothing to count down to.
    const until = useCountdown(notice?.mode === 'scheduled' ? notice?.starts_at : notice?.ends_at);

    if (!notice) return null;
    if (notice.mode === 'scheduled' && dismissed) return null;

    const bypassing = notice.mode === 'bypassing';
    const remaining = readable(until);

    const dismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem(DISMISS_KEY, notice.starts_at ?? '1');
        } catch {
            /* nothing to do — the strip simply returns on the next navigation */
        }
    };

    return (
        <div
            role="status"
            className={[
                'w-full px-4 py-2 text-center text-[13px] leading-snug',
                bypassing
                    ? 'bg-[#FF007F] text-white'
                    : 'bg-[#FFF4CC] text-black border-b border-black/10',
            ].join(' ')}
        >
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span className="font-semibold">{notice.headline}</span>

                {notice.message ? <span className="opacity-80">{notice.message}</span> : null}

                {remaining ? (
                    <span className="opacity-80">
                        {bypassing ? 'Back online in' : 'Starts in'} {remaining}
                    </span>
                ) : null}

                {!bypassing ? (
                    <button
                        type="button"
                        onClick={dismiss}
                        className="ml-1 min-h-[24px] rounded-full px-2 underline underline-offset-2 opacity-70 hover:opacity-100"
                    >
                        Dismiss
                    </button>
                ) : null}
            </div>
        </div>
    );
}
