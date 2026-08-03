import { useCallback, useEffect, useMemo, useState } from "react";
import Sheet from "@/Components/Sheet";
import { ArrowLeft, Loader2 } from "lucide-react";

/**
 * The shared skeleton for creating or editing any sellable item.
 *
 * Every module used to render one long scrolling form and only reveal its
 * problems after a submit round-trip, which is what made adding a wish or a
 * shop item feel improvised. This splits the work into short steps, blocks
 * moving forward until the current step is valid, and keeps the primary action
 * pinned to the bottom of the sheet so it is always one thumb away.
 *
 * @param {Array<{key:string,title:string,hint?:string,render:Function,validate?:Function}>} steps
 * @param {Function} onSubmit          called when the last step's Save is pressed
 * @param {Function} [onClose]         return false to veto closing
 * @param {Function} [preview]         render prop for the desktop preview column
 */
export default function ItemFormShell({
    open,
    onClose,
    title,
    subtitle,
    steps,
    onSubmit,
    submitLabel = "Publish",
    processing = false,
    preview = null,
    error = null,
}) {
    const [index, setIndex] = useState(0);
    const [stepError, setStepError] = useState(null);

    const activeSteps = useMemo(() => steps.filter(Boolean), [steps]);
    const step = activeSteps[Math.min(index, activeSteps.length - 1)];
    const isLast = index >= activeSteps.length - 1;

    // Re-opening the sheet must start at the beginning; leaving it on step 3
    // from the previous item is disorienting and hides the earlier fields.
    useEffect(() => {
        if (open) {
            setIndex(0);
            setStepError(null);
        }
    }, [open]);

    useEffect(() => setStepError(null), [index]);

    const goNext = useCallback(() => {
        const problem = step?.validate?.();
        if (problem) {
            setStepError(problem);
            return;
        }
        setStepError(null);

        if (!isLast) {
            setIndex((current) => current + 1);
            return;
        }

        onSubmit?.();
    }, [isLast, onSubmit, step]);

    const goBack = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);

    const visibleError = stepError || error;
    const actionLabel = processing ? "Processing…" : isLast ? submitLabel : "Continue";

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={title}
            subtitle={subtitle || step?.title}
            size={preview ? "4xl" : "2xl"}
            headerAction={
                <button
                    type="button"
                    onClick={goNext}
                    disabled={processing}
                    className="hidden h-11 shrink-0 items-center gap-2 rounded-box-sm border-2 border-black bg-[#FF007F] px-6 text-xs font-black uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60 motion-reduce:transform-none sm:inline-flex"
                >
                    {processing && <Loader2 size={16} className="animate-spin" strokeWidth={3} />}
                    {actionLabel}
                </button>
            }
            header={
                activeSteps.length > 1 ? (
                    // Named steps, not three anonymous bars. On a full-width
                    // header a bare meter says how far along the creator is but
                    // never what is left — and "what am I still going to be
                    // asked" is the question that decides whether they finish.
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {activeSteps.map((entry, position) => (
                            <span
                                key={entry.key}
                                className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                                    position === index
                                        ? "border-[#FF007F] bg-[#FF007F] text-white"
                                        : position < index
                                          ? "border-white/40 text-white/70"
                                          : "border-white/15 text-white/35"
                                }`}
                            >
                                <span aria-hidden="true">{position + 1}</span>
                                <span className="hidden sm:inline">{entry.title}</span>
                            </span>
                        ))}
                    </div>
                ) : null
            }
            footer={
                <div className="space-y-3">
                    {visibleError && (
                        <p
                            role="alert"
                            className="rounded-box-sm border-[3px] border-black bg-[#FFE0EC] px-4 py-3 text-left text-xs font-bold text-black"
                        >
                            {visibleError}
                        </p>
                    )}
                    {/* The action stays a thumb-width control on a phone and a
                        sized button on desktop — a full-bleed 1440px pink bar is
                        not a button, it is a stripe. */}
                    <div className="flex items-center gap-3 md:justify-end">
                        {index > 0 && (
                            <button
                                type="button"
                                onClick={goBack}
                                disabled={processing}
                                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-box-sm border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                                aria-label="Back"
                            >
                                <ArrowLeft size={20} strokeWidth={3} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={processing}
                            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-box-sm border-[3px] border-black bg-[#FF007F] px-8 text-base font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 md:flex-none md:min-w-[220px]"
                        >
                            {processing && <Loader2 size={18} className="animate-spin" strokeWidth={3} />}
                            {actionLabel}
                        </button>
                    </div>
                    {activeSteps.length > 1 && (
                        <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400 md:hidden">
                            Step {index + 1} of {activeSteps.length}
                        </p>
                    )}
                </div>
            }
        >
            {/* Full-page now, so the form gets a readable measure instead of
                stretching to 1440px, and the preview sits beside it rather than
                below the fold. Without a preview the single column is capped —
                a 1400px-wide text input is unreadable and looks unfinished. */}
            <div
                className={
                    preview
                        ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10"
                        : "mx-auto max-w-2xl"
                }
            >
                <div className="min-w-0 rounded-box border-[3px] border-black bg-white p-5 sm:p-6">
                    {step?.hint && (
                        <p className="mb-5 text-left text-sm font-medium text-neutral-500">{step.hint}</p>
                    )}
                    {step?.render?.()}
                </div>

                {preview && (
                    <aside className="hidden lg:block">
                        <div className="sticky top-0">{preview()}</div>
                    </aside>
                )}
            </div>
        </Sheet>
    );
}
