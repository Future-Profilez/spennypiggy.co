import { Search, Unlock, Download } from 'lucide-react';

/**
 * A first-timer's map of the purchase. Discover is where someone who has never
 * bought anything decides whether to — and the page never said what happens
 * after you pay. Three steps, stated plainly, in the platform's own vocabulary.
 *
 * Rendered for signed-out visitors only: an existing supporter already knows.
 */
const STEPS = [
    {
        icon: Search,
        title: 'Find a creator',
        body: 'Browse who’s trending, or search for someone you already follow.',
    },
    {
        icon: Unlock,
        title: 'Pick what you want',
        body: 'Every listing shows what you get before you pay — a file, a message, a link or a service.',
    },
    {
        icon: Download,
        title: 'Get it straight away',
        body: 'Your content unlocks on the confirmation page and lands in your email.',
    },
];

export default function HowItWorks() {
    return (
        <section className="!pb-[40px]">
            <div className="overflow-hidden rounded-box bg-[#0E0E12] px-6 py-8 md:px-10 md:py-9">
                <div className="mb-6 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" />
                    <h2 className="font-anton text-lg uppercase tracking-wide text-white md:text-xl">
                        New here? It takes three steps
                    </h2>
                </div>

                <ol className="grid gap-5 sm:grid-cols-3">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <li key={s.title} className="relative">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-box-sm border border-white/10 bg-white/[0.05] text-[#FF007F]">
                                        <Icon size={16} strokeWidth={2.5} />
                                    </span>
                                    <span className="font-anton text-[13px] uppercase tracking-[0.16em] text-white/60">
                                        Step {i + 1}
                                    </span>
                                </div>
                                <h3 className="mt-3 text-[15px] font-bold text-white">{s.title}</h3>
                                <p className="mt-1 text-[13px] leading-relaxed text-white/60">{s.body}</p>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
