import { useState } from "react";
import FadeIn from "@/Components/animations/FadeIn";
import { usePwaInstall } from "@/lib/pwaInstall";
import appIcon from "../../../assets/siteicon.png";

/**
 * "Put it on your phone" — THE APP, DRAWN AS A PHONE THAT IS TELLING YOU SOMETHING.
 *
 * 🚨 THE SUBJECT IS THE NOTIFICATION, NOT THE ICON. An app tile on a home screen
 * says the app exists and nothing about why a creator would install it. What
 * installing actually buys them is being told the second somebody buys, so the
 * drawing is a lock screen mid-alert and the copy is the three beats around it:
 * add it → someone buys → your phone says so. The same reasoning is written up on
 * `Components/Promo/cards/InstallAppCard.jsx`, which learned it the hard way.
 *
 * ⚠️ TWO DRAWINGS OF A PHONE NOW EXIST AND THAT IS DELIBERATE. The promo card's
 * is a lock-screen crop inside a 150px card at roughly a third of life size; this
 * is a whole device at ~290px with body, bezel and side buttons. Parameterising
 * one component across both scales would be props-soup, and the promo file
 * already states that a drawing at that size carries its own radii. Keep them in
 * step by hand if the notification copy changes.
 *
 * 🚨 NO AMOUNTS IN THE NOTIFICATIONS. A figure invented for a mock is still a
 * figure on a marketing surface, and the promo deck already shipped one wrong
 * price that way. The alerts name the CONTENT that sold, which is also the
 * content-first line the whole platform has to hold.
 *
 * ⚠️ These are the app's own radii (46/38/18px), not the house `rounded-box`
 * tokens — a 30px corner on a 290px phone is not a phone. Same exception the
 * landing page's product mock-ups take.
 */

/** One push notification, as iOS draws it: frosted slab, app mark, then the news. */
function PushCard({ title, body, when, dimmed = false }) {
    return (
        <div
            className={`flex items-start gap-2.5 rounded-[18px] border border-white/15 bg-white/[0.13] px-3 py-2.5 backdrop-blur-md ${
                dimmed ? "opacity-45" : ""
            }`}
        >
            <img
                src={appIcon}
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
                loading="lazy"
                className="h-8 w-8 shrink-0 rounded-[9px] border border-white/20 object-cover"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
                        Spenny Piggy
                    </span>
                    <span className="shrink-0 text-[10px] text-white/70">{when}</span>
                </div>
                <p className="mt-0.5 truncate text-[13px] font-bold text-white">
                    {title}
                </p>
                <p className="truncate text-[12px] text-white/60">{body}</p>
            </div>
        </div>
    );
}

function PhoneMock() {
    /* 🚨 THE SCREEN IS AN ASPECT RATIO, NOT A CONTENT HEIGHT. The first version let
       the notification stack decide how tall the device was, and three cards is not
       enough content to fill a phone — it came out at about 1.46:1 against a real
       iPhone's 19.5:9 (~2.17:1), which reads as a tablet, not the thing in the
       reader's hand. The frame is fixed and the contents distribute inside it:
       clock at the top, alerts pushed to the bottom the way iOS stacks them. */
    return (
        <div
            aria-hidden="true"
            className="relative mx-auto w-[224px] sm:w-[244px] lg:w-[264px]"
        >
            {/* Side buttons — three slivers are the difference between "a phone" and
                "a rounded rectangle". Positioned in PERCENT so they stay on the
                volume rocker at every width. */}
            <span className="absolute -left-[3px] top-[15%] h-[5.5%] w-[3px] rounded-l-full bg-[#6E6E7A]" />
            <span className="absolute -left-[3px] top-[22%] h-[5.5%] w-[3px] rounded-l-full bg-[#6E6E7A]" />
            <span className="absolute -right-[3px] top-[19%] h-[8%] w-[3px] rounded-r-full bg-[#6E6E7A]" />

            {/* 🚨 THE DEVICE FRAME IS TITANIUM, NOT BLACK. The house frame is a black
                hairline, and on this section's near-black ground a black phone on a
                black page has no edge at all — the drawing read as a floating
                screen. A real phone's frame is brushed metal, so the body is a
                three-stop grey gradient with a white hairline: it separates from
                the ground, it is not a brand accent competing with the pink CTA
                beside it, and it is what the object actually looks like. */}
            <div
                className="rounded-[38px] border border-white/25 p-[2.6%] sm:rounded-[42px] lg:rounded-[46px]"
                style={{
                    background:
                        "linear-gradient(160deg, #6E6E7A 0%, #2B2B33 28%, #23232B 62%, #6E6E7A 100%)",
                }}
            >
                <div className="relative flex aspect-[9/18.5] flex-col overflow-hidden rounded-[32px] sm:rounded-[36px] lg:rounded-[40px] bg-[#0B0B10]">
                    {/* Wallpaper. The screen is #0B0B10 rather than pure black so the
                        dynamic island reads as a cutout instead of disappearing. */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(120% 60% at 15% 0%, rgba(255,0,127,0.34), transparent 58%), radial-gradient(110% 65% at 95% 100%, rgba(5,239,184,0.26), transparent 60%)",
                        }}
                    />

                    {/* Status bar */}
                    <div className="relative flex items-center justify-between px-5 pb-1 pt-[3.5%]">
                        <span className="text-[11px] font-semibold text-white">9:41</span>
                        <span className="absolute left-1/2 top-[8px] h-[20px] w-[68px] -translate-x-1/2 rounded-full bg-black sm:h-[22px] sm:w-[74px]" />
                        <span className="flex items-center gap-[3px]">
                            {[5, 7, 9, 11].map((h) => (
                                <span
                                    key={h}
                                    className="block w-[2px] rounded-sm bg-white"
                                    style={{ height: h }}
                                />
                            ))}
                            <span className="ml-[3px] block h-[10px] w-[17px] rounded-[3px] border border-white/70 p-[1.5px]">
                                <span className="block h-full w-2/3 rounded-[1px] bg-white" />
                            </span>
                        </span>
                    </div>

                    {/* Lock screen clock */}
                    <div className="relative px-5 pt-[7%] text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                            Tuesday 12 March
                        </p>
                        <p className="text-[44px] font-bold leading-none tracking-[-0.03em] text-white sm:text-[50px]">
                            9:41
                        </p>
                    </div>

                    {/* The stack. Two live alerts and one tucked behind: a single
                        notification reads as a screenshot, a stack reads as a phone
                        that keeps telling you things — which is the actual offer.
                        `mt-auto` puts them where iOS puts them, at the bottom. */}
                    <div className="relative mt-auto space-y-2 px-[4%] pb-[4%]">
                        <FadeIn y={14} duration={0.5} delay={0.1}>
                            <PushCard
                                title="New purchase — Studio Setup"
                                body="Tap to see what to send"
                                when="now"
                            />
                        </FadeIn>
                        <FadeIn y={14} duration={0.5} delay={0.28}>
                            <PushCard
                                title="New member joined"
                                body="Inner Circle — monthly"
                                when="2m"
                            />
                        </FadeIn>
                        <FadeIn y={14} duration={0.5} delay={0.46}>
                            <PushCard
                                title="Paid task approved"
                                body="Delivery confirmed"
                                when="1h"
                                dimmed
                            />
                        </FadeIn>

                        {/* Home indicator */}
                        <div className="flex justify-center pt-3">
                            <span className="block h-[4px] w-[36%] rounded-full bg-white/70" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* The three beats ARE a sequence — install, sale, alert — so they are numbered.
   Nothing else on this page is. */
const BEATS = [
    {
        n: "01",
        title: "Add it to your home screen",
        body: "Ten seconds, from this page. No app store, no download.",
    },
    {
        n: "02",
        title: "Someone buys something",
        body: "A wish, a membership, a paid task — anything on your page.",
    },
    {
        n: "03",
        title: "Your phone tells you",
        body: "As it happens, so you can send it while they are still excited.",
    },
];

export default function AppShowcase() {
    const { canInstallNatively, installed, install, platformLabel, steps } =
        usePwaInstall();
    const [showSteps, setShowSteps] = useState(false);

    /* Nothing offers to install the app from inside the installed app. */
    if (installed) return null;

    const onInstall = async () => {
        if (canInstallNatively && (await install())) return;
        setShowSteps(true);
    };

    return (
        <div className="relative bg-transparent px-4 py-12 md:py-28">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
                <div className="order-2 lg:order-1">
                    <FadeIn y={20} duration={0.5}>
                        <span className="inline-block rounded-full bg-[#A2E4B8] px-4 py-1 text-sm font-black uppercase tracking-widest text-black">
                            📱 On your phone
                        </span>
                    </FadeIn>

                    <FadeIn y={24} delay={0.08} duration={0.6}>
                        <h2 className="fading mt-5 font-gulfs text-3xl uppercase leading-none tracking-[2px] text-white md:text-4xl lg:text-5xl">
                            Know the moment{" "}
                            <span className="text-gradient-wishlist">someone buys</span>
                        </h2>
                    </FadeIn>

                    <FadeIn y={20} delay={0.16}>
                        <p className="fading mt-5 max-w-xl text-lg font-medium leading-relaxed text-gray-300 md:text-xl">
                            Spenny Piggy installs straight from this page and opens like
                            any other app. Then it does the one thing a browser tab
                            cannot: it tells you the second a supporter buys, so nothing
                            waits for you to remember to check.
                        </p>
                    </FadeIn>

                    <ol className="mt-8 space-y-4">
                        {BEATS.map((beat, i) => (
                            <FadeIn key={beat.n} y={18} delay={0.22 + i * 0.08}>
                                <li className="flex items-start gap-4">
                                    <span className="mt-[2px] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#FF007F] font-gulfs text-[13px] text-[#FF007F]">
                                        {beat.n}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[17px] font-black uppercase tracking-wide text-white">
                                            {beat.title}
                                        </span>
                                        <span className="mt-1 block text-[15px] leading-relaxed text-gray-400">
                                            {beat.body}
                                        </span>
                                    </span>
                                </li>
                            </FadeIn>
                        ))}
                    </ol>

                    <FadeIn y={18} delay={0.5}>
                        <div className="mt-9">
                            {/* Black on pink — white measures 3.78:1 on this fill and
                                fails AA. Brightness on press, never a scale. */}
                            <button
                                type="button"
                                onClick={onInstall}
                                className="min-h-[52px] rounded-full border-2 border-black bg-[#FF007F] px-7 font-gulfs text-sm uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                            >
                                {canInstallNatively ? "Add to home screen" : "Show me how"}
                            </button>

                            {/* ⚠️ Safari and every iPhone browser refuse to install a site
                                on their own, so the written steps are not a fallback for
                                a broken button — for most of this page's mobile readers
                                they are the only route there is. */}
                            {showSteps && (
                                <div className="mt-5 max-w-md rounded-[20px] border border-white/15 bg-white/[0.06] p-5">
                                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#A2E4B8]">
                                        {platformLabel}
                                    </p>
                                    <ol className="mt-3 space-y-2">
                                        {steps.map((step, i) => (
                                            <li
                                                key={step}
                                                className="flex gap-3 text-[15px] leading-relaxed text-gray-200"
                                            >
                                                <span className="font-gulfs text-[#FF007F]">
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            <p className="mt-4 text-[13px] text-gray-400">
                                Free, and you can remove it like any other app. Alerts
                                start once you allow notifications.
                            </p>
                        </div>
                    </FadeIn>
                </div>

                <FadeIn y={30} delay={0.1} duration={0.7} className="order-1 lg:order-2">
                    <PhoneMock />
                </FadeIn>
            </div>
        </div>
    );
}
