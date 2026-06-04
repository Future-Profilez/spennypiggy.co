import React, { useState, useEffect } from 'react';
import { FaShareAlt, FaPoundSign } from 'react-icons/fa';
import { Link } from '@inertiajs/react';

export default function ReferralBanner({ onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = 'referralBannerDismissed';
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
            timestamp: new Date().getTime()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissData));
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className="my-4 block w-full relative overflow-hidden bg-pink-600  rounded-[30px]  p-6 text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <button
                onClick={handleDismiss}
                className="bg-white text-black border-2 border-black absolute text-[24px] font-bold z-10 top-6 right-6 md:top-4 md:right-4 py-[0px] px-[10px] rounded-[10px]  transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            > &times; </button>

            <div className="relative">
                <div className="lg:flex items-center mb-3">
                    <div>
                        <h3 className="text-xl md:text-2xl font-gulfs uppercase tracking-wider">Refer & Earn £50 💸 </h3>
                        <p className="text-sm opacity-90 font-medium">Invite creators and earn unlimited rewards!</p>
                    </div>
                </div>
                
                <p className="text-normal text-sm lg:text-lg opacity-95 mb-1 font-medium leading-relaxed">
                    Earn a <span className="font-bold text-yellow-300">£50 Stripe payout</span> for every creator you refer who reaches £1,000 in lifetime GMV. 
                </p>
                <p className="text-normal text-sm lg:text-lg opacity-95 mb-2 font-medium leading-relaxed">
                    There is no limit to how many creators you can refer.
                </p>
                <Link href="/refer-and-earn" className="inline-block ms-1 text-yellow-300 ">
                    Get your Referral Link
                </Link>  

                 
            </div>
        </div>
    );
}