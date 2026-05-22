import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function PiggyPotSocialProof({ topSupporters, feed, user }) {
    if ((!topSupporters || topSupporters.length === 0) && (!feed || feed.length === 0)) return null;

    return (
        <div className="bg-white rounded-[30px] p-6 md:p-8 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-wide mb-6">Community Activity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Piggies */}
                {topSupporters && topSupporters.length > 0 && (
                    <div>
                        <h4 className="font-bold text-gray-600 uppercase text-sm tracking-wider mb-4 border-b-2 border-black pb-2">Top Piggies</h4>
                        <div className="space-y-3">
                            {topSupporters.map((supporter, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-[#fdfbf7] p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-black bg-pink-100 overflow-hidden flex items-center justify-center font-bold text-pink-500">
                                            {supporter.avatar ? (
                                                <img src={supporter.avatar} alt={supporter.name} className="w-full h-full object-cover" />
                                            ) : (
                                                supporter.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm">{supporter.name}</p>
                                        </div>
                                    </div>
                                    <div className="font-black text-pink-500 bg-white px-2 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        £{parseFloat(supporter.total / 100).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Feed */}
                {feed && feed.length > 0 && (
                    <div>
                        <h4 className="font-bold text-gray-600 uppercase text-sm tracking-wider mb-4 border-b-2 border-black pb-2">Recent Supporters</h4>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                            {feed.map((item, idx) => (
                                <div key={idx} className="flex items-start space-x-3 bg-pink-50 p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="text-2xl mt-1">🎉</div>
                                    <div>
                                        <p className="text-sm">
                                            <span className="font-black">{item.name}</span> contributed{' '}
                                            <span className="font-black text-pink-500">
                                                {item.currency === 'GBP' ? '£' : '$'}{parseFloat(item.amount / 100).toFixed(2)}
                                            </span>
                                        </p>
                                        {item.message && (
                                            <p className="text-xs text-gray-800 mt-2 font-medium italic border-l-2 border-pink-500 pl-2">"{item.message}"</p>
                                        )}
                                        <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wider">
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
