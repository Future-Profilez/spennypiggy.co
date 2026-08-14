import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { X, ArrowRight } from "lucide-react";

export default function ReferralBanner({ onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = "referralBannerDismissed";
    const DISMISS_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

    useEffect(() => {
        // Check if banner was previously dismissed
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
        const dismissData = {
            timestamp: new Date().getTime(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissData));
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className="relative overflow-hidden rounded-box border-2 border-black bg-gradient-to-br from-[#FF007F] to-[#C2185B] text-white">
            {/* Soft light source, so a flat magenta block gets some depth */}
            <div
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl"
                aria-hidden="true"
            />

            {/* Dismiss keeps its own corner; the content reserves room for it
                instead of running underneath, as the old × did on phones. */}
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss referral offer"
                className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white transition-colors hover:bg-black/45"
            >
                <X size={15} strokeWidth={3} />
            </button>

            <div className="relative flex flex-col gap-4 p-5 pr-14 sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:pr-16">
                {/* The reward is the hook, so it reads as a figure, not a sentence */}
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:gap-1 sm:border-r sm:border-white/25 sm:pr-6">
                    <span className="font-gulfs text-[34px] leading-none tracking-tight sm:text-[40px]">
                        £50
                    </span>
                    <span className="text-[12px] font-black uppercase tracking-[0.18em] text-white/70">
                        per creator
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="font-gulfs text-lg uppercase tracking-wide sm:text-xl">
                        Refer &amp; earn
                    </h3>
                    <p className="mt-1 text-[16px] md:text-[14px] font-medium leading-relaxed text-white/85">
                        Invite a creator and earn a{" "}
                        <span className="font-bold text-[#FFE600]">
                            £50 Stripe payout
                        </span>{" "}
                        once they reach £1,000 in lifetime GMV. No limit on how
                        many you refer.
                    </p>

                    <Link
                        href="/refer-and-earn"
                        className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-5 py-2 text-[12px] font-black uppercase tracking-wide text-black transition-colors duration-200 hover:bg-white/90"
                    >
                        Get your link
                        <ArrowRight size={13} strokeWidth={3} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
