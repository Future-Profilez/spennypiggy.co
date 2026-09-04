import { usePage } from "@inertiajs/react";

/*
 * The one thing a suspended account is told, on every page they can reach.
 *
 * 🚨 IT IS NOT DISMISSIBLE AND IT IS NOT ON ONE TAB. This is a state that
 * changes what the account can do — the same class as CreatorRiskBanner and
 * PendingChangesNotice, which is why it mounts in the layout rather than in a
 * page. A reading can wait for the About tab; a blocker cannot, and someone who
 * dismissed this would spend the rest of the session watching their own writes
 * fail with no explanation on screen.
 *
 * 🚨 The copy comes from the server (`auth.suspension`), never from a map in
 * here. The reason is a decision a person made about someone's account, and the
 * sentence they read has to be the one the platform is willing to stand behind
 * — see config/suspension.php. The admin's internal note is deliberately not
 * sent to the browser at all.
 */
export default function SuspendedBanner() {
    const { auth } = usePage().props;
    /*
     * 🚨 `auth.user.suspension`, NOT `auth.suspension`. The prop is built inside
     * the shared user array in `HandleInertiaRequests`, beside `suspended_account`.
     * The first version of this component read one level too high, so it was
     * always undefined and the banner NEVER RENDERED — no error, nothing in any
     * log, and a suspended creator seeing no explanation at all. Same class as
     * `SaveButton`'s dead `is_saved` prop. Pinned by SuspendedAccountAccessTest.
     */
    const suspension = auth?.user?.suspension;

    // Rendered on the prop's presence, which the server sends only for a
    // suspended account. No client-side truth test about who is suspended.
    if (!suspension) return null;

    /*
     * 🚨 AMBER IS NOT A SOFTER RED, IT IS A DIFFERENT STATEMENT. Red on this
     * platform means a person judged the account. An unpaid subscription or an
     * unfinished ID check is something left undone, so it reads "Account
     * limited" in amber — the same rule ProfileSelfCheck follows. The server
     * decides which; the component never infers it from the code.
     */
    const limited = suspension.tone === "limited";
    const pillClass = limited ? "bg-[#E6EA7B]" : "bg-[#FF4D4D]";
    const pillLabel = limited ? "Account limited" : "Account suspended";

    const openSupport = () => {
        /*
         * 🚨 `typeof window.Intercom === "function"` IS NOT A LOADED CHECK.
         * IntercomProvider installs a stub that queues calls until the real
         * script arrives, so with an ad blocker the call is accepted, nothing
         * opens, and the person is left believing they have messaged support
         * about their suspended account. Only the real widget sets `booted`.
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

    return (
        // ⚠️ In flow, directly under the header — it is a banner, not an
        // overlay, so nothing has to be lifted above the bottom bar for it.
        <div className="w-full px-4 sm:px-8 pt-4">
            <div className="mx-auto max-w-[1400px] rounded-box border-black bg-white p-5 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                        <span className={`inline-flex items-center rounded-box-xs ${pillClass} px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-black`}>
                            {pillLabel}
                        </span>
                        <h2 className="mt-3 font-gulfs text-xl leading-[1.2] text-black md:text-2xl">
                            {suspension.title}
                        </h2>
                        <p className="mt-2 max-w-[70ch] text-sm leading-[1.55] text-black/75 md:text-base">
                            {suspension.body}
                        </p>
                        {/* ⚠️ States the consequences plainly rather than letting
                            the person discover each one by hitting it. Every
                            sentence here matches what the code actually does. */}
                        {/* ⚠️ The list says the same true things either way, but not
                            in the same words: "while this is in place" is honest for
                            something the creator can end today, "until this is lifted"
                            is honest for something only we can end. */}
                        <ul className="mt-3 max-w-[70ch] list-disc space-y-1 pl-5 text-sm leading-[1.55] text-black/70">
                            <li>Your profile and listings are hidden, and no one can buy from you.</li>
                            <li>
                                Supporters&rsquo; recurring payments to you are paused, not
                                cancelled &mdash; they restart{" "}
                                {limited ? "as soon as this is sorted" : "if the suspension is lifted"}.
                            </li>
                            <li>Payouts are on hold, and you cannot make purchases while this is in place.</li>
                            <li>You can still sign in, read your account and your history, and message support.</li>
                        </ul>
                    </div>

                    {/* 🚨 WHEN THERE IS A WAY OUT, IT IS THE PRIMARY BUTTON AND
                        SUPPORT DROPS TO SECONDARY. A creator who can fix this
                        themselves should not have to open a chat to be told so —
                        and the server only sends an action for a reason they CAN
                        fix. `mandatory.checkout` is on the write-allowlist for
                        exactly this, or the button would be refused. */}
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                        {suspension.action && (
                            <a
                                href={suspension.action.url}
                                // No scale on press — house rule. Brightness only.
                                className="inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-black bg-[#FF007F] px-5 py-2 text-sm font-extrabold text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                            >
                                {suspension.action.label}
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={openSupport}
                            className={
                                suspension.action
                                    ? "inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-black bg-white px-5 py-2 text-sm font-extrabold text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                                    : "inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-black bg-[#FF007F] px-5 py-2 text-sm font-extrabold text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                            }
                        >
                            Contact support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
