import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle, Clock, Ban, X } from "lucide-react";

/**
 * The moderation state of a listing, as a CHIP the creator taps to read.
 *
 * 🚨 It replaces a block that was `position: absolute` and never in flow.
 * `home.css:531` sets `.approvalmessge.membership { position:absolute; top:0;
 * left:0 }`, so the notice painted OVER the card's image — through the drag
 * handle, the save button and the kebab menu — and no margin or padding on the
 * element could move it. At two columns that made the top third of a held card
 * unreadable and its controls untappable.
 *
 * ⚠️ The reason text is admin-written and arbitrary-length, which is the whole
 * problem: any layout that renders it inline is one long sentence away from
 * pushing a card's price and CTA out of step with its neighbour in the row. A
 * chip is a FIXED height whatever the message says, and the message itself gets
 * a dialog with room to be read properly.
 */

/**
 * ⚠️ Ranked most severe first, and the ORDER IS THE BEHAVIOUR — the chip wears
 * the worst state and the dialog lists them worst-first. A suspended listing
 * that is also unapproved is a SUSPENDED listing; leading with "in review"
 * would tell its creator to wait for something that is not coming.
 */
const RANK = ["suspended", "changes", "in_review"];

const TONES = {
    in_review: {
        Icon: Clock,
        label: "In review",
        // Amber, not red: waiting is not a failure, and a card that shouts at a
        // creator who has done nothing wrong is how these get ignored.
        chip: "border-[#E8B400] bg-[#FFF6DF] text-[#8A6A00]",
        dot: "bg-[#E8B400]",
        heading: "Waiting for review",
        fallback:
            "This listing is waiting for approval. Only you can see it until it goes live — there is nothing for you to do.",
    },
    changes: {
        Icon: AlertTriangle,
        label: "Changes needed",
        chip: "border-[#D11A2A] bg-[#FFEDEE] text-[#A2101D]",
        dot: "bg-[#D11A2A]",
        heading: "Changes requested",
        fallback:
            "An admin asked for a change before this can go live. Edit the listing and it returns for review.",
    },
    suspended: {
        Icon: Ban,
        label: "Suspended",
        chip: "border-[#D11A2A] bg-[#D11A2A] text-white",
        dot: "bg-white",
        heading: "Listing suspended",
        fallback: "This listing has been taken off sale.",
    },
};

export default function ItemStatusBadge({
    // A list, because a listing can genuinely be in more than one state at once
    // — suspended AND carrying an admin's change request, say. Showing only the
    // worst would hide work the creator still has to do.
    notices,
    // Single-notice form, kept so a caller with one state does not have to build
    // an array.
    state,
    reason,
    itemName,
    // Full-width by default (a row of its own above the content). Pass false to
    // sit it over an image, where it should be only as wide as its own words.
    // ⚠️ A prop rather than letting a caller pass `w-auto` in `className`:
    // Tailwind resolves `w-full` vs `w-auto` by STYLESHEET order, not class
    // order, so the override would be a coin flip — and `npm run check`'s
    // conflicting-utility scanner fails the build on exactly that pair.
    block = true,
    className = "",
}) {
    const [open, setOpen] = useState(false);

    const list = (notices && notices.length ? notices : [{ state, reason }])
        .filter((n) => n && TONES[n.state])
        .sort((a, b) => RANK.indexOf(a.state) - RANK.indexOf(b.state));

    if (!list.length) return null;

    const lead = list[0];
    const tone = TONES[lead.state];
    const { Icon } = tone;
    const extra = list.length - 1;

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    // The whole card is a click target that opens the item, so
                    // without this the dialog opens and the card navigates away
                    // underneath it.
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true);
                }}
                aria-label={
                    extra
                        ? `${tone.label} and ${extra} more — read why`
                        : `${tone.label} — read why`
                }
                className={`inline-flex min-h-[24px] max-w-full items-center justify-center gap-1 rounded-box-sm border-2 px-1.5 text-[9px] font-black uppercase tracking-wide transition-colors sm:min-h-[32px] sm:gap-1.5 sm:px-2 sm:text-[11px] ${block ? "w-full" : "w-auto"} ${tone.chip} ${className}`}
            >
                <Icon size={12} strokeWidth={3} className="shrink-0" />
                <span className="truncate">{tone.label}</span>
                {/* ⚠️ A COUNT, not a second chip. Two chips stacked cost another
                    row of height on a card whose height is already the thing
                    being managed, and the second state is readable one tap away
                    either way. */}
                {extra > 0 ? (
                    <span
                        className="shrink-0 rounded-full border border-current px-1 leading-[1.4]"
                        aria-hidden="true"
                    >
                        +{extra}
                    </span>
                ) : (
                    <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`}
                    />
                )}
            </button>

            <Transition appear show={open} as={Fragment}>
                {/* 🚨 ABOVE the bottom bar (z-index 999999) and the drawer
                    (1000002). At `z-[9996]` the bar painted straight over this
                    panel, and because it also opened bottom-anchored the message
                    landed exactly where the bar is — so the text the chip exists
                    to show was the one thing hidden. */}
                <Dialog
                    as="div"
                    className="relative z-[1000003]"
                    onClose={() => setOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-150"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        {/* bottom-bar-safe: Dialog is z-[1000003], above the bar; backdrop only */}
                        <div className="fixed inset-0 bg-black/60" />
                    </Transition.Child>

                    {/* ⚠️ CENTRED at every width, not bottom-anchored on a phone.
                        The bottom of this app is occupied — nav bar plus the
                        Intercom launcher — so a sheet rising from it is the one
                        position guaranteed to be covered. */}
                    {/* bottom-bar-safe: Dialog is z-[1000003], above the bar; panel is centred */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-2"
                            enterTo="opacity-100 translate-y-0"
                            leave="ease-in duration-100"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-2"
                        >
                            {/* `border-[#000]`, never `border-black` — that class is
                                redefined in index.css as a full `border` shorthand
                                and would silently reset this width to 2px.
                                ⚠️ `max-h` + scroll: an admin's reason has no length
                                limit, and two of them on a short phone would
                                otherwise run off both ends of the screen. */}
                            <Dialog.Panel
                                onClick={(e) => e.stopPropagation()}
                                className="flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-box border-[3px] border-[#000] bg-white"
                            >
                                <div className="flex items-start gap-3 border-b-2 border-black/10 p-4">
                                    <div className="min-w-0 flex-1">
                                        <Dialog.Title className="text-base font-black uppercase leading-tight text-black">
                                            {list.length > 1
                                                ? `${list.length} things to know`
                                                : tone.heading}
                                        </Dialog.Title>
                                        {itemName && (
                                            <p className="mt-0.5 truncate text-xs font-bold text-black/50">
                                                {itemName}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        aria-label="Close"
                                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#000] bg-white transition-colors hover:bg-black hover:text-white"
                                    >
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                                    <ul className="flex flex-col gap-4">
                                        {list.map((n, i) => {
                                            const t = TONES[n.state];
                                            const RowIcon = t.Icon;
                                            return (
                                                <li
                                                    key={n.state + i}
                                                    className="flex gap-3"
                                                >
                                                    <span
                                                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-box-sm border-2 ${t.chip}`}
                                                    >
                                                        <RowIcon
                                                            size={14}
                                                            strokeWidth={3}
                                                        />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        {/* Each notice keeps its own
                                                            heading, so two of them can
                                                            never read as one run-on
                                                            message. */}
                                                        <p className="text-[13px] font-black uppercase leading-tight text-black">
                                                            {t.heading}
                                                        </p>
                                                        {/* `whitespace-pre-line` because
                                                            an admin writes this by hand
                                                            and their line breaks carry
                                                            meaning. */}
                                                        <p className="mt-1 whitespace-pre-line text-sm font-medium leading-[1.55] text-black/80">
                                                            {(n.reason || "").trim() ||
                                                                t.fallback}
                                                        </p>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
