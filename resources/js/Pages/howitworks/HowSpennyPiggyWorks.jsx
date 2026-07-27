import { Head, Link } from "@inertiajs/react";
import { useRef, useState, useEffect } from "react";
import Guest from "@/Layouts/GuestLayout";
import {
    motion,
    useScroll,
    useTransform,
    useReducedMotion,
} from "framer-motion";
import {
    ShieldCheck,
    Sparkles,
    Crown,
    PiggyBank,
    Wand2,
    ClipboardCheck,
    ShoppingBag,
    FileCheck2,
    UserRound,
    RefreshCcw,
    CreditCard,
    Check,
    X,
    Ban,
} from "lucide-react";

/* ── design tokens ──────────────────────────────────────────────── */
const display = "font-['gulfs'] uppercase";
const heavy = "font-['Anton']";
const INK = "#1C1B1A";
const PAGE = "#FAF8F4";
const MUTE = "#5C574F";
const PINK = "#FF007F";
const MINT = "#05EFB8";
const VIOLET = "#8C52FF";
const YELLOW = "#E6EA7B";
const SHADE = { [PINK]: "#C40063", [MINT]: "#04C497", [VIOLET]: "#6A28E0", [YELLOW]: "#B9BE45" };
const isDark = (a) => a === PINK || a === VIOLET;

/* emil: strong custom curve, tight durations, subtle stagger */
const EASE = [0.23, 1, 0.32, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const riseIn = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const popIn = { hidden: { opacity: 0, y: 14, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } } };

const Reveal = ({ children, className = "" }) => (
    <motion.section className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        {children}
    </motion.section>
);

const dotBg = {
    backgroundImage: "radial-gradient(rgba(28,27,26,0.05) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
};

/* ── section shell — icon chip + ghost numeral + title + accent rule ── */
const Section = ({ no, icon: Icon, accent, title, children, className = "" }) => (
    <Reveal className={`py-11 md:py-14 ${className}`}>
        <motion.div variants={riseIn} className="mb-5 flex items-center gap-3">
            <span
                className="grid h-11 w-11 flex-none place-items-center rounded-[13px] border-2"
                style={{ borderColor: INK, background: accent, color: isDark(accent) ? "#fff" : INK, boxShadow: `3px 3px 0 0 ${INK}` }}
            >
                <Icon size={22} strokeWidth={2.3} />
            </span>
            <span className={`${heavy} text-[34px] leading-none`} style={{ color: accent }}>{no}</span>
        </motion.div>
        <motion.h2 variants={riseIn} className={`${display} max-w-3xl text-[26px] leading-[0.95] tracking-tight md:text-[36px]`} style={{ color: INK }}>
            {title}
        </motion.h2>
        <motion.div variants={riseIn} className="mb-6 mt-4 h-[3px] w-14 rounded-full" style={{ background: accent }} />
        {children}
    </Reveal>
);

const Prose = ({ children }) => (
    <motion.p variants={riseIn} className="max-w-3xl text-[16px] leading-relaxed" style={{ color: MUTE }}>
        {children}
    </motion.p>
);
const B = ({ children }) => <strong className="font-bold" style={{ color: INK }}>{children}</strong>;

const Pill = ({ l, value }) => (
    <motion.span variants={popIn} className="inline-flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2" style={{ borderColor: INK, boxShadow: `2px 2px 0 0 ${INK}` }}>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{l}</span>
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#FF007F]">{value}</span>
    </motion.span>
);

/* ── horizontal feature card ────────────────────────────────────── */
const HCard = ({ icon: Icon, title, object, body, accent, index }) => {
    const dark = isDark(accent);
    const deep = SHADE[accent] || accent;
    return (
        <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 320, damping: 26 }} className="h-[448px] w-[300px] shrink-0 sm:w-[348px]">
            <div className="flex h-full flex-col overflow-hidden rounded-[24px] border-2 bg-white" style={{ borderColor: INK, boxShadow: `5px 5px 0 0 ${accent}` }}>
                <div className="relative h-[120px] flex-none overflow-hidden px-6 pt-6" style={{ background: `linear-gradient(140deg, ${accent}, ${deep})` }}>
                    <span className={`${heavy} pointer-events-none absolute -right-1 -top-5 select-none text-[104px] leading-none`} style={{ color: dark ? "rgba(255,255,255,0.20)" : "rgba(28,27,26,0.14)" }}>
                        {String(index).padStart(2, "0")}
                    </span>
                </div>
                <div className="relative">
                    <span className="absolute -top-8 left-6 grid h-[54px] w-[54px] place-items-center rounded-[15px] border-2" style={{ background: "#fff", borderColor: INK, color: INK, boxShadow: `3px 3px 0 0 ${INK}` }}>
                        <Icon size={25} strokeWidth={2.3} />
                    </span>
                </div>
                <div className="flex flex-1 flex-col px-6 pb-6 pt-10">
                    <h3 className={`${display} text-[20px] leading-[0.95] tracking-tight`} style={{ color: INK }}>{title}</h3>
                    {object && <span className="mt-2 text-[10px] font-bold leading-snug text-gray-400">{object}</span>}
                    <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: MUTE }}>{body}</p>
                </div>
            </div>
        </motion.div>
    );
};

const HorizontalFeatures = ({ features }) => {
    const reduce = useReducedMotion();
    const targetRef = useRef(null);
    const trackRef = useRef(null);
    const [dims, setDims] = useState({ dist: 0, vh: 800 });
    const { scrollYProgress } = useScroll({ target: targetRef });
    const x = useTransform(scrollYProgress, [0, 1], [0, -dims.dist]);

    useEffect(() => {
        const calc = () => {
            if (!trackRef.current) return;
            setDims({ dist: Math.max(0, trackRef.current.scrollWidth - window.innerWidth), vh: window.innerHeight });
        };
        calc();
        const id = setTimeout(calc, 150);
        window.addEventListener("resize", calc);
        return () => { clearTimeout(id); window.removeEventListener("resize", calc); };
    }, [features.length]);

    if (reduce) {
        return (
            <div className="hideScroll flex snap-x gap-6 overflow-x-auto px-5">
                {features.map((f, i) => <div key={f.title} className="snap-start"><HCard {...f} index={i + 1} /></div>)}
            </div>
        );
    }
    return (
        <section ref={targetRef} style={{ height: `${dims.dist + dims.vh}px` }} className="relative left-1/2 w-screen -translate-x-1/2">
            <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
                <motion.div ref={trackRef} style={{ x }} className="flex gap-6 pl-[max(20px,calc((100vw-1024px)/2))] pr-16">
                    {features.map((f, i) => <HCard key={f.title} {...f} index={i + 1} />)}
                </motion.div>
            </div>
        </section>
    );
};

const Marquee = () => {
    const items = ["Content first", "No donations", "No tips", "No gifts", "No transfers", "Strictly SFW"];
    const strip = [...items, ...items];
    return (
        <div className="relative overflow-hidden border-y-2 py-3" style={{ borderColor: INK, background: PINK }}>
            <div className="flex w-max animate-slide">
                {strip.map((t, i) => (
                    <span key={i} className={`${display} flex items-center gap-5 px-5 text-[15px] tracking-wide text-white`}>
                        {t}<Sparkles size={14} strokeWidth={2.6} className="text-[#E6EA7B]" />
                    </span>
                ))}
            </div>
        </div>
    );
};

/* ── page ───────────────────────────────────────────────────────── */
export default function HowSpennyPiggyWorks({ auth }) {
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll();
    const blobY1 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
    const blobY2 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 150]);

    const features = [
        { icon: Crown, title: "Memberships", object: "incl. Support & Bills memberships", accent: PINK, body: (<>A monthly content membership. The creator must publish at least <B>three posts per month</B>; if they stop posting, their payments are restricted. Tier names are chosen by the creator; optional extras (content bundles, community access) sit on top of the core membership content.</>) },
        { icon: PiggyBank, title: "Piggy Pot", accent: MINT, body: (<>A single piece of exclusive content. Any goal shown alongside it is context only, not the item purchased.</>) },
        { icon: Wand2, title: "Wishes", accent: VIOLET, body: (<>A single piece of exclusive content, delivered to the supporter (by download and email) on purchase.</>) },
        { icon: ClipboardCheck, title: "Paid Tasks", accent: YELLOW, body: (<>A personalised piece of content or a creator service, delivered within a set timeframe. Funds are held until the content is delivered.</>) },
        { icon: ShoppingBag, title: "Sell Something", accent: PINK, body: <>A digital or physical product, delivered or shipped by the creator.</> },
    ];

    const enforced = [
        "Every paid feature delivers content; nothing can be sold without it.",
        "Memberships (including Support and Bills memberships) require a minimum of three posts per month. If a creator stops posting, further payments and renewals are restricted.",
        "Delivery is recorded — content records, access and download logs, email-delivery records and timestamps — so each purchase can be verified.",
    ];
    const prohibited = ["Standalone donations", "Tips with no content", "Cash or financial gifts", "Personal or charitable fundraising", "Money transmission", "Debt or loan repayment", "Paying a person's expenses directly", "Any payment not tied to creator content"];

    return (
        <Guest auth={auth?.user || ""} className="bg-[#FAF8F4]">
            <Head title="How Spenny Piggy Works — Payments & Content">
                <meta name="description" content="How Spenny Piggy works: every payment buys creator content or a content membership. A plain-English payments and content policy for supporters and payment partners." head-key="description" />
                <meta property="og:title" content="How Spenny Piggy Works — Payments & Content" head-key="og:title" />
                <meta property="og:description" content="Every payment buys creator content, or a membership that delivers content. We do not process donations, tips, gifts or money transfers." head-key="og:description" />
                <meta property="og:type" content="website" head-key="og:type" />
                <meta property="og:url" content="https://spennypiggy.co/how-spenny-piggy-works" head-key="og:url" />
                <meta name="twitter:card" content="summary_large_image" head-key="twitter:card" />
                <link rel="canonical" href="https://spennypiggy.co/how-spenny-piggy-works" head-key="canonical" />
            </Head>

            <div className="relative overflow-x-clip" style={{ background: PAGE, color: INK }}>
                <div className="pointer-events-none absolute inset-0 z-0" style={dotBg} />
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    <motion.div style={{ y: blobY1 }} className="absolute -left-20 top-28 h-72 w-72 rounded-full bg-[#FF007F] opacity-[0.07] blur-3xl" />
                    <motion.div style={{ y: blobY2 }} className="absolute -right-10 top-1/2 h-80 w-80 rounded-full bg-[#8C52FF] opacity-[0.07] blur-3xl" />
                </div>

                {/* ── HERO ── */}
                <motion.header className="relative z-10 mx-auto max-w-5xl px-5 pt-24 md:pt-28" variants={container} initial="hidden" animate="show">
                    <motion.span variants={riseIn} className="inline-flex -rotate-1 items-center gap-2 rounded-full border-2 bg-[#E6EA7B] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ borderColor: INK, boxShadow: `2px 2px 0 0 ${INK}`, color: INK }}>
                        <Sparkles size={14} strokeWidth={2.8} /> Payments &amp; Content Policy
                    </motion.span>

                    <h1 className={`${display} mt-7 text-[clamp(42px,10vw,92px)] leading-[0.84] tracking-[-0.01em]`} style={{ color: INK }}>
                        <motion.span variants={riseIn} className="block">How</motion.span>
                        <motion.span variants={riseIn} className="relative inline-block text-[#FF007F]">
                            Spenny&nbsp;Piggy
                            <svg className="absolute -bottom-2 left-0 w-full" height="13" viewBox="0 0 300 13" preserveAspectRatio="none">
                                <motion.path d="M2 8 Q 75 2 150 6 T 298 5" stroke="#05EFB8" strokeWidth="5" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.5, ease: EASE }} />
                            </svg>
                        </motion.span>
                        <motion.span variants={riseIn} className="block">works</motion.span>
                    </h1>

                    <motion.p variants={riseIn} className="mt-7 max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: MUTE }}>
                        Spenny Piggy is a content marketplace. <B>Every payment buys creator content, or a membership that delivers content.</B> We do not process donations, tips, gifts or money transfers.
                    </motion.p>

                    <motion.div variants={container} className="mt-8 flex flex-wrap gap-2.5">
                        <Pill l="Version" value="1.0" /><Pill l="Effective" value="15 Jun 2026" /><Pill l="Operated by" value="Social Vortex Ltd" /><Pill l="Rating" value="Strictly SFW" />
                    </motion.div>
                </motion.header>

                <motion.div className="relative z-10 mt-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                    <Marquee />
                </motion.div>

                <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-6">
                    {/* 01 — statement panel */}
                    <Section no="01" icon={Sparkles} accent={PINK} title="The content-first principle">
                        <motion.div variants={riseIn} className="rounded-[24px] border-2 p-7 md:p-9" style={{ borderColor: INK, background: PINK, color: "#fff", boxShadow: `6px 6px 0 0 ${INK}` }}>
                            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">Core rule</p>
                            <p className={`${display} text-[20px] leading-[1.08] tracking-tight md:text-[27px]`}>
                                Every payment on Spenny Piggy is associated with creator content. <span className="text-[#E6EA7B]">A payment that delivers no content is not permitted</span> — it is restricted, refunded or removed.
                            </p>
                        </motion.div>
                        <motion.p variants={riseIn} className="mt-6 max-w-3xl text-[16px] leading-relaxed" style={{ color: MUTE }}>
                            Supporters always see what they are purchasing before they pay, and every transaction is recorded against the content or membership it relates to. A creator's reason for selling (for example, a goal or a bill they are working towards) may be shown as context, but what the supporter buys is always the content.
                        </motion.p>
                    </Section>

                    {/* 02 — heading + horizontal rail */}
                    <Section no="02" icon={FileCheck2} accent={MINT} title="What every payment buys">
                        <Prose>Each feature delivers a defined creator benefit.</Prose>
                    </Section>
                    <HorizontalFeatures features={features} />

                    {/* 03 — clean numbered list, hairlines (no boxes) */}
                    <Section no="03" icon={ClipboardCheck} accent={VIOLET} title="How content is delivered & enforced">
                        <motion.ul variants={container} className="max-w-3xl">
                            {enforced.map((item, i) => (
                                <motion.li key={i} variants={popIn} className="flex items-start gap-4 border-t-2 py-5 first:border-t-0" style={{ borderColor: "rgba(28,27,26,0.1)" }}>
                                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full border-2 bg-[#05EFB8]" style={{ borderColor: INK, color: INK }}>
                                        <Check size={15} strokeWidth={3.2} />
                                    </span>
                                    <p className="text-[15.5px] leading-relaxed" style={{ color: MUTE }}>{item}</p>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>

                    {/* 04 + 05 — prose */}
                    <Section no="04" icon={UserRound} accent={VIOLET} title="Accounts">
                        <Prose>
                            Supporters create an account for memberships (including Support and Bills memberships), Paid Tasks and product purchases, so their access can be tracked, renewed and cancelled at any time. <B>One-off content purchases (Piggy Pot and Wishes) can be made without an account.</B>
                        </Prose>
                    </Section>

                    <Section no="05" icon={ShieldCheck} accent={MINT} title="Acceptable content">
                        <Prose>
                            Spenny Piggy is <B>strictly safe-for-work</B>. All content, rewards and listings are subject to manual creator approval and ongoing AI and human moderation. We do not permit sexual or adult content, illegal goods or services, or hateful, harassing or violent content. <B>Hateful or violent content may not be monetised</B> anywhere on the platform.
                        </Prose>
                    </Section>

                    {/* 06 — prohibited chip grid */}
                    <Section no="06" icon={Ban} accent={PINK} title="What is not allowed">
                        <Prose>The following are prohibited, because they are not the purchase of creator content:</Prose>
                        <motion.div variants={container} className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            {prohibited.map((item) => (
                                <motion.div key={item} variants={popIn} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 320, damping: 26 }} className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5" style={{ borderColor: INK, background: "rgba(255,0,127,0.05)", boxShadow: "3px 3px 0 0 #FF007F" }}>
                                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full border-2 bg-[#FF007F] text-white" style={{ borderColor: INK }}>
                                        <X size={15} strokeWidth={3.4} />
                                    </span>
                                    <span className="text-[14.5px] font-bold" style={{ color: INK }}>{item}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </Section>

                    {/* 07 + 08 — prose */}
                    <Section no="07" icon={RefreshCcw} accent={YELLOW} title="Refunds, non-delivery & disputes">
                        <Prose>
                            Where a creator fails to deliver the content associated with a payment, Spenny Piggy may restrict monetisation features, suspend accounts, remove listings and process refunds. We monitor dispute and chargeback activity at both platform and creator level and act on the creators responsible.
                        </Prose>
                    </Section>

                    <Section no="08" icon={CreditCard} accent={PINK} title="Payments & sellers">
                        <Prose>
                            Payments are processed by our payment partner. Creators are the seller of record for their own sales, so the seller shown at checkout, the receipt and the bank statement descriptor are the creator's name or username, identifying the payment as a content purchase. We apply transaction limits and additional review on higher-value purchases, holding funds until content is delivered where appropriate.
                        </Prose>
                    </Section>

                    {/* SUMMARY — gradient banner */}
                    <Reveal className="pt-8">
                        <motion.div variants={riseIn} className="relative overflow-hidden rounded-[28px] border-2 p-8 md:p-12" style={{ borderColor: INK, background: `linear-gradient(135deg, ${PINK}, ${VIOLET})`, color: "#fff", boxShadow: `8px 8px 0 0 ${INK}` }}>
                            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={dotBg} />
                            <div className="relative">
                                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                                    <FileCheck2 size={13} strokeWidth={2.6} /> Summary
                                </span>
                                <p className={`${display} text-[24px] leading-[1.04] tracking-tight md:text-[34px]`}>
                                    Spenny Piggy exists to let creators sell content and supporters <span className="text-[#E6EA7B]">buy it.</span>
                                </p>
                                <p className="mt-5 max-w-3xl text-[15.5px] leading-relaxed text-white/85">
                                    Memberships deliver enforced monthly content; Wishes and Piggy Pot deliver individual content; Paid Tasks deliver bespoke content and services; and products are delivered through Sell Something. In every case, the supporter receives creator content — <strong className="font-bold text-white">never a gift, tip or transfer.</strong>
                                </p>
                            </div>
                        </motion.div>
                    </Reveal>

                    {/* FOOTER */}
                    <motion.footer initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE }} className="mt-12 border-t-2 border-dashed pt-8" style={{ borderColor: "rgba(28,27,26,0.2)" }}>
                        <p className="max-w-3xl text-[13px] leading-relaxed text-gray-500">
                            Spenny Piggy is operated by Social Vortex Limited (company no. 15233693), 55 Colmore Row, Birmingham, England, B3 2AA. This page should be read alongside our{" "}
                            <Link href="/content-payment-policy" className="font-bold text-[#FF007F] underline decoration-[#FF007F]/40 underline-offset-2 transition-[text-decoration-color] hover:decoration-[#FF007F] active:opacity-70">
                                Content &amp; Payment Association Framework
                            </Link>, Terms of Service and Privacy Policy.
                        </p>
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">How Spenny Piggy Works · v1.0 · Effective 15 June 2026</p>
                    </motion.footer>
                </main>
            </div>
        </Guest>
    );
}
