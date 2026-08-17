import { Link } from "@inertiajs/react";
import { MessageCircle, Mail, Receipt } from "lucide-react";

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
 */
export default function StillNeedHelp({ escalation, compact = false }) {
    if (!escalation) return null;

    const openChat = (e) => {
        // ⚠️ Only preventDefault when the messenger is genuinely loaded.
        // IntercomProviderFixed returns early for logged-out visitors, so a bare
        // Intercom() call would be a dead button for the audience most likely to
        // need it — the email link underneath must stay reachable.
        if (typeof window !== "undefined" && typeof window.Intercom === "function") {
            e.preventDefault();
            window.Intercom("showNewMessage");
        }
    };

    return (
        <section
            className={`rounded-box border-[3px] border-black bg-[#E6EA7B] ${compact ? "p-4" : "p-6"}`}
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
                        onClick={openChat}
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
