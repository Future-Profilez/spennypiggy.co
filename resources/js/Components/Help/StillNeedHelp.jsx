import { Link } from "@inertiajs/react";
import { MessageCircle, Mail, Receipt } from "lucide-react";
import { openLiveChat } from "@/lib/liveChat";

/**
 * What a reader does when the help centre did not answer them.
 *
 * ⚠️ There is NO general "contact us" form on this platform. A ticket is always
 * attached to a payment — SupportTicketController needs a creator and a source,
 * GuestSupportTicketController needs a payment id. So this offers what is
 * genuinely available to THIS viewer rather than linking a form that will refuse
 * them, which is worse than offering nothing.
 *
 * The `escalation` payload is built server-side (HelpController::escalation) so
 * the branch cannot drift from what the routes actually allow.
 *
 * 🚨 `compact` IS A DIFFERENT ELEMENT, NOT A SMALLER CARD (5 Sep 2026).
 *
 * It used to be the same yellow panel with the same heading and the same three
 * filled buttons, `p-4` instead of `p-6`. Every compact mount is NESTED inside a
 * surface whose page ALREADY renders the full panel at the foot — the chat
 * fallback and the article feedback block both sit above `Help/Index`,
 * `Help/Article` and `Help/Category`'s own `<StillNeedHelp>` — so the reader got
 * the identical loud card twice on one screen, which is what it was reported as.
 *
 * The compact form is therefore a QUIET ROW: a hairline, a short label and text
 * links. It says the same three things without competing with the panel below it
 * or with the answer above it. **Never give it a background, a heading level or
 * a filled button** — the moment it looks like a card it is a duplicate again.
 */
export default function StillNeedHelp({ escalation, compact = false }) {
    if (!escalation) return null;

    // ⚠️ Only preventDefault when the messenger is genuinely loaded. The guard
    // used to be `typeof window.Intercom === "function"`, which the provider's
    // QUEUEING STUB satisfies — so for a logged-out visitor (the provider returns
    // early for guests) this button cancelled its own mailto: and opened nothing.
    // See lib/liveChat.js; the href below is the fallback and must stay real.

    if (compact) {
        return (
            <div className="border-t border-black/15 pt-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                    <span className="font-semibold text-black/60">Still stuck?</span>

                    {escalation.chat && (
                        <a
                            href={`mailto:${escalation.email}`}
                            onClick={openLiveChat}
                            className="font-semibold text-black underline decoration-black/30 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                        >
                            Chat with us
                        </a>
                    )}

                    {escalation.purchases_url && (
                        <Link
                            href={escalation.purchases_url}
                            className="font-semibold text-black underline decoration-black/30 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                        >
                            About a purchase
                        </Link>
                    )}

                    <a
                        href={`mailto:${escalation.email}`}
                        className="font-semibold text-black underline decoration-black/30 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                    >
                        {escalation.email}
                    </a>
                </div>
            </div>
        );
    }

    return (
        <section
            className="rounded-box border-[3px] border-black bg-[#E6EA7B] p-6"
            aria-labelledby="still-need-help-heading"
        >
            <h2 id="still-need-help-heading" className="text-lg font-black uppercase tracking-tight text-black">
                Still need help?
            </h2>
            <p className="mt-1 text-sm text-black/75">
                {escalation.signed_in
                    ? "Pick whichever is quickest."
                    : "You don't need an account to reach us."}
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {escalation.chat && (
                    <a
                        href={`mailto:${escalation.email}`}
                        onClick={openLiveChat}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-box-sm border-2 border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/85"
                    >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Chat with us
                    </a>
                )}

                {/* A ticket lives on a purchase, so this is the screen that lists them. */}
                {escalation.purchases_url && (
                    <Link
                        href={escalation.purchases_url}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-box-sm border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black hover:bg-black hover:text-white"
                    >
                        <Receipt className="h-4 w-4" aria-hidden="true" />
                        Message us about a purchase
                    </Link>
                )}

                <a
                    href={`mailto:${escalation.email}`}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-box-sm border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black hover:bg-black hover:text-white"
                >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {escalation.email}
                </a>
            </div>
        </section>
    );
}
