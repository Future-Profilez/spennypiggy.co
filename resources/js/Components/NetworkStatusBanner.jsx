import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '@/utils/haptics';

export default function NetworkStatusBanner() {
    const [status, setStatus] = useState('online'); // 'online' | 'offline' | 'restored'
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setStatus('restored');
            setVisible(true);
            triggerHaptic('success');

            const timer = setTimeout(() => {
                setVisible(false);
                setStatus('online');
            }, 3500);
            return () => clearTimeout(timer);
        };

        const handleOffline = () => {
            setStatus('offline');
            setVisible(true);
            triggerHaptic('error');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!visible) return null;

    const isOffline = status === 'offline';

    return (
        <div className="fixed top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] left-1/2 -translate-x-1/2 z-[999999] w-[90%] max-w-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-[20px] backdrop-blur-xl border shadow-lg ${
                isOffline 
                    ? 'bg-[#16161C]/95 border-amber-500/30 text-amber-300 shadow-amber-500/10' 
                    : 'bg-[#16161C]/95 border-[#05EFB8]/30 text-[#05EFB8] shadow-[#05EFB8]/10'
            }`}>
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isOffline ? 'bg-amber-400' : 'bg-[#05EFB8]'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            isOffline ? 'bg-amber-500' : 'bg-[#05EFB8]'
                        }`}></span>
                    </span>
                    <span className="text-xs font-medium tracking-wide">
                        {isOffline ? '⚡ Offline Mode — Showing cached data' : '🟢 Connection restored — You are online'}
                    </span>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded-[20px] bg-white/5 hover:bg-white/10 transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
