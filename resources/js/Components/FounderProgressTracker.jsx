import React from "react";
import { Link, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import {
    FaClock,
    FaDollarSign,
    FaChartLine,
    FaCrown,
    FaLightbulb,
    FaBullseye,
} from "react-icons/fa";

export default function FounderProgressTracker({
    founderData,
    variant = "card",
}) {
    const { auth } = usePage().props;
    const { formatMultiPrice } = PriceFormat();

    if (!founderData || !founderData.isEligible) {
        return null;
    }

    const { first30DayEarnings, daysLeft, minEarnings, windowEnd } = founderData;

    const progressPercentage = Math.min(
        100,
        Math.round((first30DayEarnings / minEarnings) * 100)
    );
    
    const remaining = Math.max(0, minEarnings - first30DayEarnings);
    const hasReachedGoal = first30DayEarnings >= minEarnings;

    if (variant === "mini") {
        return (
            <div className="mb-4 overflow-hidden rounded-[26px] border-4 border-black bg-yellow-300 p-4 md:p-6 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-black font-gulfs font-light flex items-center gap-2 text-lg md:text-2xl font-black uppercase tracking-widest uppercase">
                             Founder Race <span>🚀</span>
                        </p>
                        <p className="mt-1 text-normal font-semibold text-gray-700">
                            {formatMultiPrice(first30DayEarnings, "GBP")} earned •{" "}
                            {formatMultiPrice(remaining, "GBP")} to badge
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-black rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-bold">
                            <FaClock className="mr-2 inline-block h-3 w-3" />
                            {hasReachedGoal
                                ? (daysLeft > 0 ? `Winner decided in ${daysLeft} days` : "Winner being decided")
                                : `${daysLeft} days left`}
                        </div>
                        <Link
                            href="/founder/bonus"
                            className="rounded-full bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#ff007f] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
                        >
                            View
                        </Link>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold">
                        <span className="text-black flex items-center gap-2">
                            <FaChartLine className="h-3 w-3" /> Progress
                        </span>
                        <span className="text-black">{progressPercentage}%</span>
                    </div>
                    <div className="border-black text-black h-3 overflow-hidden rounded-full border border-white/20 bg-black/20">
                        <div
                            className=" h-full rounded-full bg-gradient-to-r from-pink-300 to-pink-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-black mt-2 text-xs font-semibold">
                        {hasReachedGoal ? "Goal hit — nice!" : "Keep going — you’re close!"}
                    </p>
                </div>
            </div>
        );
    }

    if (variant === "compact") {
        return (
            <Link
                href="/founder/bonus"
                className="absolute top-4 left-4 z-10 block max-w-[250px] rounded-[24px] border-4 border-black bg-[#ff007f] p-3 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <FaCrown className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-wider opacity-90">
                            Founder Race
                        </p>
                        <p className="truncate text-lg font-black leading-tight">
                            {progressPercentage}% complete
                        </p>
                        <p className="mt-1 text-xs font-medium opacity-90">
                            {formatMultiPrice(first30DayEarnings, "GBP")} earned
                        </p>
                    </div>
                </div>

                <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span>
                            {hasReachedGoal
                                ? (daysLeft > 0 ? `Winner decided in ${daysLeft} days` : "Winner being decided")
                                : `${daysLeft} days left`}
                        </span>
                        <span>{formatMultiPrice(remaining, "GBP")} to go</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/25">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide">
                        View Founder Bonus
                    </p>
                </div>
            </Link>
        );
    }

    return (
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-[30px] p-6 text-white mb-8 relative overflow-hidden shadow-lg border-4 border-black">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 relative z-10">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-2xl">🚀</span> Your Founder Journey
                    </h2>
                    <p className="text-pink-100 font-medium mt-1">
                        <span className="text-xl">💪</span> {hasReachedGoal ? "You've reached the goal!" : `💪 ${formatMultiPrice(remaining, "GBP")} away from Founder Badge!`}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border border-white/30">
                        <FaClock className="text-pink-200" />
                        <span className="font-bold">{hasReachedGoal ? "Winner Decides :" : "Time Left :"}</span>
                        <span className="font-bold text-lg">
                            {daysLeft > 0 ? `${daysLeft} Days` : "Pending"}
                        </span>
                    </div>
                    
                    <Link href="/founder/bonus" className="bg-white text-pink-600 hover:bg-pink-50 px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all">
                        Learn More
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                {/* Current Earnings */}
                <div className="bg-pink-600/50 backdrop-blur-sm rounded-2xl p-4 border border-pink-400/30">
                    <div className="flex items-center gap-2 text-pink-100 mb-1 text-sm">
                        <FaDollarSign /> Current Earnings
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatMultiPrice(first30DayEarnings, "GBP")}</div>
                    <div className="text-xs text-pink-200 flex items-center gap-1">
                        🔥 {hasReachedGoal ? "Amazing job!" : "Keep the momentum going!"}
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-pink-600/50 backdrop-blur-sm rounded-2xl p-4 border border-pink-400/30 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-pink-100 text-sm">
                            <FaChartLine /> Progress to Goal
                        </div>
                        <span className="font-bold">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-pink-900/50 rounded-full h-3 mb-2 overflow-hidden border border-pink-800/50">
                        <div 
                            className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-pink-200 flex items-center gap-1">
                        🚀 {hasReachedGoal ? "Goal achieved!" : "Your journey begins now!"}
                    </div>
                </div>

                {/* Status */}
                <div className="bg-pink-600/50 backdrop-blur-sm rounded-2xl p-4 border border-pink-400/30">
                    <div className="flex items-center gap-2 text-pink-100 mb-1 text-sm">
                        <FaCrown /> Status
                    </div>
                    <div className="text-xl font-bold mb-1">
                        {hasReachedGoal ? "Qualification Met" : "Racing to Qualify"}
                    </div>
                    <div className="text-xs text-pink-200 flex items-center gap-1">
                        💎 {hasReachedGoal ? "Founder status pending." : "Exclusive rewards await you!"}
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-pink-500/40 backdrop-blur-sm rounded-2xl p-5 border border-pink-400/30 relative z-10 flex justify-between items-center">
                <div>
                    <h3 className="font-bold flex items-center gap-2 mb-3 text-pink-50">
                        <FaLightbulb className="text-yellow-300" /> Quick Tips to Boost Your Earnings:
                    </h3>
                    <ul className="space-y-2 text-sm text-pink-100 list-disc pl-5">
                        <li>Create high-quality content that your audience loves</li>
                        <li>Engage with your followers regularly</li>
                        <li>Share your profile on social media</li>
                        <li>Offer exclusive content and experiences</li>
                    </ul>
                </div>
                <div className="hidden md:block pr-8">
                    <FaBullseye className="text-5xl text-pink-300/80 drop-shadow-md" />
                </div>
            </div>
        </div>
    );
}
