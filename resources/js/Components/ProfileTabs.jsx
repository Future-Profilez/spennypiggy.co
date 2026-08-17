import React, { useState } from 'react';
import { HiPlus } from 'react-icons/hi2';

export default function ProfileTabs({ 
    activeTab = 'about', 
    onTabChange, 
    showAddButton = true,
    onAddClick,
    showSecurity = false
}) {
    const tabs = [
        { key: 'about', label: 'ABOUT' },
        { key: 'wishes', label: 'WISHES' },
        { key: 'memberships', label: 'MEMBERSHIPS' },
        { key: 'bills', label: 'BILLS' },
        { key: 'shop', label: 'SHOP' },
        { key: 'gifts', label: 'GIFTS' }
    ];

    if (showSecurity) {
        tabs.push({ key: 'security', label: 'SECURITY' });
    }

    return (
        <div className="w-full bg-black sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 py-3 profile-tabs">
                {/* Tabs Container */}
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide flex-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange && onTabChange(tab.key)}
                            className={`
                                px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 tab-button
                                ${activeTab === tab.key 
                                    ? 'text-white tab-button-active' 
                                    : 'text-white/60 hover:text-white'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Add Button */}
                {showAddButton && (
                    <button
                        onClick={onAddClick}
                        className="ml-4 flex items-center justify-center w-11 h-11 rounded-full border-2 border-[#05EFB8] text-[#05EFB8] hover:bg-[#05EFB8] hover:text-black transition-all duration-200 flex-shrink-0 add-button-pulse"
                    >
                        <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
            </div>
            
            {/* Bottom border line */}
            <div className="h-px bg-gray-800"></div>
        </div>
    );
}
