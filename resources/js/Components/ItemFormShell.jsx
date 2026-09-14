import { useCallback, useEffect, useMemo, useState } from "react";
import Sheet from "@/Components/Sheet";
import { ArrowLeft, Loader2 } from "lucide-react";

/**
 * The shared skeleton for creating or editing any sellable item.
 *
 * Every module used to render one long scrolling form and only reveal its
 * problems after a submit round-trip, which is what made adding a wish or a
 * shop item feel improvised. This splits the work into short steps and blocks
 * moving forward until the current step is valid.
 *
 * 🚨 THERE IS ONE PRIMARY ACTION AND IT IS AT THE END OF THE STEP (client
 * direction, 12 Sep 2026). It used to be drawn twice — once pinned in the
 * header bar and once under the fields — and a duplicated action on a stepped
 * form is a person pressing the top one before reading the step and collecting
 * a validation error for it. Nothing is pinned now; see `Sheet`.
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
            // ⚠️ The panel is one long scroll now, so advancing a step without
            // this leaves the reader looking at the FOOT of the step they just
            // finished — the new fields are above them and nothing on screen
            // says the form moved. Scrolls the scroll container itself, which
            // is the Dialog.Panel (see Sheet), not the window.
            document
                .querySelector("[data-sheet-scroll]")
                ?.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        onSubmit?.();
    }, [isLast, onSubmit, step]);

    const goBack = useCallback(() => {
        setIndex((current) => Math.max(0, current - 1));
        document
            .querySelector("[data-sheet-scroll]")
            ?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const visibleError = stepError || error;
    const actionLabel = processing ? "Processing…" : isLast ? submitLabel : "Continue";

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={title}
            /* The step's own hint is the lead paragraph under the headline —
               the place the setup-complete panel puts its one sentence. A hint
               drawn again above the fields would say it twice on one screen. */
            subtitle={subtitle || step?.hint}
            size={preview ? "4xl" : "2xl"}
            header={
                activeSteps.length > 1 ? (
                    // Named steps, not three anonymous bars. A bare meter says
                    // how far along the creator is but never what is left — and
                    // "what am I still going to be asked" is the question that
                    // decides whether they finish.
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:gap-2">
                        {activeSteps.map((entry, position) => (
                            /* ⚠️ THE ACTIVE STEP KEEPS ITS WORDS ON A PHONE.
                               Every label used to be `hidden sm:inline`, so at
                               390px the rail was three bare numbers — a meter
                               that says how far along you are and never what
                               you are being asked. The step you are ON is the
                               one label worth the width; the others stay
                               numbers. */
                            <span
                                key={entry.key}
                                aria-current={position === index ? "step" : undefined}
                                className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] transition-colors sm:gap-2 sm:px-3 sm:text-[12px] ${
                                    position === index
                                        ? "border-black bg-[#FF007F] text-black"
                                        : position < index
                                          ? "border-black bg-white text-black"
                                          : "border-black/20 bg-transparent text-black/45"
                                }`}
                            >
                                <span aria-hidden="true">{position + 1}</span>
                                <span className={position === index ? "inline" : "hidden sm:inline"}>
                                    {entry.title}
                                </span>
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
                            className="rounded-box-sm border-2 border-black bg-[#FFE0EC] px-4 py-3 text-left text-xs font-bold text-black"
                        >
                            {visibleError}
                        </p>
                    )}
                    {/* The action stays a thumb-width control on a phone and a
                        sized button on desktop — a full-bleed 1440px pink bar is
                        not a button, it is a stripe. */}
                    <div className="flex items-center gap-3 md:justify-start">
                        {index > 0 && (
                            <button
                                type="button"
                                onClick={goBack}
                                disabled={processing}
                                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-box-sm border-2 border-black bg-white transition-all active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                                aria-label="Back"
                            >
                                <ArrowLeft size={20} strokeWidth={3} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={processing}
                            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-box-sm border-2 border-black bg-[#FF007F] px-8 text-base font-black uppercase tracking-wide text-black transition-all active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-60 md:flex-none md:min-w-[240px]"
                        >
                            {processing && <Loader2 size={18} className="animate-spin" strokeWidth={3} />}
                            {actionLabel}
                        </button>
                    </div>
                </div>
            }
        >
            {/* The form gets a readable measure; the preview sits beside it
                rather than below the fold. */}
            <div
                className={
                    preview
                        ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10"
                        : ""
                }
            >
                {/* 🚨 NO CARD ON A PHONE. The sheet is already full-screen, so a
                    bordered card drawn immediately inside it is a second frame
                    around the same content — and it costs the form 22px of width
                    on each side (2px frame + 20px padding) at exactly the width
                    where there is none to spare. Above `sm` the panel is wide
                    enough for the card to do its job of holding the form
                    together as one block.

                    ⚠️ The resets carry `!` because `border-black` is redefined in
                    `resources/css/index.css` as a full `border` shorthand AFTER
                    the utilities layer — an unflagged `max-sm:border-0` loses on
                    source order and the frame silently survives at 2px. */}
                <div className="min-w-0 rounded-box border-2 border-black bg-white p-5 sm:p-7 max-sm:!rounded-none max-sm:!border-0 max-sm:!bg-transparent max-sm:!p-0">
                    {step?.render?.()}
                </div>

                {preview && (
                    <aside className="hidden lg:block">
                        <div>{preview()}</div>
                    </aside>
                )}
            </div>
        </Sheet>
    );
}
