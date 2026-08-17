import { forwardRef } from "react";

/**
 * One text field: label, control, inline status, error.
 *
 * The old form repeated ~40 lines of markup per field and built its class
 * string through a callback, so no two inputs were reliably the same height or
 * the same focus colour. Everything visual lives here now.
 */

const STATUS_ICON = {
    success: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
    error: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
    checking: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
        >
            <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
    ),
};

const STATUS_TONE = {
    success: "bg-[#05EFB8] text-black",
    error: "bg-[#FF3B30] text-white",
    checking: "bg-black/10 text-black",
};

export const fieldShell = (status) =>
    [
        "w-full min-h-[52px] rounded-box-sm border-2 bg-white px-4 py-3 text-base text-black",
        "placeholder:text-black/60 outline-none transition-colors",
        "focus:border-black focus-visible:ring-2 focus-visible:ring-black/10",
        status === "error" ? "border-[#FF3B30]" : "border-black/15",
    ].join(" ");

const Field = forwardRef(function Field(
    {
        id,
        label,
        hint,
        error,
        status = "idle",
        prefix,
        suffix,
        optional = false,
        className = "",
        children,
        ...inputProps
    },
    ref,
) {
    const describedBy = [
        hint ? `${id}-hint` : null,
        error ? `${id}-error` : null,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={className}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <label
                    htmlFor={id}
                    className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/60"
                >
                    {label}
                </label>
                {optional && (
                    <span className="text-[12px] text-black/60">Optional</span>
                )}
            </div>

            <div className="relative">
                {prefix && (
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-black/60">
                        {prefix}
                    </span>
                )}

                {children ?? (
                    <input
                        id={id}
                        ref={ref}
                        aria-invalid={status === "error" || undefined}
                        aria-describedby={describedBy || undefined}
                        className={`${fieldShell(status)} ${prefix ? "pl-9" : ""} ${
                            status !== "idle" || suffix ? "pr-12" : ""
                        }`}
                        {...inputProps}
                    />
                )}

                {suffix}

                {!suffix && status !== "idle" && (
                    <span
                        className={`pointer-events-none absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full ${STATUS_TONE[status]}`}
                    >
                        {STATUS_ICON[status]}
                    </span>
                )}
            </div>

            {hint && !error && (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-black/60">
                    {hint}
                </p>
            )}

            {error && (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-[#C81E1E]"
                >
                    {error}
                </p>
            )}
        </div>
    );
});

export default Field;
