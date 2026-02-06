import React, { useState } from 'react';
import { HiPlus } from 'react-icons/hi2';

export default function ProfileTabs({ 
    activeTab = 'about', 
    onTabChange, 
    showAddButton = true,
    onAddClick
}) {
    const tabs = [
        { key: 'about', label: 'ABOUT' },
        { key: 'wishes', label: 'WISHES' },
        { key: 'memberships', label: 'MEMBERSHIPS' },
        { key: 'bills', label: 'BILLS' },
        { key: 'shop', label: 'SHOP' },
        { key: 'gifts', label: 'GIFTS' }
    ];

    return (
        <div className="w-full bg-[#0B0C10] sticky top-[88px] md:top-[96px] z-40 border-b border-white/5 backdrop-blur-xl bg-opacity-90">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-2 md:py-4">
                {/* Tabs Container */}
                <div className="flex items-center gap-6 md:gap-10 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange && onTabChange(tab.key)}
                            className={`
                                relative py-4 text-[10px] md:text-xs font-black tracking-[0.2em] transition-all duration-300 whitespace-nowrap uppercase
                                ${activeTab === tab.key 
                                    ? 'text-white' 
                                    : 'text-white/30 hover:text-white/60'
                                }
                            `}
                        >
                            {tab.label}
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#F94F96] to-[#8C52FF] rounded-t-full shadow-[0_-2px_15px_rgba(249,79,150,0.5)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Add Button with Premium Gradient */}
                {showAddButton && (
                    <button
                        onClick={onAddClick}
                        className="ml-6 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#05EFB8] via-[#05EFB8] to-[#00b67a] text-black hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl shadow-[#05EFB8]/20 group"
                    >
                        <HiPlus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                )}
            </div>
        </div>
    );
}
