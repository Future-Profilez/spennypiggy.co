import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import {
    STABLECOIN_TIPS_ANNOUNCED,
    STABLECOIN_TIPS_LIVE,
    STABLECOIN_COPY,
} from '@/constants/stablecoinTips';

/**
 * Stablecoin Tips — announcement only.
 *
 * ⚠️ THE FEATURE IS NOT BUILT. Every word comes from `constants/stablecoinTips`,
 * which is checked line by line against the agreed specification and carries the
 * list of claims that are NOT in it. Do not write copy directly into this
 * component — the flag that pulls the announcement, and the flag that flips it
 * from future to present tense, both live there. It renders NOTHING when the
 * announcement is switched off.
 *
 * ── What this replaced, and why ──────────────────────────────────────────────
 * A large dashed rectangle containing a heading, a paragraph, a rule, three
 * equal boxes, two columns of bullets and a footnote — six blocks at the same
 * weight inside a container. That is a form layout, not a design: nothing was
 * the subject, the right half of the box was empty, and the dashed border was
 * carrying the entire personality of the section.
 *
 * 🚨 THE SECTION NOW HAS AN OBJECT, and it is the platform's own. Every payment
 * here is required to produce a `Deliverable`; this is the only one that is not.
 * So the absence is printed on a Supporter Confirmation — the real document this
 * product issues — with the deliverable row left BLANK. A gap on a form people
 * recognise says it faster than a sentence can, and it gives the section
 * something to look at instead of another paragraph.
 *
 * ⚠️ The slip is PAPER on a dark page, deliberately: it is the only light object
 * in this part of the page, so it is what the eye goes to. A dark slip on a dark
 * canvas would have repeated the problem this rebuild fixes.
 *
 * ⚠️ Deliberately NOT dressed as crypto. The specification is explicit that this
 * is "payment resilience, not a crypto pivot", so neon and chain imagery would
 * misrepresent the product as well as looking like every other page that
 * mentions a stablecoin. The spec also notes Stripe reviewers look at merchant
 * sites — which is a reason for the copy to be exact (voluntary, content-free,
 * nothing delivered in exchange), not a reason to be vague.
 */

/**
 * ⚠️ TWO violets. #924DFF is dark enough that as TEXT on this page it measures
 * under 4:1, which is why the old eyebrow and labels were invisible. #C4A5FF is
 * the text/border violet; the darker one is only ever a FILL.
 */
const VIOLET_INK = '#C4A5FF';
const VIOLET_FILL = '#924DFF';

const PAPER = '#F7F3E9';
const PAPER_INK = '#15120C';
const PAPER_MUTED = '#6E6656';

/**
 * A torn foot for the slip, drawn rather than imaged.
 *
 * ⚠️ A `mask-image`, not a row of coloured dots. Painted circles only work over a
 * ground you already know, and this sits on a page-long gradient whose colour at
 * this scroll position is not fixed — dots would show as blobs of the wrong
 * colour. A mask removes pixels instead of covering them, so it is correct over
 * anything.
 */
const TORN = 'radial-gradient(circle at 6px -1px, transparent 6px, #000 6.5px)';

function Slip() {
    const slip = STABLECOIN_COPY.slip;

    return (
        <div
            className="relative w-full max-w-[380px] mx-auto lg:mx-0 lg:ml-auto rotate-[-1.6deg]"
            style={{ filter: 'drop-shadow(0 34px 46px rgba(0,0,0,0.55))' }}
        >
            <div
                className="rounded-t-box-sm px-7 pt-7 pb-6"
                style={{ background: PAPER, color: PAPER_INK }}
            >
                <p
                    className="font-mono text-[12px] uppercase tracking-[0.22em] mb-5"
                    style={{ color: PAPER_MUTED }}
                >
                    {slip.title}
                </p>

                <dl className="m-0">
                    {slip.rows.map((row) => (
                        <div
                            key={row.k}
                            className="flex items-baseline justify-between gap-4 py-[9px] border-b"
                            style={{ borderColor: 'rgba(21,18,12,0.10)' }}
                        >
                            <dt
                                className="font-mono text-[12px] uppercase tracking-[0.14em]"
                                style={{ color: PAPER_MUTED }}
                            >
                                {row.k}
                            </dt>
                            {/* Mono for the value — the house convention is that
                                anything the system produced is set in mono, and a
                                confirmation is exactly that. */}
                            <dd className="font-mono text-[13px] m-0" style={{ color: PAPER_INK }}>
                                {row.v}
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* ── The subject of the whole section ──────────────────────────
                    Every other confirmation this platform issues fills this row.
                    It gets more room than the rows above because it is the thing
                    worth reading, and it is the only place on the slip where a
                    value is missing. */}
                <div className="mt-6">
                    <p
                        className="font-mono text-[12px] uppercase tracking-[0.14em] mb-2.5"
                        style={{ color: PAPER_MUTED }}
                    >
                        {slip.blankKey}
                    </p>
                    <div
                        className="flex items-center justify-center rounded-box-xs border-2 border-dashed py-5"
                        style={{ borderColor: 'rgba(21,18,12,0.26)', background: 'rgba(21,18,12,0.03)' }}
                    >
                        <span
                            className="font-gulfs uppercase text-[15px] tracking-[0.14em]"
                            style={{ color: PAPER_MUTED }}
                        >
                            {slip.blankValue}
                        </span>
                    </div>
                </div>
            </div>

            <div
                className="h-3.5"
                style={{
                    background: PAPER,
                    maskImage: TORN,
                    WebkitMaskImage: TORN,
                    maskSize: '12px 14px',
                    WebkitMaskSize: '12px 14px',
                    maskRepeat: 'repeat-x',
                    WebkitMaskRepeat: 'repeat-x',
                }}
            ></div>

            {/* ⚠️ The provisional signal lives ON the object now, not as a giant
                dashed box around the whole section. It reads as a stamp on a
                document, which is what "not issued yet" actually looks like. */}
            <span
                className="absolute right-4 -bottom-3 font-mono text-[12px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-box-sm border-2 rotate-[-5deg]"
                style={{
                    color: VIOLET_INK,
                    borderColor: `${VIOLET_INK}80`,
                    background: '#120C1E',
                }}
            >
                {slip.stamp}
            </span>
        </div>
    );
}

export default function StablecoinTipsAnnouncement() {
    if (! STABLECOIN_TIPS_ANNOUNCED) return null;

    return (
        <section className="relative bg-transparent py-14 md:py-28 overflow-hidden">
            {/* No ambient orbs here. `PageCanvas` is the page's one light source —
                a per-section orb bloomed where its section was and faded before
                the next, which is what made scrolling read as a row of coloured
                stops instead of one continuous field. */}

            <div className="container relative z-10 px-4 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
                    {/* ── The statement ── */}
                    <div className="lg:col-span-7">
                        <FadeIn y={18}>
                            <span
                                className="inline-block font-gulfs uppercase tracking-[0.22em] text-[12px] rounded-full px-4 py-2 border"
                                style={{
                                    color: VIOLET_INK,
                                    borderColor: `${VIOLET_INK}66`,
                                    background: `${VIOLET_FILL}2E`,
                                }}
                            >
                                {STABLECOIN_COPY.flash}
                            </span>
                        </FadeIn>

                        <FadeIn y={24} delay={0.05}>
                            <h2 className="font-gulfs uppercase text-white text-[32px] sm:text-5xl md:text-[58px] leading-[0.92] tracking-tight mt-6 mb-5 max-w-[13ch]">
                                {STABLECOIN_COPY.heading}
                            </h2>
                        </FadeIn>

                        <FadeIn y={20} delay={0.1}>
                            <p className="font-poppins text-white/75 text-[15px] md:text-[17px] leading-[1.65] max-w-[52ch]">
                                {STABLECOIN_COPY.body}
                            </p>
                        </FadeIn>

                        {/* A ruled list, not bordered boxes. Four supporting facts
                            given the same weight as the heading is what made the old
                            version read as a press release. */}
                        <ul className="mt-8 md:mt-10 border-t border-white/12">
                            {STABLECOIN_COPY.points.map((point, i) => (
                                <StaggerItem key={point} index={i} stagger={0.06} y={14}>
                                    <li className="flex items-start gap-3.5 py-3.5 border-b border-white/12">
                                        <span
                                            aria-hidden="true"
                                            className="mt-[9px] w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ background: VIOLET_INK }}
                                        ></span>
                                        <span className="font-poppins text-white/85 text-[13.5px] md:text-[14.5px] leading-[1.6]">
                                            {point}
                                        </span>
                                    </li>
                                </StaggerItem>
                            ))}
                        </ul>

                        <FadeIn y={12} delay={0.15}>
                            <p className="font-poppins text-white/60 text-[12px] md:text-[12.5px] leading-[1.6] mt-6 max-w-[52ch]">
                                {STABLECOIN_COPY.footnote}
                            </p>
                        </FadeIn>
                    </div>

                    {/* ── The object ── */}
                    <div className="lg:col-span-5">
                        <FadeIn y={26} delay={0.12}>
                            <Slip />
                        </FadeIn>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* Exported for the rare caller that needs to know whether the feature is live
   rather than merely announced — the two are not the same thing. */
export { STABLECOIN_TIPS_LIVE };
