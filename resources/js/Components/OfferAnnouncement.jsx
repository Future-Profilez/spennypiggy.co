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

    const DefaultVariant = () => (
        <Link onClick={handleDismiss} href="/founder/bonus" className="my-2 mb-4 block w-full relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
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
            </div>

            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
                <FaTimes className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative z-10">
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
        </Link>
    );

    const CompactVariant = () => (
        <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 mb-4 overflow-hidden shadow-md">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1 right-2 animate-pulse">
                    <FaStar className="text-white text-sm" />
                </div>
                <div className="absolute bottom-1 left-2 animate-bounce delay-300">
                    <FaGift className="text-white text-xs" />
                </div>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-1">
                        <FaGift className="text-white mr-2 text-sm" />
                        <h4 className="text-white font-bold text-sm">👑 Founder Program</h4>
                    </div>
                    <p className="text-white text-xs">
                        Earn £2,500 in 30 days → Get 10% monthly bonus!
                    </p>
                </div>
                
                <div className="flex gap-2 ml-4">
                    <Link
                        href="/founder/bonus"
                        className="bg-white text-orange-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                        Join
                    </Link>
                </div>
                
                <button
                    onClick={handleDismiss}
                    className="absolute top-1 right-1 text-white/70 hover:text-white transition-colors"
                >
                    <FaTimes className="text-sm" />
                </button>
            </div>
        </div>
    );

    const GradientVariant = () => (
        <Link href="/founder/bonus" className="block w-full relative bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-2xl p-8 mb-6 overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-15">
                <div className="absolute top-4 left-6 animate-bounce">
                    <FaStar className="text-white text-2xl" />
                </div>
                <div className="absolute top-8 right-12 animate-pulse delay-200">
                    <FaGift className="text-yellow-100 text-3xl" />
                </div>
                <div className="absolute bottom-6 left-12 animate-bounce delay-500">
                    <FaFire className="text-red-200 text-xl" />
                </div>
                <div className="absolute bottom-8 right-6 animate-pulse delay-700">
                    <FaStar className="text-white text-lg" />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow">
                    <div className="w-32 h-32 border-2 border-white/10 rounded-full"></div>
                </div>
            </div>
            <div className="relative z-10 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-white/20 rounded-full p-3 mr-4">
                        <FaGift className="text-white text-2xl" />
                    </div>
                    <h2 className="text-white font-bold text-3xl">👑 Founder Program</h2>
                </div>
                
                <p className="text-white text-xl mb-2 font-semibold">
                    Earn <span className="text-yellow-200 font-bold">£2,500</span> in your first 30 days
                </p>
                <p className="text-white/90 text-lg mb-6">
                    Get <span className="text-yellow-200 font-bold">10% monthly bonus</span> + exclusive founder badge & priority support
                </p>
                
                {/* <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/founder/bonus"
                        className="bg-white text-orange-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                    >
                        Join Founder Program
                    </Link>
                    <Link
                        href="/founder/bonus"
                        className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-white hover:text-orange-600 transition-all transform hover:scale-105"
                    >
                        Learn More
                    </Link>
                </div> */}
            </div>
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20"
            >
                <FaTimes className="text-lg" />
            </button>
        </Link>
    );

    const variants = {
        default: DefaultVariant,
        compact: CompactVariant,
        gradient: GradientVariant
    };

    const SelectedVariant = variants[variant] || variants.default;

    return <SelectedVariant />;
}