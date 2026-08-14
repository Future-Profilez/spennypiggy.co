import {
    FaBan,
    FaClock,
    FaExclamationTriangle,
    FaInfoCircle,
} from "react-icons/fa";

const SUPPORT_EMAIL = "support@spennypiggy.co";

/**
 * Severity drives colour AND wording. `info` is deliberately not red: a card
 * that says "Stripe is checking, nothing for you to do" must not look like a
 * failure, or creators learn to ignore the whole panel.
 */
const SEVERITY = {
    critical: {
        icon: FaBan,
        ring: "ring-red-200",
        bar: "bg-red-600",
        tintBg: "bg-red-50",
        tintText: "text-red-700",
        iconColor: "text-red-600",
        badge: "Needs your attention",
    },
    high: {
        icon: FaExclamationTriangle,
        ring: "ring-orange-200",
        bar: "bg-orange-500",
        tintBg: "bg-orange-50",
        tintText: "text-orange-700",
        iconColor: "text-orange-500",
        badge: "Needs your attention",
    },
    medium: {
        icon: FaInfoCircle,
        ring: "ring-amber-200",
        bar: "bg-amber-400",
        tintBg: "bg-amber-50",
        tintText: "text-amber-700",
        iconColor: "text-amber-500",
        badge: "Worth doing soon",
    },
    info: {
        icon: FaClock,
        ring: "ring-sky-200",
        bar: "bg-sky-400",
        tintBg: "bg-sky-50",
        tintText: "text-sky-700",
        iconColor: "text-sky-500",
        badge: "No action needed",
    },
    warning: {
        icon: FaClock,
        ring: "ring-sky-200",
        bar: "bg-sky-400",
        tintBg: "bg-sky-50",
        tintText: "text-sky-700",
        iconColor: "text-sky-500",
        badge: "No action needed",
    },
};

const severityOf = (severity) => SEVERITY[severity] || SEVERITY.medium;

/**
 * "Complete by 12 August" — the date Stripe switches payments off. It is the
 * single most motivating fact on the card and it used to live only inside the
 * Stripe dashboard, which creators do not open.
 */
function formatDeadline(iso) {
    if (!iso) return null;

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    const days = Math.ceil((date - new Date()) / 86400000);
    const label = date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    if (days < 0) return { label, note: "This date has passed", urgent: true };
    if (days === 0) return { label, note: "Today", urgent: true };
    if (days === 1) return { label, note: "Tomorrow", urgent: true };
    return { label, note: `${days} days left`, urgent: days <= 7 };
}

function RequirementCard({ requirement }) {
    const tone = severityOf(requirement.severity);
    const Icon = tone.icon;
    const fields = requirement.fields_needed || [];
    const deadline = formatDeadline(requirement.deadline);

    return (
        <div
            className={`mb-4 w-full overflow-hidden rounded-box bg-white ring-1 ring-inset ${tone.ring} `}
        >
            <div className="flex">
                <div className={`w-1.5 shrink-0 ${tone.bar}`} aria-hidden="true" />

                <div className="min-w-0 flex-1 p-4 md:p-6">
                    <div className="mb-3 flex items-start gap-3">
                        <span
                            className={`mt-0.5 shrink-0 rounded-full p-2 ${tone.tintBg} ${tone.iconColor}`}
                        >
                            <Icon className="text-base" aria-hidden="true" />
                        </span>

                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold leading-tight text-gray-900">
                                {requirement.title}
                            </h3>
                            <span
                                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tone.tintBg} ${tone.tintText}`}
                            >
                                {tone.badge}
                            </span>
                        </div>
                    </div>

                    <p className="mb-4 text-[15px] leading-relaxed text-black/80">
                        {requirement.message}
                    </p>

                    {deadline && (
                        <div
                            className={`mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-box-sm px-4 py-3 text-sm ${
                                deadline.urgent
                                    ? "bg-red-50 text-red-800"
                                    : "bg-gray-50 text-black/80"
                            }`}
                        >
                            <span className="font-semibold">
                                Complete by {deadline.label}
                            </span>
                            <span className="opacity-80">— {deadline.note}</span>
                        </div>
                    )}

                    {fields.length > 0 && (
                        <div className="mb-4 rounded-box-sm bg-gray-50 p-4">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-black/60">
                                {requirement.type === "requirement_errors"
                                    ? "What Stripe said"
                                    : "What Stripe still needs"}
                            </span>
                            <ul className="space-y-1.5">
                                {fields.map((field) => (
                                    <li
                                        key={field}
                                        className="flex gap-2 text-sm text-gray-800"
                                    >
                                        <span
                                            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0">{field}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {requirement.action_url ? (
                        <a
                            href={requirement.action_url}
                            className="flex min-h-[48px] w-full items-center justify-center rounded-box-sm bg-[#FF007F] px-6 py-3 text-center font-gulfs text-sm uppercase text-black transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF007F] md:text-[17px]"
                        >
                            {requirement.action_label || "Resolve this now"}
                        </a>
                    ) : requirement.contact_support ? (
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="flex min-h-[48px] w-full items-center justify-center rounded-box-sm bg-gray-900 px-6 py-3 text-center font-gulfs text-sm uppercase text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 md:text-[17px]"
                        >
                            Contact support
                        </a>
                    ) : null}

                    <p className="mt-3 text-sm text-black/60">{requirement.action}</p>
                </div>
            </div>
        </div>
    );
}

/**
 * The creator's only view of what Stripe wants — most of them never open the
 * Stripe dashboard, so anything the server reports has to be readable here.
 */
export default function ActionRequired({ requirements = [] }) {
    if (!requirements || requirements.length === 0) {
        return null;
    }

    return (
        <div>
            {requirements.map((requirement, index) => (
                <RequirementCard
                    key={requirement.type || index}
                    requirement={requirement}
                />
            ))}
        </div>
    );
}
