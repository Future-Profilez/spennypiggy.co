import { Link } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { Suspense, useEffect, useState } from "react";
import lazyRetry from "../utils/lazyRetry";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FaInstagram, FaTiktok, FaTwitter, FaYoutube } from "react-icons/fa";
import { Mail, MapPin, Phone } from "lucide-react";
import {
    COOKIES_POLICY_URL,
    DATA_REQUEST_URL,
    DISCLAIMER_URL,
    PRIVACY_POLICY_URL,
} from "../constants/legalLinks";
import spennypiggy from "../../assets/img/logo.png";
import risk from "../../assets/risk_intolerant_vanguard_sharing_mint.png";

// `lazyRetry`, not `lazy` — the Footer renders on every page, so this is the
// chunk a mid-session deploy is most likely to strand. See utils/lazyRetry.js.
const FeatureSuggestionModal = lazyRetry(() => import("../Components/FeatureSuggestionModal"));

/**
 * Site footer.
 *
 * ⚠️ THIS IS THE QUIET CLOSE OF A LOUD PAGE. The homepage above it alternates
 * black with full-bleed pink / mint / yellow / violet bands, so a footer that
 * adds four more accents reads as a fifth band rather than as the end of the
 * page. ONE accent — mint, at label scale and hairline weight only, never as a
 * fill or a glow — and ONE pink phrase, which is the platform's actual promise.
 * The previous version had violet on "Help", pink on "Legal", yellow in the
 * blurb and four brand colours on the social icons: five accents, so no accent.
 *
 * ⚠️ FOUR PEER LINK COLUMNS, not "Help + a Legal dumping ground". The old grid
 * gave 7 support links a full third of the footer and squeezed 16 legal
 * documents into a cramped two-up beside it, so no two columns started or ended
 * on the same line. The documents are now grouped by the question a reader
 * actually arrives with — what did I agree to · how does money work · what
 * happens to my data — six links each, which is what makes the columns align by
 * construction rather than by luck.
 *
 * ⚠️ `leading-*` and `text-*` in this project mean PIXELS — tailwind.config.js
 * overrides both scales with numeric px keys, so `leading-6` is 6px and
 * `text-md` is not a class at all (both faults were live here). Use arbitrary
 * values or the named keys that survive (`text-sm`, `text-base`).
 *
 * ⚠️ Copy is a Stripe-facing surface: content-first only, no gift / tip /
 * donation / fundraising framing, and no unqualified "no fees" claim.
 */

/** Support — a person with a question, not a person reading a document. */
const HELP = [
    // First, because it is now the platform's own answer to "how does this
    // work" — on-platform, searchable, and written from the same config the
    // product actually charges from.
    //
    // ⚠️ The intercom.help centre below is a SECOND, externally-hosted copy of
    // the same knowledge. Two help centres is the drift trap: retire it once
    // /help has the coverage, rather than maintaining both.
    { name: 'Help Centre', path: '/help' },
    { name: 'Live chat', href: 'https://spennypiggy.co', external: true, className: 'livechat' },
    { name: "FAQs", href: 'https://intercom.help/spenny-piggy', external: true },
    { name: 'How it works', route: 'how-spenny-piggy-works' },
    { name: 'Blog', href: 'https://blog.spennypiggy.co', external: true },
    { name: 'Suggest a feature', action: 'suggest' },
    { name: 'Pride Campaign 🏳️‍🌈', route: 'pride.landing' },
    // ⚠️ The Oink Store moved here from the header nav. `GET /giftstore` is
    // deliberately exempt from `EnsureRyeEnabled` and answers with the
    // coming-soon screen while `rye.enabled` is false, so this row is a live
    // link to an honest page rather than a 404 — but it must SAY so, or a
    // visitor clicks a store and finds it is not open. `path`, not `route()`:
    // Ziggy is a generated snapshot and a missing name throws.
    { name: 'Oink Store', path: '/giftstore', badge: 'Coming soon' },
];

/** What you agreed to by using the platform. */
const AGREEMENTS = [
    { name: 'Terms & conditions', route: 'terms-and-conditions' },
    { name: 'Creator agreement', route: 'creator-agreement' },
    { name: 'Supporter terms', route: 'supporter-terms' },
    // Back in its natural place beside the other two party agreements. It only
    // had to be exiled to the end of the list while the columns were 175px and
    // it wrapped to two lines; at 250px it fits on one.
    { name: 'Creator–supporter contract', route: 'creator-supporter-contract' },
    { name: 'MoR agreement', route: 'mor-agreement' },
    { name: 'US addendum', route: 'us-addendum' },
];

/** How money moves — charged, held, paid out, returned. */
const PAYMENTS = [
    { name: 'Payments & reserves', route: 'reserves-and-payments-policy' },
    { name: 'Content & payments', route: 'content-payment-policy' },
    { name: 'Paid tasks', route: 'paid-tasks-terms' },
    { name: 'Fast payout', route: 'fast-start-bonus-terms' },
    // ⚠️ Beside Fast payout, not under Agreements: the Growth Bonus is money
    // moving, which is what this column is. Named for the programme the creator
    // sees on their dashboard, so the two are recognisably the same thing.
    { name: 'Growth bonus', route: 'growth-bonus-terms' },
    { name: 'Return policy', route: 'return-policy' },
    { name: 'Promotion terms', route: 'promotion-terms' },
];

/**
 * What we hold about you, and how to get it back.
 *
 * ⚠️ These are the only links NOT in a column. They sit in the bottom strip,
 * which is where a reader already looks for them, and taking them out is what
 * lets the three remaining columns run at ~250px instead of ~175px — wide
 * enough for readable 15px type and for "Creator–supporter contract" to sit on
 * one line. A fourth column made every link narrower for no one's benefit.
 */
const PRIVACY = [
    { name: 'Privacy policy', href: PRIVACY_POLICY_URL, external: true },
    { name: 'Cookies policy', href: COOKIES_POLICY_URL, external: true },
    // ⚠️ `termly-display-preferences` is Termly's own hook class — it is what
    // opens the consent panel. Renaming it silently kills the control.
    { name: 'Cookie preferences', href: '#', external: true, className: 'termly-display-preferences', noBlank: true },
    { name: 'Request your data', href: DATA_REQUEST_URL, external: true },
    { name: 'Copyright & IP', route: 'copyright-policy' },
    { name: 'Disclaimer', href: DISCLAIMER_URL, external: true },
];

const COLUMNS = [
    { label: 'Help', items: HELP },
    { label: 'Agreements', items: AGREEMENTS },
    { label: 'Payments', items: PAYMENTS },
];

const SOCIALS = [
    { icon: FaTwitter, href: 'https://x.com/spennypiggy', label: 'Spenny Piggy on X' },
    { icon: FaInstagram, href: 'https://www.instagram.com/spennypiggy', label: 'Spenny Piggy on Instagram' },
    { icon: FaTiktok, href: 'https://www.tiktok.com/@spennypiggy', label: 'Spenny Piggy on TikTok' },
    { icon: FaYoutube, href: 'https://m.youtube.com/channel/UCC1GASMLYEjW46dHuKZZMZQ', label: 'Spenny Piggy on YouTube' },
];

/**
 * The rule under each column label runs to the column's own edge, so four
 * columns of different content still share one horizontal line. That line is
 * what makes the block read as aligned — not the link text, which never will.
 */
function ColumnLabel({ children }) {
    return (
        <h3 className="font-gulfs uppercase text-[18px] md:text-[20px] tracking-[0.1em] leading-[1] text-[#05EFB8] pb-3 md:pb-4 mb-1 md:mb-2 border-b border-white/[0.08]">
            {children}
        </h3>
    );
}

/**
 * A footer link. The hover rule is a background gradient sized from 0 to 100%,
 * so it grows from the left with no layout shift and no extra DOM. The 44px
 * touch target comes from the anchor's padding (12px + 12px + a 20px line), and
 * the rule sits on the inner span so it stays against the text rather than at
 * the bottom of the tap area.
 */
const FOCUS = 'rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#05EFB8]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0A0A0A]';
// ⚠️ py-3 is what makes the 44px touch target, not a `min-h`: 12px + 12px on a
// 22.5px line (15px × 1.5) is 46.5px. Changing the font size moves that number,
// so re-measure rather than assuming.
// ⚠️ Measured in a browser at 390px: `py-2` renders these at 40–41px, so the
// docblock above and the code disagreed and the code was losing. `py-3` is what
// the comment describes and what actually clears 44px.
// ⚠️ THE TIGHTER ROW IS DESKTOP-ONLY, AND THAT IS THE POINT (22 Aug 2026). At
// `py-3` everywhere the rows sat ~46px apart on a 1440px screen, which reads as
// a list that has come apart; but that same padding IS the 44px touch target on
// a phone, so shrinking it globally would fail the target on the surface where
// it matters. `md:py-[7px]` gives ~36px rows for a mouse and leaves the phone
// untouched — still clear of the 44px floor, and clear of WCAG 2.2's 24px
// minimum spacing on desktop.
const ANCHOR = `group block py-3 md:py-[7px] ${FOCUS}`;
const ANCHOR_INLINE = `group inline-block py-3 md:py-[7px] ${FOCUS}`;
const INK = 'font-poppins text-[16px] leading-[1.5] text-white/60 transition-colors duration-200 group-hover:text-white group-focus:text-white motion-reduce:transition-none bg-[linear-gradient(#05EFB8,#05EFB8)] bg-no-repeat [background-position:0_100%] [background-size:0_1px] transition-[background-size,color] group-hover:[background-size:100%_1px] motion-reduce:group-hover:[background-size:0_1px]';
// ⚠️ Only the SIZE steps down. The old form also dropped the ink to
// `text-white/60` — 3.3:1 on #0A0A0A, an AA failure, on the strip carrying the
// privacy and data-request links. /60 is the floor and it applies to small print
// too; there is no size exemption.
const INK_SMALL = INK.replace('text-[16px]', 'text-[13.5px]');


function FooterLink({ item, onSuggest, inline = false }) {
    const anchor = inline ? ANCHOR_INLINE : ANCHOR;
    /*
     * ⚠️ A BADGE IS A CONTRAST DECISION, NOT A DECORATION. This footer sits on
     * #0A0A0A and the file's own note above records that `text-white/60` is
     * 3.3:1 — an AA failure — with no size exemption for small print. So the
     * chip is an OUTLINE with near-white type (about 20:1) rather than a tinted
     * fill: brand violet would be the token for "pending", but as a fill on this
     * ground it needs its own measurement before it can carry black type, and as
     * TYPE it fails outright.
     */
    const ink = (
        <span className={inline ? INK_SMALL : INK}>
            {item.name}
            {item.badge ? (
                <span className="ml-2 inline-block whitespace-nowrap rounded-box-xs border border-white/40 px-1.5 py-0.5 align-middle font-gulfs text-[9px] uppercase leading-[1.4] tracking-[0.14em] text-white/95">
                    {item.badge}
                </span>
            ) : null}
        </span>
    );

    if (item.action === 'suggest') {
        return (
            <button type="button" onClick={onSuggest} className={`${anchor} ${inline ? '' : 'w-full text-left'}`}>
                {ink}
            </button>
        );
    }

    if (item.external) {
        return (
            <a
                href={item.href}
                {...(item.noBlank ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                className={`${anchor} ${item.className ?? ''}`}
            >
                {ink}
            </a>
        );
    }

    // ⚠️ `path` is for an internal link that must NOT go through route(). Ziggy
    // is a generated snapshot and route() THROWS for a name it does not carry —
    // a route added locally kills the whole footer until `ziggy:generate` runs.
    if (item.path) {
        return (
            <Link href={item.path} className={anchor}>
                {ink}
            </Link>
        );
    }

    return (
        <Link href={route(item.route)} className={anchor}>
            {ink}
        </Link>
    );
}

/**
 * The signature element: three abutting cells sharing hairlines, the same
 * device the homepage uses for "Ways to get paid". The hairline is the parent's
 * tint showing through a 1px gap — never a border per cell, which doubles up
 * between neighbours and needs a reset at every breakpoint.
 *
 * These three facts are the footer's real job: proof the company is reachable.
 * So the values are the loudest type down here, and every one of them is a live
 * control — the old office line was styled `hover:scale-105 cursor-default`,
 * which invites a click on a thing that does nothing.
 */
function ContactCell({ icon: Icon, label, value, href, children }) {
    return (
        <a
            href={href}
            {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="group flex items-start gap-4 bg-[#0F0F12] px-0 py-4 md:px-7 focus-visible:outline-none focus-visible:bg-[#15151a] hover:bg-[#15151a] transition-colors duration-200 motion-reduce:transition-none"
        >
            {/* The tile inverts on hover. These three cells are the only controls
                in the footer that dial, compose and open a map, and without a mark
                they read as three facts printed on a panel. */}
            <span className="w-11 h-11 shrink-0 rounded-box-sm flex items-center justify-center border border-[#05EFB8]/25 bg-[#05EFB8]/10 text-[#05EFB8] transition-colors duration-200 group-hover:bg-[#05EFB8] group-hover:text-[#0A0A0A] group-focus:bg-[#05EFB8] group-focus:text-[#0A0A0A] motion-reduce:transition-none">
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
            </span>

            <span className="min-w-0">
                <span className="font-gulfs uppercase text-[12px] tracking-[0.2em] leading-[1] text-white/60 block">
                    {label}
                </span>
                {/* ⚠️ The VALUE is body face, not `font-gulfs`. gulfs is a heavy
                    display face for short uppercase labels; set to a 22-character
                    email address it overran its own cell and printed on top of the
                    next one. Labels keep it because that is the job it is good at. */}
                <span className="font-poppins font-bold text-white text-[17px] md:text-[19px] leading-[1.3] tracking-[-0.01em] block mt-2 [overflow-wrap:anywhere] group-hover:text-[#05EFB8] group-focus:text-[#05EFB8] transition-colors duration-200 motion-reduce:transition-none">
                    {value}
                </span>
                {children}
            </span>
        </a>
    );
}

export default function Footer(props) {
    const { auth } = props;
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const year = new Date().getFullYear();

    const [isPWA, setIsPWA] = useState(false);
    useEffect(() => {
        // Hidden inside an installed app — the bottom nav is the app's chrome there.
        if (typeof navigator !== 'undefined') {
            setIsPWA(Boolean(navigator.standalone));
        }
    }, []);

    // SSR is off on this app, but the hostname read still belongs behind a guard.
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isProduction = host === 'spennypiggy.co' || host === 'www.spennypiggy.co';

    return (
        <>
            <footer
                className={`relative overflow-hidden bg-[#0A0A0A] text-white border-t border-white/[0.08] pt-16 md:pt-24 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-14 ${isPWA ? 'hidden' : ''}`}
            >
                <h2 className="sr-only">Site footer</h2>

                {/* No ambient orb. The previous footer ran two 600px blurred discs
                    in two different hues at 10%; a mint replacement was tried here
                    and read as nothing at all, because the contact plate already
                    gives the footer its second ground level. Two blur composites
                    for an effect you cannot see is not a trade worth making. */}

                {/* ⚠️ No `z-10` here. It existed only to lift this above the two
                    ambient orbs, which are gone — and the homepage's logged-out
                    `.landing-bottom-bar` is `position: fixed; z-index: 100`, so any
                    z-index on footer content is a chance for it to paint over that
                    bar mid-scroll. With z auto it always passes underneath. */}
                <div className="containerbox mx-auto px-5 md:px-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10 md:gap-y-12 items-start">
                        {/* ── Who this is ─────────────────────────────────── */}
                        <div className="lg:col-span-4 lg:pr-6">
                            <Link
                                href="/"
                                className="inline-block rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#05EFB8]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0A0A0A]"
                            >
                                <LazyLoadImage
                                    alt="Spenny Piggy — home"
                                    height={110}
                                    width={300}
                                    src={spennypiggy}
                                    className="max-w-[150px] md:max-w-[178px]"
                                />
                            </Link>

                            {/* ⚠️ The promise, and the only pink in the footer. It says
                                what the platform charges for and who pays it — never
                                an unqualified "no fees", which is untrue and a paid-ads
                                policy flag on a page that runs acquisition. */}
                            <p className="font-poppins text-[15.5px] leading-[1.65] text-white/65 mt-4 max-w-[36ch]">
                                Creators sell content and take custom requests here, and keep{' '}
                                <strong className="font-poppins font-bold text-[#FF007F]">
                                    100% of what they list
                                </strong>{' '}
                                — supporters cover the fees at checkout.
                            </p>

                            {/* ⚠️ The "Strictly SFW" and "18+ only" chips that used to
                                sit here were removed on request (12 Aug 2026). The
                                footer now states NEITHER — the promise paragraph above
                                does not carry them either. If the 18+ position needs to
                                be published somewhere, this is the place it used to be. */}

                            <ul className="flex flex-wrap gap-3 mt-4" aria-label="Spenny Piggy on social media">
                                {SOCIALS.map(({ icon: Icon, href, label }) => (
                                    <li key={href}>
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={label}
                                            className="w-11 h-11 flex items-center justify-center rounded-box-sm border border-white/10 bg-white/[0.03] text-white/70 transition-colors duration-200 hover:text-[#05EFB8] hover:border-[#05EFB8]/50 hover:bg-[#05EFB8]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#05EFB8]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] motion-reduce:transition-none"
                                        >
                                            <Icon size={19} aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>

                            <img
                                alt="Recognised as a Risk Intolerant Vanguard, 2025"
                                height={100}
                                width={260}
                                loading="lazy"
                                src={risk}
                                className="rounded-box-sm w-[164px] mt-4 border border-white/12"
                            />
                        </div>

                        {/* ── Four peer columns, six links each ────────────── */}
                        <nav
                            aria-label="Footer"
                            /*
                             * ⚠️ ONE column on a phone, not two. Two columns at 360px
                             * leave each ~148px, and FIVE of the eighteen links wrapped
                             * to two lines there ("Creator agreement", "Payments &
                             * reserves", "Content & payments"…) — a link list where a
                             * third of the rows are double height reads as broken, and
                             * shrinking the type to fix it is the opposite of what was
                             * asked. Full width fits every label on one line.
                             */
                            className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8 md:gap-y-10"
                        >
                            {COLUMNS.map((column) => (
                                <div key={column.label}>
                                    <ColumnLabel>{column.label}</ColumnLabel>
                                    <ul className="">
                                        {column.items.map((item) => (
                                            <li key={item.name} className="">
                                                <FooterLink
                                                    item={item}
                                                    onSuggest={() => setShowSuggestionModal(true)}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* ── Reach a person ──────────────────────────────────── */}
                    <div className="mt-8 md:mt-14 rounded-box overflow-hidden md:bg-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-px">
                        <ContactCell
                            icon={Phone}
                            label="Phone"
                            value="020 3355 2057"
                            href="tel:02033552057"
                        />
                        <ContactCell
                            icon={Mail}
                            label="Email"
                            value="support@spennypiggy.co"
                            href="mailto:support@spennypiggy.co"
                        />
                        <ContactCell
                            icon={MapPin}
                            label="Registered office"
                            value="55 Colmore Row"
                            href="https://maps.google.com/?q=55+Colmore+Row,+Birmingham+B3+2AA"
                        >
                            <span className="font-poppins text-[14.5px] leading-[1.5] text-white/60 block mt-1">
                                Birmingham B3 2AA
                            </span>
                        </ContactCell>
                    </div>

                    {/* ── Small print ─────────────────────────────────────── */}
                    <div className="mt-6 md:mt-12 pt-6 border-t border-white/[0.08]">
                        {/* Privacy and data, inline. Unlabelled on purpose — this is
                            the strip a reader already scans for exactly these six
                            links, so a heading would name what its position says. */}
                        <nav aria-label="Privacy and data" className="flex flex-wrap gap-x-7">
                            {PRIVACY.map((item) => (
                                <FooterLink key={item.name} item={item} inline />
                            ))}
                        </nav>

                        <div className="mt-4 pt-6 border-t border-white/[0.05]">
                            <p className="font-poppins text-[14px] leading-[1.5] text-white/60">
                                © {year} Spenny Piggy{isProduction ? '' : ' Dev'}. All rights reserved.
                            </p>
                            {/* Full width, and last. It is the deepest small print in
                                the footer; boxed into a right-hand column it wrapped to
                                four ragged lines and read as a second column of content
                                rather than as a legal note under everything. */}
                            <p className="font-poppins text-[12px] leading-[1.7] text-white/60 mt-5">
                                All trademarks, logos and brand names are the property of their respective
                                owners. All company, product and service names used on this site are for
                                identification purposes only, and their use does not imply endorsement.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            {showSuggestionModal ? (
                <Suspense fallback={null}>
                    <FeatureSuggestionModal
                        show={showSuggestionModal}
                        onClose={() => setShowSuggestionModal(false)}
                        auth={auth}
                    />
                </Suspense>
            ) : null}
        </>
    );
}
