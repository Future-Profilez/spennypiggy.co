import { Link } from '@inertiajs/react';

/**
 * The creator's own "is my money still coming in" strip, at the top of their profile.
 *
 * ⚠️ This exists because `paused` was unreadable. The state was surfaced as the raw
 * word "paused" on a card below the fold, and creators did not connect it to their
 * subscription income having stopped — they kept posting nothing and kept asking
 * support why they had not been paid. So the loudest thing this component can say
 * is the consequence, in money, and the quietest thing it can say is "fine".
 *
 * The design device is the page's own offset shadow: it is black while things are
 * normal and RED once income has stopped. Nothing else on a creator's profile has
 * a red shadow, so the state is legible before a single word is read.
 *
 * The meter is three blocks, not a progress bar, because the requirement is three
 * discrete posts and a percentage cannot say "one of these expires on Thursday".
 */

const SHORT_DATE = { day: 'numeric', month: 'short' };

function formatDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, SHORT_DATE);
}

/**
 * Three blocks: filled for each counting post, hollow for each one still needed.
 * The block whose post ages out first is dated — a creator at 3 of 3 is only at
 * 3 of 3 until then, and that is the single most useful thing on this strip for
 * someone who is currently fine.
 */
export function PostMeter({ have, required, nextDropOut, dark }) {
    const slots = Array.from({ length: Math.max(required, have) });
    const dropOut = formatDate(nextDropOut);

    return (
        <div>
            <div className="flex items-center gap-1.5" role="img"
                aria-label={`${have} of ${required} member posts published`}>
                {slots.map((_, i) => {
                    const filled = i < have;
                    return (
                        <span
                            key={i}
                            className={[
                                'h-3.5 w-9 rounded-[3px] border-2',
                                dark ? 'border-white/70' : 'border-black',
                                filled
                                    ? dark ? 'bg-white' : 'bg-black'
                                    : dark ? 'bg-transparent' : 'bg-transparent',
                            ].join(' ')}
                        />
                    );
                })}
                <span className={`ml-2 text-xs font-black uppercase tracking-widest ${dark ? 'text-white/80' : 'text-black/70'}`}>
                    {have} / {required} posts
                </span>
            </div>
            {dropOut && (
                <p className={`mt-1.5 text-[11px] font-semibold ${dark ? 'text-white/60' : 'text-black/55'}`}>
                    Your oldest post stops counting on {dropOut}
                </p>
            )}
        </div>
    );
}

export default function ActivityStatusBanner({ cadence, className = '', showDetailsLink = true }) {
    if (!cadence || !cadence.status) return null;

    const {
        status,
        headline,
        consequence,
        member_posts: have = 0,
        required = 3,
        counting_posts: countingPosts = [],
        pause_in_days: pauseInDays,
    } = cadence;

    const nextDropOut = [...(countingPosts || [])]
        .sort((a, b) => String(a.drops_out_at).localeCompare(String(b.drops_out_at)))[0]?.drops_out_at;

    // Healthy: one quiet line. A creator who is fine still wants to see that they
    // are fine — but an always-loud strip is one they stop reading, and then the
    // day it matters they do not read it either.
    if (status === 'active') {
        return (
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-black/10 pb-3 ${className}`}>
                <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-black/70">
                    <span className="h-2 w-2 rounded-full bg-[#1E9E5A]" aria-hidden="true" />
                    Payments running
                </span>
                <span className="text-[11px] font-semibold text-black/45">
                    {have} of {required} member posts
                    {formatDate(nextDropOut) ? ` · oldest expires ${formatDate(nextDropOut)}` : ''}
                </span>
                {showDetailsLink && (
                    <Link
                        href={route('creator.activity')}
                        className="ml-auto text-[11px] font-black uppercase tracking-[0.14em] text-black/50 underline decoration-black/20 underline-offset-4 hover:text-black"
                    >
                        Details
                    </Link>
                )}
            </div>
        );
    }

    const stopped = status === 'paused';
    const urgent = stopped || status === 'at_risk';

    // Paused inverts to black-on-red: this is the only state where money has
    // already stopped, and it should not look like the same card in a warmer colour.
    const shell = stopped
        ? 'bg-[#141414] border-[3px] border-black shadow-[6px_6px_0px_0px_#E01B3C]'
        : urgent
            ? 'bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#E01B3C]'
            : 'bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';

    const plate = stopped
        ? 'bg-[#E01B3C] text-white'
        : urgent
            ? 'bg-[#E01B3C] text-white'
            : 'bg-[#A2E4B8] text-black';

    const plateLabel = stopped
        ? 'Payments stopped'
        : urgent
            ? (pauseInDays != null
                ? `${pauseInDays} day${pauseInDays === 1 ? '' : 's'} to fix this`
                : 'Action needed')
            : 'Getting started';

    return (
        <section
            className={`rounded-box p-5 sm:p-6 ${shell} ${className}`}
            aria-label="Your payment status"
        >
            <span
                className={`inline-flex items-center rounded-box-sm border-2 border-black px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${plate}`}
            >
                {plateLabel}
            </span>

            <h3
                className={`mt-3 font-GillSans text-2xl font-black uppercase leading-[1.05] tracking-wide sm:text-[28px] ${stopped ? 'text-white' : 'text-black'}`}
            >
                {headline}
            </h3>

            <p
                className={`mt-2 max-w-2xl text-sm font-medium leading-relaxed ${stopped ? 'text-white/75' : 'text-black/70'}`}
            >
                {consequence}
            </p>

            <div className="mt-5">
                <PostMeter have={have} required={required} nextDropOut={nextDropOut} dark={stopped} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                    href={route('dashboard', { add: 'post' })}
                    className={`inline-flex min-h-[48px] items-center justify-center rounded-box-sm border-2 border-black px-6 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0px_#000] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                        stopped ? 'bg-white text-black' : 'bg-[#FF007F] text-white'
                    }`}
                >
                    Write a post
                </Link>
                {showDetailsLink && (
                    <Link
                        href={route('creator.activity')}
                        className={`inline-flex min-h-[48px] items-center text-xs font-black uppercase tracking-[0.14em] underline underline-offset-4 ${
                            stopped
                                ? 'text-white/70 decoration-white/30 hover:text-white'
                                : 'text-black/60 decoration-black/25 hover:text-black'
                        }`}
                    >
                        What do I need to do?
                    </Link>
                )}
            </div>
        </section>
    );
}
