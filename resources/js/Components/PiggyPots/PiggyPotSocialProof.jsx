import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from '@inertiajs/react';

/**
 * MySQL-style "Y-m-d H:i:s" is Invalid Date in Safari/iOS, and
 * formatDistanceToNow throws a RangeError on it — which took the whole
 * profile tree down. Parse defensively and render nothing on failure.
 */
const relativeTime = (value) => {
    if (!value) return null;
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return null;
    try {
        return formatDistanceToNow(parsed, { addSuffix: true });
    } catch (e) {
        return null;
    }
};

export default function PiggyPotSocialProof({ topSupporters, feed, user }) {
    // Hooks must run before any early return, or the first render where the
    // lists go from empty to populated throws "Rendered more hooks…".
    const [activeTab, setActiveTab] = useState('top');

    if ((!topSupporters || topSupporters.length === 0) && (!feed || feed.length === 0)) return null;

    const activeList = activeTab === 'top' ? (topSupporters || []) : (feed || []);

    return (
        <div className="mb-6 w-full bg-white rounded-box  border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-4">
                <h3 className="font-gulfs text-2xl md:text-2xl text-black uppercase tracking-wide">COMMUNITY ACTIVITY</h3>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('top')} className={`px-4 py-2 rounded-full border-[3px] border-black font-black text-xs md:text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${activeTab === 'top' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}>TOP SUPPORTERS</button>
                    <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 rounded-full border-[3px] border-black font-black text-xs md:text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${activeTab === 'feed' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}>RECENT</button>
                </div>
            </div>
            
            <div className="!border-b-[2px] border-black mb-4 w-full"></div>
            
            <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === 'top' ? (
                    <>
                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                            {activeList.map((item, idx) => {
                                // Brand tints only — the old pink/blue/yellow/green cycle
                                // introduced three hues the design system doesn't have.
                                const bgColors = ['bg-[#A2E4B8]', 'bg-[#FF007F]/20', 'bg-black/10', 'bg-white'];
                                const bgColor = bgColors[idx % bgColors.length];
                                
                                const username = item.username || item.user?.username || '';
                                const isClickable = Boolean(username) && item.name !== 'Anonymous';
                                
                                const content = (
                                    <>
                                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${bgColor} border-[3px] border-black flex items-center justify-center font-black text-2xl md:text-3xl text-black relative shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]`}>
                                            {item.avatar ? (
                                                <img src={item.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                String(item.name || 'A').charAt(0).toUpperCase()
                                            )}
                                            <div className="absolute -bottom-2 -right-2 bg-[#A2E4B8] border-[2px] border-black text-[10px] md:text-xs font-black px-1.5 py-0.5 rounded-full z-10 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">#{idx + 1}</div>
                                        </div>
                                        <div className="font-black text-black mt-3 w-full text-center truncate">{item.name}</div>
                                        {/* Supporter's VIP tier — same VipScoreService that
                                            drives the public leaderboard and their own hub,
                                            so the badge reads identically everywhere. */}
                                        {item.vip && (
                                            <div
                                                title={`${item.vip.level} supporter · VIP score ${item.vip.score}`}
                                                aria-label={`${item.vip.level} supporter tier`}
                                                className="mt-2 inline-flex items-center gap-1 rounded-full border-[2px] border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                style={{ color: item.vip.color }}
                                            >
                                                <span aria-hidden="true">{item.vip.icon}</span>
                                                {item.vip.level}
                                            </div>
                                        )}
                                        <div className="font-black text-[#FF007F] mt-1 text-xs md:text-sm uppercase tracking-widest">
                                            {(item.purchases ?? 0)} {(item.purchases === 1 ? 'unlock' : 'unlocks')}
                                        </div>
                                    </>
                                );

                                const cardClasses = isClickable
                                    ? "flex-shrink-0 w-[140px] md:w-[160px] bg-white rounded-box-sm border-[3px] border-black p-4 flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                                    : "flex-shrink-0 w-[140px] md:w-[160px] bg-white rounded-box-sm border-[3px] border-black p-4 flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default";

                                return isClickable ? (
                                    <Link key={idx} href={route('user.show', username)} className={cardClasses}>
                                        {content}
                                    </Link>
                                ) : (
                                    <div key={idx} className={cardClasses}>
                                        {content}
                                    </div>
                                );
                            })}
                            
                            {/* Placeholder Cards */}
                            {[...Array(Math.min(3, Math.max(0, 4 - activeList.length)))].map((_, idx) => (
                                <div key={`empty-${idx}`} className="flex-shrink-0 w-[140px] md:w-[160px] bg-gray-50 rounded-box-sm border-[3px] border-dashed border-gray-400 p-4 flex flex-col items-center justify-center min-h-[160px]">
                                    <div className="text-3xl md:text-4xl mb-2 opacity-50">🐷</div>
                                    <div className="font-bold text-gray-400 text-xs md:text-sm text-center">Be the next!</div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4">
                        {activeList.map((item, idx) => {
                            const username = item.username || item.user?.username || '';
                            const isClickable = Boolean(username) && item.name !== 'Anonymous';
                            
                            const content = (
                                <div className="flex items-start space-x-3 md:space-x-4">
                                    <div className="text-xl md:text-2xl mt-1 bg-white rounded-full p-2 border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
                                        🎉
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm md:text-lg font-black text-gray-800 leading-snug">
                                            <span className="font-black text-black break-words">{item.name}</span>{' '}
                                            <span className="font-black text-pink-500 whitespace-nowrap">
                                                unlocked content
                                            </span>
                                        </p>
                                        {item.message && (
                                            <div className="mt-3 bg-white p-3 rounded-box-sm border-[3px] border-black relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block max-w-full">
                                                <p className="text-xs md:text-sm text-gray-800 font-bold italic break-words">"{item.message}"</p>
                                            </div>
                                        )}
                                        {relativeTime(item.created_at) && (
                                            <p className="text-[10px] md:text-xs font-black text-gray-500 mt-3 uppercase tracking-widest">
                                                {relativeTime(item.created_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );

                            const cardClasses = isClickable
                                ? "bg-pink-50 p-4 md:p-5 rounded-box  border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer block"
                                : "bg-pink-50 p-4 md:p-5 rounded-box  border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default block";

                            return isClickable ? (
                                <Link key={idx} href={route('user.show', username)} className={cardClasses}>
                                    {content}
                                </Link>
                            ) : (
                                <div key={idx} className={cardClasses}>
                                    {content}
                                </div>
                            );
                        })}
                        {activeList.length === 0 && (
                            <div className="w-full bg-gray-50 rounded-box-sm border-[3px] border-dashed border-gray-400 p-8 flex flex-col items-center justify-center">
                                <div className="text-4xl mb-2 opacity-50">🐷</div>
                                <div className="font-bold text-gray-400 text-sm text-center">No recent unlocks yet.</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
