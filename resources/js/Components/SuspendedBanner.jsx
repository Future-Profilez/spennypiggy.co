import { usePage } from "@inertiajs/react";

/*
 * The account-state notice a suspended or limited creator reads on their OWN
 * profile, directly under their cover.
 *
 * 🚨 MOUNTED IN `Pages/Dashboard.jsx` UNDER THE COVER, GATED ON THE OWNER —
 * NOT in AuthenticatedLayout (client direction, 5 Sep 2026). It used to sit at
 * the top of every page, which put it above the Help Centre and every other
 * screen as a bolted-on card that belonged to none of them. `/{username}` is
 * the creator's dashboard and where they land; the state of their account is
 * a fact about THIS page. The trade-off is deliberate and known: on other
 * pages a refused write still explains itself through the error bag.
 *
 * 🚨 THE COPY COMES FROM THE SERVER (`auth.user.suspension`), NEVER A MAP
 * HERE. The reason is a decision a person made about somebody's account, and
 * the sentence they read has to be the one the platform stands behind — see
 * config/suspension.php. The admin's internal note is never sent to the
 * browser. ⚠️ It is `auth.user.suspension` — inside the user array, beside
 * `suspended_account`. The first version read one level too high and rendered
 * nothing, for ever; pinned by SuspendedAccountAccessTest.
 *
 * Design: the cover is a landscape frame with a 2px black border; this is a
 * second frame of the SAME width directly beneath it, so it reads as the
 * cover's caption rather than an alert floating in the page. State colour is
 * spent in ONE place — the spine down the left edge — because the headline
 * already says the word and a coloured pill repeating it is noise. Amber is
 * not a softer red: red means a person judged the account, amber means
 * something is left undone. No shadow, no scale, black on pink.
 */
export default function SuspendedBanner({ className = "" }) {
    const { auth } = usePage().props;
    const suspension = auth?.user?.suspension;

    // Rendered on the prop's presence — the server sends it only for a
    // suspended account. No client-side test about who is suspended.
    if (!suspension) return null;

    const limited = suspension.tone === "limited";
    const spine = limited ? "bg-[#E6EA7B]" : "bg-[#FF4D4D]";

    const openSupport = () => {
        /*
         * 🚨 `typeof window.Intercom === "function"` IS NOT A LOADED CHECK.
         * IntercomProvider installs a stub that queues calls until the real
         * script arrives, so with an ad blocker the call is accepted, nothing
         * opens, and the person believes they have messaged support about
         * their account. Only the real widget sets `booted`.
         */
        if (typeof window !== "undefined" && window.Intercom?.booted === true) {
            try {
                window.Intercom(
                    "showNewMessage",
                    limited
                        ? "My account is limited and I need help getting it back."
                        : "My account is suspended and I would like it reviewed.",
                );
                return;
            } catch {
                // fall through to email
            }
        }

        window.location.href =
            "mailto:support@spennypiggy.co?subject=" +
            encodeURIComponent(limited ? "Limited account" : "Suspended account review");
    };

    /*
     * What is true of the account right now, as a state table. Structure here
     * carries information: three facts, one word each, read across a row —
     * not four sentences a person has to parse. The wording of the second
     * cell follows the tone: "as soon as this is sorted" is honest for
     * something the creator can end today, "if the suspension is lifted" for
     * something only we can end.
     */
    const facts = [
        { label: "Profile and listings", state: "Hidden" },
        {
            label: "Supporter subscriptions",
            state: "Paused",
            note: limited ? "restart as soon as this is sorted" : "restart if the suspension is lifted",
        },
        { label: "Payouts and purchases", state: "On hold" },
    ];

    const primaryBtn =
        "inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-black bg-[#FF007F] px-5 py-2 text-sm font-extrabold text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95";
    const quietBtn =
        "inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-black bg-white px-5 py-2 text-sm font-extrabold text-black transition-colors duration-200 hover:bg-[#F4F4F5]";

    return (
        // ⚠️ Same horizontal treatment as the cover directly above it — bleeds
        // to the edge below `sm:` and carries the frame from `sm:` up — so the
        // two read as one composed block.
        <section
            role="status"
            aria-live="polite"
            className={`relative overflow-hidden bg-white -mx-5 sm:mx-0 rounded-none border-0 sm:rounded-box sm:border-2 sm:border-black ${className}`}
        >
            {/* The one place state colour is spent. Inside the frame, full height. */}
            <div aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${spine}`} />

            <div className="pl-7 pr-5 py-5 sm:pl-8 sm:pr-6 sm:py-6 md:pl-9 md:pr-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-8">
                    <div className="min-w-0 max-w-[62ch]">
                        {/* ⚠️ UPPERCASE IS A CSS TREATMENT, NOT THE STORED STRING.
                            `config/suspension.php` keeps sentence case because the
                            same title is quoted back to an admin in the suspend
                            dialog ("They will read: …") and shouting in the data
                            would follow it everywhere. It is the house display
                            treatment for `font-gulfs` — and legitimate here because
                            this is OUR copy; creator-authored text is never set in
                            display caps (it mangles long titles and accents).
                            ⚠️ Caps carry no descenders, so the leading tightens with
                            them — 1.15 leaves a visible gap between two capital lines. */}
                        <h2 className="font-gulfs text-[22px] uppercase leading-[1.05] text-black sm:text-[26px] md:text-[28px]">
                            {suspension.title}
                        </h2>
                        <p className="mt-2 text-[15px] leading-[1.55] text-black/70">
                            {suspension.body}
                        </p>
                    </div>

                    {/* 🚨 WHEN THERE IS A WAY OUT, IT IS THE PRIMARY BUTTON and support
                        drops to secondary. The server sends an action only for a
                        reason the creator can fix themselves, and its route is on
                        the write-allowlist — or the button would be refused. */}
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                        {suspension.action && (
                            <a href={suspension.action.url} className={primaryBtn}>
                                {suspension.action.label}
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={openSupport}
                            className={suspension.action ? quietBtn : primaryBtn}
                        >
                            Contact support
                        </button>
                    </div>
                </div>

                {/* State table — DIVISIONS ONLY, NO FRAME OF ITS OWN.
                    🚨 House rule: one card, no boxes inside it (the compact
                    DiscoveryStatsPanel direction). A `border-black` here would be a
                    2px box inside the card's own 2px box, in the same colour, which
                    reads as boxes inside boxes. Depth is border weight, then colour,
                    then SPACE — so the cells are separated by hairlines on one shared
                    grid (`divide-y`/`sm:divide-x`), never a border per cell, which
                    doubles up where two cells meet. */}
                <dl className="mt-5 grid grid-cols-1 divide-y divide-black/15 border-t border-black/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {facts.map((f) => (
                        <div key={f.label} className="px-0 py-3 sm:px-4 sm:first:pl-0">
                            <dt className="text-[12.5px] leading-[1.4] text-black/60">{f.label}</dt>
                            <dd className="mt-0.5 text-[15px] font-extrabold leading-[1.3] text-black">
                                {f.state}
                                {f.note && (
                                    <span className="block text-[12.5px] font-medium leading-[1.4] text-black/60">
                                        {f.note}
                                    </span>
                                )}
                            </dd>
                        </div>
                    ))}
                </dl>

                <p className="mt-3 text-[13px] leading-[1.5] text-black/60">
                    You can still sign in, read your account and your history, and message support.
                </p>
            </div>
        </section>
    );
}
