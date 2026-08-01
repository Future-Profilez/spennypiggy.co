import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { X, Crown, ArrowRight } from "lucide-react";

export default function OfferAnnouncement({ onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = "offerBannerDismissed";
    const DISMISS_DURATION = 20 * 24 * 60 * 60 * 1000; // 20 days

    useEffect(() => {
        const dismissedData = localStorage.getItem(STORAGE_KEY);

        if (dismissedData) {
            const { timestamp } = JSON.parse(dismissedData);
            const now = new Date().getTime();

            if (now - timestamp < DISMISS_DURATION) {
                setIsVisible(false);

                return;
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }

        setIsVisible(true);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ timestamp: new Date().getTime() }),
        );
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    // Founder is the platform's premium tier, so it wears black + gold — a
    // deliberate contrast to the pink referral card sitting near it.
    return (
        <div className="relative overflow-hidden rounded-box border-2 border-black bg-[#12131A] text-white">
            {/* A warm glow off the crown corner */}
            <div
                className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#FFD700]/20 blur-2xl"
                aria-hidden="true"
            />

            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss founder offer"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
            >
                <X size={15} strokeWidth={3} />
            </button>

            <div className="relative flex flex-col gap-4 p-5 pr-14 sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:pr-16">
                {/* The reward figure is the hook */}
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:gap-1 sm:border-r sm:border-white/20 sm:pr-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-[#FFD700] text-black">
                        <Crown size={20} strokeWidth={2.5} />
                    </span>
                    <span className="hidden font-gulfs text-[38px] leading-none tracking-tight text-[#FFD700] sm:block">
                        £2.5k
                    </span>
                    <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-white/60 sm:block">
                        in 30 days
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 font-gulfs text-lg uppercase tracking-wide sm:text-xl">
                        
                        Become a founder
                    </h3>
                    <p className="mt-1 text-[13px] font-medium leading-relaxed text-white/80">
                        Earn{" "}
                        <span className="font-bold text-[#FFD700]">£2,500</span>{" "}
                        in your first 30 days for a founder badge, priority
                        support, and up to a{" "}
                        <span className="font-bold text-[#FFD700]">
                            10% monthly bonus
                        </span>
                        .
                    </p>

                    <Link
                        href="/founder/bonus"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFD700] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
                    >
                        Learn more
                        <ArrowRight size={13} strokeWidth={3} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
