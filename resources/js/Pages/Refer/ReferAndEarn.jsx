import { Head, Link } from "@inertiajs/react";
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
}) {
    const [copied, setCopied] = useState(false);
    const [referralCode, setReferralCode] = useState(referral?.code || null);
    const [referralLink, setReferralLink] = useState(referral?.link || null);

    const [loading, setLoading] = useState(false);
    const copyLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const createReferralLink = async () => {
        alert(
            "Referral link generation is currently disabled for maintenance."
        );
        setLoading(true);
        try {
            const res = await axios.post("/refer-and-earn/create-link");
            setReferralCode(res.data.code); // ✅ store code
            setReferralLink(res.data.link); // ✅ store link
        } finally {
            setLoading(false);
        }
    };

    // const shareLink = async () => {
    //     if (!referralLink) return;

    //     if (navigator && navigator?.share) {
    //         try {
    //             await navigator.share({
    //                 title: "Join me on Spenny Piggy",
    //                 text: "Sign up using my referral link and start earning on Spenny Piggy!",
    //                 url: referralLink,
    //             });
    //         } catch (err) {
    //             // user cancelled – no action needed
    //         }
    //     } else {
    //         // fallback: copy link if share not supported
    //         navigator.clipboard.writeText(referralLink);
    //         setCopied(true);
    //         setTimeout(() => setCopied(false), 2000);
    //     }
    // };

    return (
        <Authenticated auth={auth?.user} user={auth?.user}>
            <Head title="Refer & Earn" />

            <div className="blackbg pt-6 pb-10">
                <div className="containerbox">
                    {/* ================= HEADER ================= */}
                    <div className="mb-6 border-3 border-black shadow-pink rounded-[40px] overflow-hidden">
                        {/* Mac style bar */}
                        <div className="p-4 pinkbg flex items-center border-b-[3px] border-black">
                            <span className="border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block"></span>
                            <span className="border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block"></span>
                            <span className="border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block"></span>

                            <h1 className="text-white font-gulfs uppercase ms-4">
                                Refer & Earn
                            </h1>

                            <Link
                                href={`/${auth?.user?.username}`}
                                className="ms-auto text-white text-sm hover:underline"
                            >
                                ← Back to Profile
                            </Link>
                        </div>

                        {/* Header content */}
                        <div className="whbg p-6">
                            <p className="text-muted max-w-3xl">
                                Invite creators to Spenny Piggy and earn{" "}
                                <strong>£50</strong> for every creator who
                                reaches <strong>£1,000 lifetime GMV</strong>.
                            </p>
                        </div>
                    </div>

                    {/* ================= REFERRAL LINK ================= */}
                    <div className="pink-round p-6 mb-6">
                        <h2 className="text-xl font-GillSans uppercase mb-3">
                            Your Referral Link
                        </h2>

                        <div className="flex flex-col gap-4">
                            {/* Referral Link Display */}
                            {referralLink && (
                                <div className="bg-white border-2 border-black rounded-xl px-4 py-3 text-sm truncate">
                                    {referralLink}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                {/* Generate Button */}
                                <button
                                    onClick={createReferralLink}
                                    disabled={loading || referralCode}
                                    className={`btn-pink px-6 py-3 text-sm font-semibold 
                                        min-w-[260px] text-center justify-center
                                        ${
                                            referralCode
                                                ? "bg-gray-500 cursor-not-allowed"
                                                : ""
                                        }
                                    `}
                                >
                                    {loading
                                        ? "Generating..."
                                        : referralCode
                                        ? "Referral Code Generated"
                                        : "Generate Referral Code"}
                                </button>

                                {/* Copy Button (only if link exists) */}
                                {referralLink && (
                                    <>
                                        <button
                                            onClick={copyLink}
                                            className="btn-outline px-6 py-3 text-sm font-semibold
                                                    flex items-center gap-2
                                                    w-[120px] justify-center"
                                        >
                                            <FaCopy />
                                            {copied ? "Copied" : "Copy"}
                                        </button>

                                        <ShareProfile
                                            username={auth && auth.name}
                                            classes="btn-outline pr-6 py-3 text-sm font-semibold flex items-center gap-2"
                                            custom={referralLink} // ✅ referral URL pass
                                        >
                                            <FaShareAlt />
                                            Share
                                        </ShareProfile>
                                    </>
                                )}
                            </div>

                            {/* Helper Text */}
                            <p className="text-xs text-muted">
                                Share this link with creators. You’ll earn £50
                                once they reach £1,000 lifetime GMV.
                            </p>
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
                            <li>You unlock a £50 referral reward</li>
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
                            value={stats.qualified_referrals || 0}
                        />
                        <Stat
                            label="Earned (£)"
                            value={stats.total_earned || 0}
                        />
                        <Stat
                            label="Available (£)"
                            value={stats.available_for_payout || 0}
                        />
                    </div>

                    {/* ================= REDEEM REFERRAL EARNINGS ================= */}
                    <div className="pink-round p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-GillSans uppercase mb-1">
                                Redeem Referral Earnings
                            </h3>
                            <p className="text-sm text-muted max-w-xl">
                                Redeem your referral earnings once they’re
                                available. All redemption requests are reviewed
                                by our team before payout.
                            </p>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2">
                            <div className="text-sm">
                                <span className="text-muted">
                                    Available balance:
                                </span>{" "}
                                <strong>
                                    £{stats.available_for_payout || 0}
                                </strong>
                            </div>

                            <button
                                disabled={!canRedeem}
                                className={`btn-pink px-6 py-3 text-sm font-semibold min-w-[240px]
                                    ${
                                        !canRedeem
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : ""
                                    }
                                `}
                                onClick={() => {
                                    router.post(route("referral.redeem"));
                                }}
                            >
                                Redeem £50
                            </button>

                            {!canRedeem && (
                                <p className="text-xs text-muted text-right max-w-xs">
                                    You can redeem once a referred creator
                                    reaches £1,000 lifetime GMV.
                                </p>
                            )}

                            {canRedeem && (
                                <p className="text-xs text-muted text-right max-w-xs">
                                    Your request will be reviewed and paid to
                                    your Stripe account.
                                </p>
                            )}

                            {/* <button
                                disabled={
                                    !stats.available_for_payout ||
                                    stats.available_for_payout <= 0
                                }
                                className={`btn-pink px-6 py-3 text-sm font-semibold min-w-[240px]
                                    ${
                                        !stats.available_for_payout ||
                                        stats.available_for_payout <= 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : ""
                                    }
                                `}
                                onClick={() => {
                                    // UI placeholder
                                    alert(
                                        "Your redemption request has been submitted. We’ll review it and notify you once approved."
                                    );
                                }}
                            >
                                Redeem Earnings
                            </button> */}

                            <p className="text-xs text-muted text-right max-w-xs">
                                After approval, funds are paid to your connected
                                Stripe account.
                            </p>
                        </div>
                    </div>

                    {/* ================= REFERRAL TABLE ================= */}
                    <div className="pink-round p-6">
                        <h2 className="text-xl font-GillSans uppercase mb-4">
                            Referred Creators
                        </h2>

                        {referrals.length === 0 ? (
                            <p className="text-muted text-sm">
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
                                            <th className="text-center">GMV</th>
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
                                                    <div className="text-xs text-muted">
                                                        @{r.username}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {r.joined_at}
                                                </td>
                                                <td className="text-center">
                                                    £{r.lifetime_gmv}
                                                </td>
                                                <td className="text-center">
                                                    <StatusBadge
                                                        status={r.status}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    £{r.lifetime_gmv} / £1000
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
