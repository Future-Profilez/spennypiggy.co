/**
 * Why this pot is not on the creator's public profile, and what puts it back.
 *
 * ⚠️ A status chip cannot do this job. "expired", "completed" and
 * "moderation_hold" all render as a grey word next to a pot that has quietly
 * stopped selling, and the fix for each is different — set a new deadline, start
 * a new pot, or wait for review. A creator whose PINNED pot lapsed saw nothing at
 * all: the card still said "⭐ Pinned" while their profile had moved on.
 *
 * Silent when the pot is live. There is deliberately no green all-clear box — a
 * notice that is always present is one nobody reads.
 */

const TONES = {
    // Money has stopped and the creator can fix it themselves.
    deadline_passed: {
        wrap: 'border-red-300 bg-red-50',
        title: 'text-red-800',
        body: 'text-red-700',
        icon: '⏰',
    },
    // Nothing for them to do.
    moderation_hold: {
        wrap: 'border-amber-300 bg-amber-50',
        title: 'text-amber-900',
        body: 'text-amber-800',
        icon: '⏳',
    },
    moderation_flagged: {
        wrap: 'border-red-300 bg-red-50',
        title: 'text-red-800',
        body: 'text-red-700',
        icon: '⚠️',
    },
    completed: {
        wrap: 'border-yellow-300 bg-yellow-50',
        title: 'text-yellow-900',
        body: 'text-yellow-800',
        icon: '🎉',
    },
    archived: {
        wrap: 'border-gray-300 bg-gray-50',
        title: 'text-gray-800',
        body: 'text-gray-600',
        icon: '📦',
    },
    not_featured: {
        wrap: 'border-gray-300 bg-gray-50',
        title: 'text-gray-800',
        body: 'text-gray-600',
        icon: '📌',
    },
};

export default function PotVisibilityNotice({
    visibility,
    moderationReason = null,
    onFix = null,
    fixLabel = null,
}) {
    if (!visibility || visibility.visible) return null;

    // A flagged pot and a pot merely waiting its turn are different situations:
    // one needs the creator to replace something, the other needs patience.
    const key =
        visibility.code === 'moderation_hold' && moderationReason
            ? 'moderation_flagged'
            : visibility.code;

    const tone = TONES[key] || TONES.archived;

    // Only the deadline case has an action the creator can take from here.
    const showFix = Boolean(onFix) && visibility.code === 'deadline_passed';

    return (
        <div
            className={`mb-3 rounded-box-sm border-2 px-3 py-2.5 ${tone.wrap}`}
            role="status"
        >
            <p className={`text-xs font-black uppercase tracking-wide ${tone.title}`}>
                <span aria-hidden="true">{tone.icon}</span> {visibility.title}
            </p>
            <p className={`mt-1 text-xs font-medium leading-relaxed ${tone.body}`}>
                {moderationReason || visibility.message}
            </p>
            {visibility.fix && !showFix && (
                <p className={`mt-1 text-xs font-semibold ${tone.body}`}>
                    {visibility.fix}
                </p>
            )}
            {showFix && (
                <button
                    type="button"
                    onClick={onFix}
                    className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-2 border-black bg-white px-4 text-xs font-black uppercase tracking-widest text-black transition-colors duration-200 hover:bg-black/[0.04]"
                >
                    {fixLabel || 'Set a new deadline'}
                </button>
            )}
        </div>
    );
}
