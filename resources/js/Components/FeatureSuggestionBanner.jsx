import React, { useState, useEffect } from 'react';
import { FaTimes, FaLightbulb } from 'react-icons/fa';

export default function FeatureSuggestionBanner({ onSuggestClick }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissedAt = localStorage.getItem('feature_suggestion_banner_dismissed_at');
        if (!dismissedAt) {
            setIsVisible(true);
        } else {
            const twentyDaysInMs = 20 * 24 * 60 * 60 * 1000;
            const now = new Date().getTime();
            if (now - parseInt(dismissedAt) > twentyDaysInMs) {
                setIsVisible(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('feature_suggestion_banner_dismissed_at', new Date().getTime().toString());
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="mx-auto w-full mb-6">
            <div className="relative group bg-white border-[3px] border-black rounded-box p-5 md:p-6  overflow-hidden transition-all ">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#924DFF]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#924DFF]/20 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FF007F]/5 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none group-hover:bg-[#FF007F]/10 transition-colors duration-500"></div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative ">
                    {/* Icon container */}
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-[#EFEA7B] border-[3px] border-black rounded-box-sm flex items-center justify-center rotate-3  duration-500 flex-shrink-0">
                        <FaLightbulb className="text-black text-xl md:text-2xl animate-pulse" />
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-grow text-center md:text-left">
                        <h3 className="font-gulfs text-xl md:text-xl text-black uppercase tracking-tight mb-1  transition-colors">
                            Want to suggest a feature?
                        </h3>
                        <p className="text-black/80 font-poppins text-sm md:text-sm leading-relaxed max-w-xl">
                            Help us shape the future of Spenny Piggy! Share your ideas and help us build a better platform for everyone.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0 mt-2 md:mt-0">
                        <button 
                            onClick={onSuggestClick}
                            className="bg-[#924DFF] text-white font-gulfs min-h-[44px] px-5 py-3 rounded-box-sm border-[2px] !border-black transition-colors duration-200 hover:brightness-110 active:brightness-95 uppercase text-sm tracking-widest"
                        >
                            Suggest Now
                        </button>
                        
                        <button
                            onClick={handleDismiss}
                            className="w-11 h-11 flex items-center justify-center rounded-box-sm border-[2px] border-black text-black/60 hover:text-black hover:bg-black/[0.04] transition-colors duration-200"
                            title="Dismiss for 20 days"
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
