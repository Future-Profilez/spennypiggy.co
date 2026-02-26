import React from 'react';
import { RiWifiOffLine, RiRefreshLine } from 'react-icons/ri';

export default function OfflinePage() {
    return (
        <>
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                body { overflow: hidden; }
            `}</style>
            <div className="fixed inset-0 z-[9999] w-full h-full flex flex-col items-center justify-center bg-white p-6 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                     <div className="absolute top-10 left-10 text-6xl transform -rotate-12">☁️</div>
                     <div className="absolute bottom-20 right-10 text-8xl transform rotate-12">🐷</div>
                     <div className="absolute top-1/3 right-1/4 text-4xl transform rotate-45">⚡</div>
                     <div className="absolute bottom-1/3 left-1/4 text-5xl transform -rotate-12">🔌</div>
                </div>

                <div className="w-full max-w-md  p-8 md:p-10 text-center relative z-10 border border-white/50 transform transition-all hover:scale-[1.01]">
                    <div className="relative inline-flex items-center justify-center mb-8 animate-float">
                        <div className="absolute inset-0 bg-pink-100 rounded-full opacity-50 blur-xl scale-150"></div>
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-pink-100 to-yellow-50 flex items-center justify-center shadow-inner relative z-1">
                            <RiWifiOffLine className="text-5xl text-[#F94F96] drop-shadow-sm" />
                        </div>
                        <div className="!z-3 absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white animate-pulse">
                            OFFLINE
                        </div>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
                        Whoops! <span className="text-[#F94F96]">No Internet</span>
                    </h1>
                    
                    <p className="text-gray-600 mb-8 text-base md:text-lg leading-relaxed font-medium">
                        It looks like your connection has wandered off. Check your signal or Wi-Fi and give it another shot.
                    </p>
                    
                    <div className="space-y-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="group relative w-full flex items-center justify-center px-8 py-4 bg-[#F94F96] text-white text-lg font-bold rounded-[30px] shadow-[0_10px_20px_-10px_rgba(249,79,150,0.5)] hover:bg-[#d9367d] hover:shadow-[0_15px_25px_-10px_rgba(249,79,150,0.6)] focus:outline-none focus:ring-4 focus:ring-pink-300 transform transition-all duration-200 active:scale-95"
                        >
                            <span className="mr-2 group-hover:animate-spin">
                                <RiRefreshLine size={24} />
                            </span>
                            Try Again
                        </button>
                        
                        <p className="text-xs text-gray-400 font-medium">
                            Don't worry, your piggy bank is safe! 🐷
                        </p>
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="absolute bottom-6 text-center w-full opacity-60">
                     <p className="text-xs font-bold tracking-widest text-pink-900 uppercase">Spenny Piggy</p>
                </div>
            </div>
        </>
    );
}
