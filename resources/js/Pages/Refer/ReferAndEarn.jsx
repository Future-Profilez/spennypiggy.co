import { Head, Link, router } from "@inertiajs/react";
import { FaCopy, FaShareAlt } from "react-icons/fa";
import { useState } from "react";
import axios from "axios";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import ShareProfile from "../../wishlist/ShareProfile";

export default function ReferAndEarn({
    auth,
    referral = {},
    stats = {},
    referrals = [],
    canRedeem = false, // ✅ FIX 1
}) {
    const [copied, setCopied] = useState(false);
    const [referralCode, setReferralCode] = useState(referral?.code || null);
    const [referralLink, setReferralLink] = useState(referral?.link || null);

    // ✅ REAL condition
    const hasReferral = Boolean(referralCode);

    const [loading, setLoading] = useState(false);
    const copyLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getCooldownText = (timestamp) => {
        if (!timestamp) return null;

        const diff = timestamp * 1000 - Date.now();
        if (diff <= 0) return null;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);

        return `${hours}h ${mins}m remaining`;
    };

    const ProgressBar = ({ value }) => {
        const percent = Math.min((Number(value || 0) / 1000) * 100, 100);

        return (
            <div className="w-full">
                {/* Bar background */}
                <div className="w-full h-3 bg-gray-200 rounded-full border border-black overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${
                            percent >= 100 ? "bg-green-500" : "bg-pink-500"
                        }`}
                        style={{ width: `${percent}%` }}
                    />
                </div>

                {/* Percentage text */}
                <div className="text-[11px] text-gray-500 mt-1 text-center">
                    {Math.floor(percent)}% completed
                </div>

                {/* Qualified label (only when 100%) */}
                {/* {percent >= 100 && (
                    <div className="text-[11px] text-green-700 font-semibold mt-1 text-center">
                        🎉 Qualified
                    </div>
                )} */}
            </div>
        );
    };

    const createReferralLink = async () => {
        setLoading(true);
        try {
            const res = await axios.post("/refer-and-earn/create-link");
            setReferralCode(res.data.code); // ✅ store code
            setReferralLink(res.data.link); // ✅ store link
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toFixed(2);
    };

    return (
        <Authenticated auth={auth?.user} user={auth?.user}>
            <Head title="Refer & Earn" />

            <div className="blackbg pt-6 pb-10">
                <div className="containerbox">
                    {/* ================= HEADER ================= */}
                    {/* ================= HEADER + REFERRAL LINK (MERGED) ================= */}
                    <div className="mb-6 border-[3px] border-black shadow-pink rounded-[40px]  overflow-hidden">
                        {/* Mac style bar */}
                        <div className="p-4 pinkbg flex items-center border-b-[3px] border-black">
                            <span className="border-black border-2 bg-red-700 mr-2 w-5 h-5 rounded-full block"></span>
                            <span className="border-black border-2 bg-yellow-400 mr-2 w-5 h-5 rounded-full block"></span>
                            <span className="border-black border-2 bg-mint mr-2 w-5 h-5 rounded-full block"></span>

                            <h1 className="text-white font-gulfs uppercase ml-4">
                                Refer & Earn
                            </h1>

                            <Link
                                href={`/${auth?.user?.username}`}
                                className="ml-auto text-white text-sm hover:underline"
                            >
                                ← Back to Profile
                            </Link>
                        </div>

                        {/* Content */}
                        <div className="whbg p-6">
                            {/* Intro text */}
                            <p className="text-gray-500 max-w-3xl mb-6">
                                Invite creators to Spenny Piggy and earn{" "}
                                <strong>£50</strong> for every creator who
                                reaches <strong>£1,000 lifetime GMV</strong>.
                            </p>

                            {/* Referral Link Box */}
                            <div className="border-2 border-black rounded-[40px]   p-4 md:p-5">
                                <h2 className="text-lg font-GillSans uppercase mb-3">
                                    Your Referral Link
                                </h2>

                                {/* INPUT + CTA */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        value={hasReferral ? referralLink : ""}
                                        placeholder="Click Generate to create your referral link"
                                        className={`w-full px-4 py-3 md:py-4 pr-[220px] rounded-[40px]  border-2 border-black text-sm
                                        ${
                                            hasReferral
                                                ? "bg-white text-black"
                                                : "bg-gray-100 text-gray-500"
                                        }
                                    `}
                                    />

                                    {/* CTA AREA */}
                                    <div className="md:absolute top-1/2 right-2 md:-translate-y-1/2 !mt-2 md:!mt-0 flex items-center gap-2">
                                        {/* GENERATE */}
                                        {!hasReferral && (
                                            <button
                                                onClick={createReferralLink}
                                                disabled={loading}
                                                className="
                                                bg-pink-600 hover:bg-pink-700
                                                text-white font-bold
                                                px-4 md:px-6 py-2.5 md:py-3
                                                rounded-full
                                                text-sm
                                                shadow-md
                                                transition
                                                whitespace-nowrap
                                            "
                                            >
                                                {loading
                                                    ? "Generating…"
                                                    : "Generate Code"}
                                            </button>
                                        )}

                                        {/* COPY + SHARE */}
                                        {hasReferral && (
                                            <>
                                                <button
                                                    onClick={copyLink}
                                                    className="
                                                    flex items-center gap-2
                                                    px-4 py-2
                                                    bg-white border-2 border-black
                                                    rounded-full text-sm font-semibold
                                                    hover:bg-gray-100
                                                "
                                                >
                                                    <FaCopy />
                                                    {copied ? "Copied" : "Copy"}
                                                </button>

                                                <ShareProfile
                                                    username={auth?.name}
                                                    custom={referralLink}
                                                    classes="
                                                    flex items-center gap-2
                                                    px-4 py-2
                                                    bg-white border-2 border-black
                                                    rounded-full text-sm font-semibold
                                                    hover:bg-gray-100
                                                "
                                                >
                                                    <FaShareAlt />
                                                    Share
                                                </ShareProfile>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                    Share this link with creators. You’ll earn
                    £50 once they reach £1,000 lifetime GMV.
                </p>
                            </div>
                        </div>
                    </div>

                    {/* ================= HOW IT WORKS ================= */}
                    <div className="pink-round p-6 mb-6">
                        <h2 className="text-xl font-GillSans uppercase mb-4">
                            How You Earn £50
                        </h2>

                        <ol className="list-decimal ml-6 space-y-2 text-sm">
                            <li>Share your referral link with creators</li>
                            <li>Creators sign up using your link</li>
                            <li>They earn £1,000 lifetime GMV</li>
                            <li>You receive a £50 referral reward</li>
                            <li>Request payout via Stripe anytime</li>
                        </ol>
                    </div>

                    {/* ================= STATS ================= */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Stat
                            label="Total Referrals"
                            value={stats.total_referrals || 0}
                        />
                        <Stat
                            label="Qualified"
                            value={stats.qualified_referrals}
                        />
                        <Stat label="Earned (£)" value={stats.total_earned} />
                        <Stat
                            label="Available (£)"
                            value={stats.available_for_payout}
                        />
                    </div>

                    {/* ================= REDEEM ================= */}
                    <div className="pink-round p-6 mb-8 flex flex-col md:flex-row md:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-GillSans uppercase mb-1">
                                Redeem Referral Earnings
                            </h3>
                            <p className="text-sm text-gray-500">
                            Redemption requests are reviewed before payout.
                        </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="text-sm">
                                <span className="text-gray-500">
                                    Available balance:
                                </span>{" "}
                                <strong>
                                    £{formatMoney(stats.available_for_payout)}
                                </strong>
                            </div>

                            <button
                                disabled={!canRedeem || loading}
                                className={`btn-pink px-6 py-3 min-w-[240px]
                                    text-[15px] font-extrabold tracking-wide uppercase
                                    ${
                                        !canRedeem || loading
                                            ? "bg-gray-400 cursor-not-allowed text-gray-700"
                                            : "text-white"
                                    }
                                `}
                                onClick={() => {
                                    setLoading(true);
                                    router.post(
                                        route("referral.redeem"),
                                        {},
                                        {
                                            onFinish: () => setLoading(false),
                                        }
                                    );
                                }}
                            >
                                Redeem £
                                {formatMoney(stats.available_for_payout)}
                            </button>

                            {!canRedeem && (
                                <p className="text-xs text-gray-500 text-right max-w-xs">
                                    You can redeem once you have at least £50
                                    available.
                                </p>
                            )}

                            {canRedeem && (
                                <p className="text-xs text-gray-500 text-right max-w-xs">
                                    Your request will be reviewed and paid to
                                    your Stripe account.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ================= REFERRAL TABLE ================= */}
                    <div className="pink-round p-6">
                        <h2 className="text-xl font-GillSans uppercase mb-4">
                            Referred Creators
                        </h2>

                        {referrals.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                No creators have signed up using your referral
                                link yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3">
                                                Creator
                                            </th>
                                            <th className="text-center">
                                                Joined
                                            </th>
                                            <th className="text-center">
                                                Status
                                            </th>
                                            <th className="text-center">
                                                Progress
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrals.map((r) => (
                                            <tr key={r.id} className="border-b">
                                                <td className="py-3">
                                                    <strong>{r.name}</strong>
                                                    <div className="text-xs text-gray-500">
                                                        @{r.username}
                                                    </div>
                                                </td>

                                                <td className="text-center">
                                                    {r.joined_at}
                                                </td>

                                                <td className="text-center">
                                                    <StatusBadge
                                                        status={r.status}
                                                    />
                                                </td>

                                                <td className="text-center min-w-[220px] px-3">
                                                    <ProgressBar
                                                        value={r.lifetime_gmv}
                                                    />

                                                    {/* 🔴 Rejection Reason (if any) */}
                                                    {r.rejection_reason ? (
                                                        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                                                            <strong>
                                                                Rejected:
                                                            </strong>{" "}
                                                            {r.rejection_reason}
                                                        </div>
                                                    ) : (
                                                        r.lifetime_gmv >=
                                                            1000 && (
                                                            <div className="text-[11px] text-green-700 font-semibold mt-1 text-center">
                                                                🎉 Qualified
                                                            </div>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}

/* ================= HELPERS ================= */

const Stat = ({ label, value }) => (
    <div className="pink-round p-5 text-center">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-xs uppercase mt-1">{label}</div>
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        IN_PROGRESS: "bg-yellow-100 text-yellow-800",
        QUALIFIED: "bg-green-100 text-green-800",
        PAYOUT_REQUESTED: "bg-blue-100 text-blue-800",
        PAID: "bg-purple-100 text-purple-800",
        REVOKED: "bg-red-100 text-red-800",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs ${map[status] || ""}`}>
            {status?.replace("_", " ") || "-"}
        </span>
    );
};
