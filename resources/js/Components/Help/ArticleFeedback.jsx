import { useState } from "react";
import axios from "axios";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import StillNeedHelp from "./StillNeedHelp";

/**
 * "Was this helpful?" — and the deflection measurement.
 *
 * ⚠️ A "No" is the moment to offer the next step, not to say thank you. The
 * server answers a No with an `escalation` payload and it is rendered
 * immediately: the reader has just told us the article failed them, and making
 * them go and find the contact route themselves is where they give up.
 *
 * `context="support_form"` marks a read that happened INSIDE a support form, so
 * a Yes can be counted as a ticket that was not opened. That number is the whole
 * point of the deflection work — without it nobody can say whether this module
 * did anything.
 */
export default function ArticleFeedback({ slug, context = "page", onAnswered }) {
    const [answer, setAnswer] = useState(null);
    const [escalation, setEscalation] = useState(null);
    const [sending, setSending] = useState(false);

    const vote = async (helpful) => {
        if (sending || answer !== null) return;
        setSending(true);
        // Optimistic: the vote is aggregate analytics, so a failed write must not
        // leave the reader staring at a spinner over a question they answered.
        setAnswer(helpful);

        try {
            const res = await axios.post("/help/feedback", { slug, helpful, context });
            setEscalation(res?.data?.escalation ?? null);
        } catch {
            setEscalation(null);
        } finally {
            setSending(false);
            onAnswered?.(helpful);
        }
    };

    if (answer === true) {
        return (
            <div className="rounded-box-sm border-2 border-black bg-[#05EFB8] px-4 py-3 text-sm font-semibold text-black">
                Glad that sorted it.
            </div>
        );
    }

    if (answer === false) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-black/70">
                    Sorry that didn&apos;t answer it — we&apos;ve logged that so we can improve this page.
                </p>
                <StillNeedHelp escalation={escalation} compact />
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-black">Did this answer your question?</span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => vote(true)}
                    disabled={sending}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black hover:bg-black hover:text-white disabled:opacity-60"
                >
                    <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                    Yes
                </button>
                <button
                    type="button"
                    onClick={() => vote(false)}
                    disabled={sending}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black hover:bg-black hover:text-white disabled:opacity-60"
                >
                    <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                    No
                </button>
            </div>
        </div>
    );
}
