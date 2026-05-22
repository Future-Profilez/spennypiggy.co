import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function PiggyPotSocialProof({ topSupporters, feed, user }) {
    if ((!topSupporters || topSupporters.length === 0) && (!feed || feed.length === 0)) return null;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-xl font-bold mb-4">Community Activity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Piggies */}
                {topSupporters && topSupporters.length > 0 && (
                    <div>
                        <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-4">Top Piggies</h4>
                        <div className="space-y-4">
                            {topSupporters.map((supporter, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center font-bold text-gray-400">
                                            {supporter.avatar ? (
                                                <img src={supporter.avatar} alt={supporter.name} className="w-full h-full object-cover" />
                                            ) : (
                                                supporter.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{supporter.name}</p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-pink-500">
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
                        <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-4">Recent Supporters</h4>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                            {feed.map((item, idx) => (
                                <div key={idx} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-xl">
                                    <div className="text-2xl">🎉</div>
                                    <div>
                                        <p className="text-sm">
                                            <span className="font-bold">{item.name}</span> contributed{' '}
                                            <span className="font-bold text-pink-500">
                                                {item.currency === 'GBP' ? '£' : '$'}{parseFloat(item.amount / 100).toFixed(2)}
                                            </span>
                                        </p>
                                        {item.message && (
                                            <p className="text-xs text-gray-600 mt-1 italic">"{item.message}"</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
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
