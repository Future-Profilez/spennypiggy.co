import { accentFor, stepsFor } from "./constants";

/**
 * Role-aware progress. A supporter walks three screens and a creator four, so
 * the rail is built from `stepsFor(role)` rather than a fixed count.
 */
export default function ProgressRail({
    role,
    currentKey,
    onBack,
    hasGoogle = false,
}) {
    const steps = stepsFor(role, hasGoogle);
    const accent = accentFor(role);
    const index = Math.max(
        0,
        steps.findIndex((s) => s.key === currentKey),
    );

    return (
        <div className="flex items-center gap-4">
            {onBack ? (
                <button
                    type="button"
                    onClick={onBack}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Go back a step"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            ) : (
                <span className="hidden h-11 w-11 shrink-0 sm:block" />
            )}

            <ol className="flex flex-1 items-center gap-2">
                {steps.map((step, i) => {
                    const done = i < index;
                    const active = i === index;
                    return (
                        <li key={step.key} className="flex-1">
                            <span
                                className="block h-1.5 rounded-full transition-colors duration-300"
                                style={{
                                    backgroundColor:
                                        done || active
                                            ? accent.hex
                                            : "rgba(255,255,255,0.18)",
                                }}
                            />
                            <span
                                className={`mt-2 hidden text-[11px] font-semibold uppercase tracking-[0.14em] sm:block ${
                                    active ? "text-white" : "text-white/60"
                                }`}
                            >
                                {step.label}
                            </span>
                        </li>
                    );
                })}
            </ol>

            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                {index + 1}/{steps.length}
            </span>
        </div>
    );
}
