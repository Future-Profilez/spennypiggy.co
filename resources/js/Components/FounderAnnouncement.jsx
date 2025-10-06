import React, { useState } from 'react';
import { FaCrown, FaTimes, FaGift, FaChartLine } from 'react-icons/fa';
import { BsStars } from 'react-icons/bs';
import { Link } from '@inertiajs/react';

export default function FounderAnnouncement({ 
    user, 
    first30DayEarnings, 
    onDismiss,
    variant = 'celebration' // 'celebration', 'info', 'compact'
}) {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible || !user?.is_founder) return null;

    const CelebrationVariant = () => (
        <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl shadow-2xl p-8 text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 animate-bounce">
                    <BsStars className="w-6 h-6" />
                </div>
                <div className="absolute top-8 right-8 animate-pulse">
                    <FaCrown className="w-8 h-8" />
                </div>
                <div className="absolute bottom-4 left-1/3 animate-bounce delay-300">
                    <BsStars className="w-4 h-4" />
                </div>
                <div className="absolute bottom-8 right-1/4 animate-pulse delay-500">
                    <FaGift className="w-6 h-6" />
                </div>
            </div>

            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
                <FaTimes className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white/20 rounded-full">
                        <FaCrown className="w-12 h-12" />
                    </div>
                </div>
                
                <h2 className="text-3xl font-bold mb-2">
                    🎉 Congratulations, {user.name}!
                </h2>
                
                <p className="text-xl mb-4 opacity-90">
                    You're now a SpennyPiggy Founder!
                </p>
                
                <div className="bg-white/20 rounded-lg p-4 mb-6">
                    <p className="text-lg font-semibold mb-2">
                        Your First 30-Day Achievement
                    </p>
                    <p className="text-3xl font-bold">
                        £{Number(first30DayEarnings || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                    <div className="bg-white/10 rounded-lg p-3">
                        <FaGift className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Monthly Bonus</p>
                        <p className="opacity-80">10% extra earnings</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                        <FaCrown className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Founder Badge</p>
                        <p className="opacity-80">Profile recognition</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                        <FaChartLine className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Priority Support</p>
                        <p className="opacity-80">Direct team access</p>
                    </div>
                </div>

                <Link
                    href="/founder/bonus"
                    className="inline-block bg-white text-yellow-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                    View Founder Dashboard
                </Link>
            </div>
        </div>
    );

    const InfoVariant = () => (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FaCrown className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
                <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Founder Program Benefits
                    </h3>
                    <p className="text-gray-700 mb-4">
                        As a SpennyPiggy Founder, you earn 10% bonus on monthly earnings between £100-£1000.
                    </p>
                    <Link
                        href="/founder/bonus"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Learn more about your benefits
                        <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </Link>
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors" >
                    <FaTimes className="w-4 h-4 text-gray-400" />
                </button>
            </div>
        </div>
    );

    const CompactVariant = () => (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <FaCrown className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                        <p className="font-semibold text-gray-900">Founder Status Active</p>
                        <p className="text-sm text-gray-600">Earning 10% monthly bonus</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Link
                        href="/founder/bonus"
                        className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                    >
                        View Dashboard
                    </Link>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-full hover:bg-yellow-100 transition-colors"
                    >
                        <FaTimes className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
    );

    const variants = {
        celebration: CelebrationVariant,
        info: InfoVariant,
        compact: CompactVariant
    };

    const SelectedVariant = variants[variant] || variants.celebration;

    return <>
    <SelectedVariant />
    </>
}