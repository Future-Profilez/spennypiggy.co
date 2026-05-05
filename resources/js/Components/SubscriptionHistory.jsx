import React, { useRef, useEffect } from "react";
import { Calendar, Clock, XCircle } from "lucide-react";
import {
    CircleCheckIcon,
    CreditCardIcon,
} from "@animateicons/react/lucide";

const SubscriptionHistory = ({ subscriptionHistory = [] }) => {
    const emptyIconRef = useRef(null);

    useEffect(() => {
        if (!subscriptionHistory || subscriptionHistory.length === 0) {
            const interval = setInterval(() => {
                emptyIconRef.current?.startAnimation?.();
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [subscriptionHistory]);

    if (!subscriptionHistory || subscriptionHistory.length === 0) {
        return (
            <div 
                className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6"
                onMouseEnter={() => emptyIconRef.current?.startAnimation()}
            >
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                        <CreditCardIcon
                            ref={emptyIconRef}
                            className="mx-auto h-12 w-12 opacity-50"
                            duration={1.5}
                        />
                    </div>
                    <p className="text-gray-500 font-medium">
                        No billing history yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        Your subscription payments will appear here once
                        processed.
                    </p>
                </div>
            </div>
        );
    }

    // Sort newest first
    const sortedHistory = [...subscriptionHistory].sort((a, b) => {
        const dateA = new Date(a.current_start_subscription_date || a.current_start_trial_date || a.created_at);
        const dateB = new Date(b.current_start_subscription_date || b.current_start_trial_date || b.created_at);
        return dateB - dateA;
    });

    return (
        <div className="w-full mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b-2 border-gray-100 bg-gray-50">
                        <tr className="text-gray-600 font-bold uppercase tracking-wider">
                            <th className="py-3 px-3">Start Date</th>
                            <th className="py-3 px-3">Stripe ID / Session</th>
                            <th className="py-3 px-3">Amount</th>
                            <th className="py-3 px-3">End Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedHistory.map((charge, index) => (
                            <StatusRow key={charge.id || index} charge={charge} index={index} />
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="pt-6 text-center">
                <p className="text-xs font-medium text-gray-400 bg-gray-50 inline-block px-4 py-1.5 rounded-full">
                    Showing {subscriptionHistory.length} billing record{subscriptionHistory.length !== 1 ? "s" : ""}
                </p>
            </div>
        </div>
    );
};

const StatusRow = ({ charge, index }) => {
    const iconRef = useRef(null);
    
    useEffect(() => {
        const startLoop = () => {
            iconRef.current?.startAnimation?.();
            const nextDelay = 5000 + Math.random() * 5000;
            const timeout = setTimeout(startLoop, nextDelay);
            return timeout;
        };
        
        const initialDelay = 1000 + Math.random() * 5000;
        const initialTimeout = setTimeout(() => {
            const loopTimeout = startLoop();
            return () => clearTimeout(loopTimeout);
        }, initialDelay);
        
        return () => clearTimeout(initialTimeout);
    }, []);

    // Simple date formatting function
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch (error) {
            return "Invalid Date";
        }
    };

    return (
        <tr 
            className="hover:bg-gray-50 transition-colors group/row"
            onMouseEnter={() => iconRef.current?.startAnimation?.()}
        >
            <td className="py-4 px-3 text-gray-900 font-medium whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(charge.current_start_subscription_date || charge.current_start_trial_date)}
                </div>
            </td>
            <td className="py-4 px-3 font-mono text-[10px] max-w-[120px] truncate text-gray-500" title={charge.stripe_id || charge.session_id}>
                {charge.stripe_id || charge.session_id}
            </td>
            <td className="py-4 px-3 font-bold text-gray-800">

                 <span className={`px-2 py-1 rounded-xl text-[10px] font-black uppercase inline-flex items-center gap-1.5 min-w-[80px] mb-1 status-icon ${
                    charge.status === 'active' || charge.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' : 
                    charge.status === 'trialing' || charge.status === 'trial' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-red-100 text-red-700 border border-red-200'
                }`}>
                    {charge.status === 'active' || charge.status === 'paid' ? (
                        <CircleCheckIcon ref={iconRef} size={12} duration={1.2} />
                    ) : charge.status === 'trialing' || charge.status === 'trial' ? (
                        <Clock size={12} />
                    ) : (
                        <XCircle size={12} />
                    )}
                    {charge.status}
                </span>

                {charge.status === 'trialing' ? (
                    <span className="block !mt-2 text-blue-600">Free Trial</span>
                ) : (
                    <span className="block !mt-2 text-black">
                        {charge.currency || '£'} {parseFloat(charge.amount || 0).toFixed(2)}
                    </span>
                )}
            </td>
            <td className="py-4 px-3 text-gray-700 font-medium">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(charge.current_end_subscription_date || charge.current_end_trial_date)}
                </div>
            </td>
        </tr>
    );
};

export default SubscriptionHistory;
