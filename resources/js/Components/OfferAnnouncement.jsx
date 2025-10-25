import React, { useState, useEffect } from 'react';
import { FaTimes, FaGift, FaStar, FaFire } from 'react-icons/fa';
import { BsStars } from 'react-icons/bs';
import { Link } from '@inertiajs/react';

export default function OfferAnnouncement({ 
    onDismiss,
    variant = 'default' // 'default', 'compact', 'gradient'
}) {
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = 'offerBannerDismissed';
    const DISMISS_DURATION = 20 * 24 * 60 * 60 * 1000; // 20 days in milliseconds

    useEffect(() => {
        // Check if banner was previously dismissed
        const dismissedData = localStorage.getItem(STORAGE_KEY);
        
        if (dismissedData) {
            const { timestamp } = JSON.parse(dismissedData);
            const now = new Date().getTime();
            
            // If 20 days haven't passed, keep banner hidden
            if (now - timestamp < DISMISS_DURATION) {
                setIsVisible(false);
                return;
            } else {
                // 20 days have passed, remove the storage and show banner
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        
        // Show banner if not dismissed or 20 days have passed
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

    return <>
    <div className="my-2 mb-4 block w-full relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
            <button
                onClick={handleDismiss}
                className="absolute !text-[20px] z-1 top-1 right-1 py-[3px] px-[10px] rounded-full hover:bg-white/20 transition-all"
            >
                &times;
        </button>
        
            {/* <div className="absolute inset-0 opacity-20">
                <div className="absolute top-3 left-4 animate-bounce">
                    <BsStars className="w-5 h-5" />
                </div>
                <div className="absolute top-6 right-6 animate-pulse">
                    <FaGift className="w-6 h-6" />
                </div>
                <div className="absolute bottom-3 left-1/3 animate-bounce delay-300">
                    <FaStar className="w-4 h-4" />
                </div>
                <div className="absolute bottom-6 right-1/4 animate-pulse delay-500">
                    <FaFire className="w-5 h-5" />
                </div>
            </div> */}

            {/* Content */}
            <div className="relative ">
                <div className="flex items-center mb-3">
                    <div className="p-2 bg-white/20 rounded-full mr-3">
                        <FaGift className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">👑 Join the Founder Program!</h3>
                        <p className="text-sm opacity-90">Don't miss out on this amazing deal</p>
                    </div>
                </div>
                
                <p className="text-normal opacity-95">
                    Earn <span className="font-bold text-yellow-200">£2,500</span> in your first 30 days and get <span className="font-bold text-yellow-200">10% monthly bonus</span>! Exclusive founder badge, priority support & up to £1,000 monthly bonus.
                </p>
            </div>
            <div className='mt-4'>
                <Link href="/founder/bonus" className="cursor-pointer button bg-yellow-600 ">
                     Learn More & Join Now
                </Link>
            </div>
        </div>
        </>
}