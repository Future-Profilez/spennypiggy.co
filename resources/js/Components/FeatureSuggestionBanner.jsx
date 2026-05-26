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
            <div className="relative group bg-white border-[3px] border-black rounded-[25px] p-5 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#924DFF]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#924DFF]/20 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FF007F]/5 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none group-hover:bg-[#FF007F]/10 transition-colors duration-500"></div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative ">
                    {/* Icon container */}
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-[#EFEA7B] border-[3px] border-black rounded-[30px] flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                        <FaLightbulb className="text-black text-xl md:text-2xl animate-pulse" />
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-grow text-center md:text-left">
                        <h3 className="font-gulfs text-xl md:text-xl text-black uppercase tracking-tight mb-1  transition-colors">
                            Want to suggest a feature?
                        </h3>
                        <p className="text-gray-600 font-poppins text-sm md:text-sm leading-relaxed max-w-xl">
                            Help us shape the future of Spenny Piggy! Share your ideas and help us build a better platform for everyone.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0 mt-2 md:mt-0">
                        <button 
                            onClick={onSuggestClick}
                            className="bg-[#924DFF] text-white font-gulfs px-5 py-3 rounded-[15px] border-[3px] !border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all uppercase text-sm tracking-widest active:scale-95"
                        >
                            Suggest Now
                        </button>
                        
                        <button 
                            onClick={handleDismiss}
                            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-[15px] bg-white/5 border-[3px] border-black text-gray-400 hover:text-white hover:bg-white/10 hover:!text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] active:scale-95"
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
