import { Link } from '@inertiajs/react';

/**
 * "What do I actually do about it" — the steps, in order, each one an action.
 *
 * ⚠️ The activity page previously reported a state and nothing else: a badge, a
 * count, a heatmap, and several paragraphs of rule. Creators read it and still
 * asked what was wrong, because a diagnosis is not an instruction. Every row here
 * is something the creator can DO, and the copy is written from their side of the
 * screen — "publish 2 more posts for members", never "below the posting threshold".
 *
 * The steps come from PostingCadenceService::statusFor so the page, the profile
 * strip and the warning email cannot describe different requirements.
 */
export default function CadenceChecklist({ checklist = [], className = '' }) {
    if (!checklist.length) return null;

    return (
        <section
 className={`rounded-box border-[3px] border-black bg-white p-5 sm:p-6 ${className}`}
            aria-label="Steps to keep your payments running"
        >
            <h2 className="font-gulfs text-xl uppercase text-black">
                Your checklist
            </h2>
            <p className="mt-1 text-sm font-medium text-black/60">
                Work down this list. Everything restarts on its own — there is nothing to submit and nobody to email.
            </p>

            <ol className="mt-5 space-y-3">
                {checklist.map((item) => (
                    <li
                        key={item.key}
                        className={`rounded-box-sm border-2 p-4 ${
                            item.done
                                ? 'border-black/15 bg-black/[0.03]'
 : 'border-black bg-white '
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                aria-hidden="true"
                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-black ${
                                    item.done
                                        ? 'border-[#1E9E5A] bg-[#1E9E5A] text-white'
                                        : 'border-black bg-white text-black'
                                }`}
                            >
                                {item.done ? '✓' : ''}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-[15px] font-black leading-snug ${
 item.done ? 'text-black/60' : 'text-black'
                                    }`}
                                >
                                    {item.label}
                                </p>
                                <p className="mt-1 text-[13px] font-medium leading-relaxed text-black/60">
                                    {item.detail}
                                </p>

                                {item.cta_label && item.cta_route && !item.done && (
                                    <Link
                                        href={route(item.cta_route, item.cta_params || {})}
 className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-2 border-black bg-[#FF007F] px-5 text-xs font-black uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                                    >
                                        {item.cta_label}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
