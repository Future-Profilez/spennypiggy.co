import GoogleButton, { AuthDivider } from "@/Components/GoogleButton";
import { ROLE_CREATOR, ROLE_SUPPORTER, ACCENT } from "./constants";

/**
 * First screen. Two paths, each stating what the person gets — the old cards
 * said "I'd like to create a wishlist" and "I'm here to follow and support
 * creators", which describe a feature and an intention rather than an outcome.
 *
 * Both are <button>s, not clickable <div>s: this is the first interactive
 * element on the page and it has to be reachable by keyboard.
 */

const Arrow = () => (
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
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

function PathCard({ accent, eyebrow, title, lines, footnote, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full flex-col rounded-box border-[3px] border-black bg-white p-5 text-left transition-transform duration-200 sm:p-6 ${accent.shadow} hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 motion-reduce:hover:translate-y-0`}
        >
            <span
                className="w-fit rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em] text-white"
                style={{ backgroundColor: accent.hex }}
            >
                {eyebrow}
            </span>

            <span className="mt-3 font-gulfs text-xl uppercase leading-tight text-black sm:text-2xl">
                {title}
            </span>

            <ul className="mt-3 flex-1 space-y-1.5 text-sm text-black/70">
                {lines.map((line) => (
                    <li key={line} className="flex gap-2.5">
                        <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: accent.hex }}
                        />
                        {line}
                    </li>
                ))}
            </ul>

            <span className="mt-4 flex items-center justify-between gap-3 border-t-2 border-dashed border-black/10 pt-3">
                <span className="text-xs text-black/60">{footnote}</span>
                <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-black text-white transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                    style={{ backgroundColor: accent.hex }}
                >
                    <Arrow />
                </span>
            </span>
        </button>
    );
}

export default function RoleChooser({ onChoose, plan, googleEnabled = false }) {
    const freeRun = plan?.free_until_first_sale;

    return (
        <div>
            <h1 className="font-gulfs text-2xl uppercase leading-[1.05] text-white sm:text-4xl">
                What brings you
                <br />
                to Spenny Piggy?
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/70">
                You can buy and sell from either one, and switch any time.
            </p>

            <div className="mt-4 grid gap-4 sm:mt-6 md:grid-cols-2">
                <PathCard
                    accent={ACCENT[ROLE_CREATOR]}
                    eyebrow="I'm a creator"
                    title="Sell my content"
                    lines={[
                        "Your own page for content, memberships and paid requests",
                        "Supporters pay you directly through Stripe",
                        "Weekly payouts straight to your bank",
                    ]}
                    footnote={
                        freeRun
                            ? plan?.promise || "No charge until your first sale"
                            : "Set up in a few minutes"
                    }
                    onClick={() => onChoose(ROLE_CREATOR)}
                />

                <PathCard
                    accent={ACCENT[ROLE_SUPPORTER]}
                    eyebrow="I'm here to support"
                    title="Back the creators I follow"
                    lines={[
                        "Buy content, memberships and one-off requests",
                        "Everything you unlock stays in your library",
                        "Manage every subscription from one screen",
                    ]}
                    footnote="Free — you only pay for what you buy"
                    onClick={() => onChoose(ROLE_SUPPORTER)}
                />
            </div>

            {/* Below the two paths, not above them: the choice of what you are here to do is the
                point of this screen, and Google only saves typing later. Either path can be
                started with it — the role is still picked here afterwards. */}
            {googleEnabled && (
                <>
                    <AuthDivider label="or start with" />
                    <GoogleButton enabled className="max-w-sm sm:mx-auto" />
                </>
            )}
        </div>
    );
}
