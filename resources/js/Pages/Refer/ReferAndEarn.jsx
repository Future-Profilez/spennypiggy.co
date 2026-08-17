import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import {
    Copy, Check, Share2, Link2, Users, Trophy, Banknote, Wallet,
    ArrowRight, Scissors,
} from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import ShareProfile from "../../wishlist/ShareProfile";

const PINK = "#FF007F";
const MINT = "#A2E4B8";
const GOAL = 1000;
const REWARD = 50;

const CARD =
 "bg-white border-[3px] border-black rounded-box ";
const NUM = "tabular-nums [font-variant-numeric:tabular-nums]";

const money = (v) =>
    Number(v || 0).toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

export default function ReferAndEarn({
    auth,
    referral = {},
    stats = {},
    referrals = [],
    canRedeem = false,
}) {
    const reduce = useReducedMotion();
    const [copied, setCopied] = useState(false);
    const [referralCode, setReferralCode] = useState(referral?.code || null);
    const [referralLink, setReferralLink] = useState(referral?.link || null);
    const [loading, setLoading] = useState(false);
    const [redeeming, setRedeeming] = useState(false);

    const hasReferral = Boolean(referralCode);

    const copyLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const createReferralLink = async () => {
        setLoading(true);
        try {
            const res = await axios.post("/refer-and-earn/create-link");
            setReferralCode(res.data.code);
            setReferralLink(res.data.link);
        } catch (err) {
            // 409 = link already exists; the payload still carries it
            const data = err?.response?.data;
            if (data?.code) {
                setReferralCode(data.code);
                setReferralLink(data.link);
            }
        } finally {
            setLoading(false);
        }
    };

    const redeem = () => {
        setRedeeming(true);
        router.post(route("referral.redeem"), {}, {
            onFinish: () => setRedeeming(false),
        });
    };

    const rise = (i = 0) =>
        reduce
            ? {}
            : {
                  initial: { opacity: 0, y: 14 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.35, delay: i * 0.06, ease: "easeOut" },
              };

    return (
        <Authenticated auth={auth?.user} user={auth?.user}>
            <Head title="Refer & Earn" />

            <div className="bg-[#A2E4B8] pt-6 pb-14">
                <div className="containerbox">
                    {/* ============ PAGE HEAD ============ */}
                    <div className="flex items-end justify-between mb-5 px-1">
                        <div>
 <div className="text-[12px] font-black uppercase tracking-[0.18em] text-black/60">
                                Creator referrals
                            </div>
                            <h1 className="font-gulfs uppercase text-2xl md:text-3xl leading-none mt-1">
                                Refer &amp; Earn
                            </h1>
                        </div>
                        <Link
                            href={`/${auth?.user?.username}`}
 className="text-sm font-semibold underline underline-offset-4 hover:no-underline inline-flex items-center min-h-[44px]"
                        >
                            ← Back to profile
                        </Link>
                    </div>

                    {/* ============ VOUCHER HERO ============ */}
                    <motion.div
                        {...rise(0)}
                        className={`${CARD} relative overflow-hidden mb-6 grid lg:grid-cols-[1.35fr_1fr]`}
                    >
                        {/* --- Main panel: the offer --- */}
                        <div className="p-6 md:p-8 relative">
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span
                                    className="font-gulfs leading-none text-[64px] md:text-[88px]"
                                    style={{ color: PINK }}
                                >
                                    £{REWARD}
                                </span>
                                <span className="font-GillSans uppercase text-lg md:text-xl leading-tight">
                                    for every creator
                                    <br className="hidden md:block" /> you bring
                                    to Spenny Piggy
                                </span>
                            </div>

                            {/* The sequence — a real one, so numbered */}
                            <ol className="mt-6 space-y-3">
                                {[
                                    ["Share your link", "Send it to a creator you rate."],
                                    ["They sign up and sell", `Your referral counts once they reach £${money(GOAL)} lifetime sales.`],
                                    [`You earn £${REWARD}`, "Redeem to your Stripe account any time."],
                                ].map(([t, d], i) => (
                                    <li key={t} className="flex items-start gap-3">
                                        <span className="shrink-0 w-7 h-7 rounded-full border-2 border-black bg-[#A2E4B8] font-black text-sm flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <div className="font-bold text-sm uppercase tracking-wide">
                                                {t}
                                            </div>
 <div className="text-sm text-black/60">
                                                {d}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* --- Perforation --- */}
                        {/* vertical (lg) */}
                        <div className="hidden lg:block absolute top-0 bottom-0 lg:left-[57.4%] w-0 border-l-[3px] border-dashed border-black" />
                        <div className="hidden lg:flex absolute lg:left-[57.4%] -top-[3px] -translate-x-1/2 w-7 h-7 rounded-full border-[3px] border-black bg-[#A2E4B8] -translate-y-1/2" />
                        <div className="hidden lg:flex absolute lg:left-[57.4%] -bottom-[3px] -translate-x-1/2 w-7 h-7 rounded-full border-[3px] border-black bg-[#A2E4B8] translate-y-1/2" />

                        {/* --- Stub: the link you tear off --- */}
                        <div className="relative bg-[#FFF7CF] p-6 md:p-8 border-t-[3px] border-dashed border-black lg:border-t-0">
                            <div className="flex items-center gap-2 mb-4">
                                <Scissors size={16} className="rotate-180 lg:rotate-90" />
 <span className="text-[12px] font-black uppercase tracking-[0.18em]">
                                    Your link — tear here
                                </span>
                            </div>

                            {hasReferral ? (
                                <>
                                    <div className="bg-white border-2 border-black rounded-box-sm px-4 py-3 text-sm break-all font-mono">
                                        {referralLink}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <button
                                            onClick={copyLink}
 className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-box-sm border-2 border-black bg-black text-white text-sm font-bold uppercase tracking-wide active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                        >
                                            {copied ? <Check size={15} /> : <Copy size={15} />}
                                            {copied ? "Copied" : "Copy link"}
                                        </button>
                                        <ShareProfile
                                            username={auth?.name}
                                            custom={referralLink}
 classes="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-box-sm border-2 border-black bg-white text-sm font-bold uppercase tracking-wide active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                        >
                                            <Share2 size={15} />
                                            Share
                                        </ShareProfile>
                                    </div>
                                    {referralCode && (
 <div className="mt-4 text-xs text-black/80">
                                            Code:{" "}
                                            <span className="font-mono font-bold">
                                                {referralCode}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
 <p className="text-sm text-black/80 mb-4">
                                        Generate your personal link once — it
                                        never expires.
                                    </p>
                                    <button
                                        onClick={createReferralLink}
                                        disabled={loading}
 className="flex items-center gap-2 px-6 py-3 rounded-box-sm border-2 border-black text-white text-sm font-bold uppercase tracking-wide active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-60"
                                        style={{ background: PINK }}
                                    >
                                        <Link2 size={15} />
                                        {loading ? "Generating…" : "Generate my link"}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* ============ STATS ============ */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Referred", value: stats.total_referrals || 0, Icon: Users },
                            { label: "Qualified", value: stats.qualified_referrals || 0, Icon: Trophy },
                            { label: "Earned", value: `£${money(stats.total_earned)}`, Icon: Banknote },
                            { label: "Paid out", value: `£${money(stats.paid_out_amount)}`, Icon: Wallet },
                        ].map(({ label, value, Icon }, i) => (
                            <motion.div
                                key={label}
                                {...rise(i + 1)}
                                className={`${CARD} !rounded-box p-5`}
                            >
 <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                                    <Icon size={14} />
                                    {label}
                                </div>
                                <div className={`text-3xl font-black mt-2 ${NUM}`}>
                                    {value}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ============ REDEEM BANNER ============ */}
                    <motion.div
                        {...rise(2)}
 className="border-[3px] border-black rounded-box mb-6 p-6 md:px-8 flex flex-col md:flex-row md:items-center gap-4"
                        style={{ background: PINK }}
                    >
                        <div className="flex-1 text-white">
 <div className="text-[12px] font-black uppercase tracking-[0.18em] text-white/80">
                                Available to redeem
                            </div>
                            <div className={`font-gulfs text-4xl md:text-5xl leading-none mt-1 ${NUM}`}>
                                £{money(stats.available_for_payout)}
                            </div>
                            <p className="text-xs text-white/80 mt-2 max-w-sm">
                                {canRedeem
                                    ? "Requests are reviewed, then paid to your Stripe account."
                                    : `Redeem opens at £${REWARD} available.`}
                            </p>
                        </div>

                        <button
                            onClick={redeem}
                            disabled={!canRedeem || redeeming}
                            className={`group flex items-center justify-center gap-2 px-7 py-3.5 rounded-box-sm border-[3px] border-black text-[15px] font-black uppercase tracking-wide transition-all
                                ${
                                    canRedeem && !redeeming
 ? "bg-white text-black hover:-translate-y-0.5 active:translate-y-0 "
 : "bg-white/40 text-black/60 cursor-not-allowed"
                                }`}
                        >
                            {redeeming
                                ? "Sending…"
                                : `Redeem £${money(stats.available_for_payout)}`}
                            <ArrowRight
                                size={16}
                                className="transition-transform group-hover:translate-x-1"
                            />
                        </button>
                    </motion.div>

                    {/* ============ REFERRED CREATORS ============ */}
                    <motion.div {...rise(3)} className={`${CARD} p-6 md:p-8`}>
                        <div className="flex items-baseline justify-between mb-5">
                            <h2 className="text-xl font-GillSans uppercase">
                                Referred creators
                            </h2>
                            {referrals.length > 0 && (
 <span className={`text-sm text-black/60 ${NUM}`}>
                                    {referrals.length}{" "}
                                    {referrals.length === 1 ? "creator" : "creators"}
                                </span>
                            )}
                        </div>

                        {referrals.length === 0 ? (
                            <div className="border-2 border-dashed border-black/30 rounded-box-sm p-8 text-center">
                                <p className="font-bold uppercase text-sm tracking-wide">
                                    No referrals yet
                                </p>
 <p className="text-sm text-black/60 mt-1 max-w-sm mx-auto">
                                    Share your link with a creator — they'll
                                    show up here the moment they sign up.
                                </p>
                                {hasReferral && (
                                    <button
                                        onClick={copyLink}
 className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-box-sm border-2 border-black bg-white text-sm font-bold uppercase tracking-wide active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                    >
                                        {copied ? <Check size={15} /> : <Copy size={15} />}
                                        {copied ? "Copied" : "Copy your link"}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul className="divide-y-2 divide-black/10">
                                {referrals.map((r) => (
                                    <ReferralRow key={r.id} r={r} />
                                ))}
                            </ul>
                        )}
                    </motion.div>
                </div>
            </div>
        </Authenticated>
    );
}

/* ============ ROW ============ */

function ReferralRow({ r }) {
    const pct = Math.min((Number(r.lifetime_gmv || 0) / GOAL) * 100, 100);
    const done = pct >= 100;

    return (
        <li className="py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            {/* Who */}
            <div className="md:w-[220px] shrink-0 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full border-2 border-black bg-[#A2E4B8] font-black flex items-center justify-center uppercase">
                    {(r.name || "?").charAt(0)}
                </span>
                <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{r.name}</div>
 <div className="text-xs text-black/60 truncate">
                        @{r.username} · joined {r.joined_at}
                    </div>
                </div>
            </div>

            {/* Progress to £1,000 */}
            <div className="flex-1 min-w-0">
                <div className="h-3.5 bg-gray-100 rounded-full border-2 border-black overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${done ? "bg-green-500" : "bg-[#FF007F]"}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
 <div className={`text-[12px] text-black/60 mt-1 ${NUM}`}>
                    £{money(r.lifetime_gmv)} of £{money(GOAL)}
                    {done && !r.rejection_reason && (
                        <span className="text-green-700 font-bold ml-2">
                            Qualified — £{REWARD} earned
                        </span>
                    )}
                </div>
                {r.rejection_reason && (
                    <div className="mt-1.5 text-xs text-red-700 bg-red-50 border-2 border-red-200 rounded-box-sm px-3 py-1.5 inline-block">
                        <strong>Rejected:</strong> {r.rejection_reason}
                    </div>
                )}
            </div>

            {/* Status */}
            <div className="md:w-[130px] shrink-0 md:text-right">
                <StatusBadge status={r.status} />
            </div>
        </li>
    );
}

const StatusBadge = ({ status }) => {
    const map = {
        IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-300",
        QUALIFIED: "bg-green-100 text-green-800 border-green-300",
        PAYOUT_REQUESTED: "bg-blue-100 text-blue-800 border-blue-300",
        PAID: "bg-purple-100 text-purple-800 border-purple-300",
        REVOKED: "bg-red-100 text-red-800 border-red-300",
    };
    return (
        <span
 className={`inline-block px-3 py-1 rounded-full border-2 text-[12px] font-bold uppercase tracking-wide ${map[status] || "bg-gray-100 text-black/80 border-gray-300"}`}
        >
            {status?.replaceAll("_", " ") || "—"}
        </span>
    );
};
