import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BiLockAlt, BiTime } from 'react-icons/bi';
import { route } from 'ziggy-js';

export default function ReserveWidget({ className = '' }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        axios.get(route('creator.payouts.reserves'))
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch reserves", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className={`animate-pulse h-32 bg-gray-100 rounded-xl ${className}`}></div>;

    if (!data || data.total_held <= 0) return null;

    return (
        <div className={`bg-white rounded-[30px] shadow p-6 border-2 border-yellow-100 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                        <BiLockAlt size={24} />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Funds on Hold (Reserves)</h3>
                        <p className="text-2xl font-black text-gray-900">
                            {(data.total_held).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setExpanded(!expanded)}
                    className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline"
                >
                    {expanded ? 'Hide Details' : 'View Release Dates'}
                </button>
            </div>

            <div className="mt-5 p-4 bg-yellow-50/50 rounded-2xl">
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                    Funds are typically held for up to 30 days to cover potential disputes, after which they are automatically released to your balance.
                </p> 
                <p className="text-xs text-gray-500 italic leading-relaxed">
                    Note - We SP don't hold or have access to your funds, we just control the payments timing, amounts and speed based on our payments policy linked to your individual level of risk.
                </p>
            </div>

            {expanded && (
                <div className="mt-5 border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Upcoming Releases</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {data.breakdown.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <BiTime className="text-gray-400" />
                                    <span className="text-gray-600">
                                        Releasing <strong>{new Date(item.release_date).toLocaleDateString()}</strong>
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-gray-900">
                                        {(item.amount / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {item.days_remaining > 0 ? `${item.days_remaining} days left` : 'Processing'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
