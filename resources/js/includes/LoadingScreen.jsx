import React from "react";

function PiggyCute({ className = "", ...props }) {
    return (
        <svg
            viewBox="0 0 120 120"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <circle cx="60" cy="60" r="44" fill="#FF4DA6" stroke="#FFD700" strokeWidth="8" />
            <path
                d="M24 54C18 50 14 44 14 38C14 30 20 26 28 28"
                stroke="#FFD700"
                strokeWidth="8"
                strokeLinecap="round"
            />
            <path
                d="M96 54C102 50 106 44 106 38C106 30 100 26 92 28"
                stroke="#FFD700"
                strokeWidth="8"
                strokeLinecap="round"
            />
            <g>
                <circle cx="45" cy="48" r="6" fill="#111827" />
                <circle cx="75" cy="48" r="6" fill="#111827" />
            </g>
            <ellipse cx="60" cy="72" rx="18" ry="13" fill="#FF80C3" stroke="#FFD700" strokeWidth="6" />
            <circle cx="54" cy="72" r="3.1" fill="#FFD700" />
            <circle cx="66" cy="72" r="3.1" fill="#FFD700" />
        </svg>
    );
}

function PiggyPotFillV3() {
    return (
        <div className="w-full flex justify-center p-6">
            <style>{`
                @keyframes sp-fill3 { 0% { width: 12%; } 55% { width: 92%; } 100% { width: 12%; } }
                @keyframes sp-drop3 { 0% { transform: translateY(-22px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(26px); opacity: 0; } }
            `}</style>
            <div className="w-full max-w-lg ">
                <div className="mt-5   overflow-hidden relative">
                    <div className="h-26 flex items-center justify-center">
                        <PiggyCute className="w-20 h-20" />
                    </div>
                   
                    <div
                        className="absolute left-[22%] top-4 w-4 h-4 rounded-full border-[3px] border-black bg-[#FFD700]"
                        style={{ animation: "sp-drop3 1.1s linear infinite" }}
                    />
                    <div
                        className="absolute left-[80%] top-4 w-4 h-4 rounded-full border-[3px] border-black bg-[#FFD700]"
                        style={{ animation: "sp-drop3 1.1s linear infinite", animationDelay: "0.4s" }}
                    />
                    <div
                        className="absolute left-[30%] top-4 w-4 h-4 rounded-full border-[3px] border-black bg-[#FFD700]"
                        style={{ animation: "sp-drop3 1.1s linear infinite", animationDelay: "0.4s" }}
                    />
                    <div
                        className="absolute left-[46%] top-4 w-4 h-4 rounded-full border-[3px] border-black bg-[#FFD700]"
                        style={{ animation: "sp-drop3 1.1s linear infinite", animationDelay: "0.2s" }}
                    />
                    <div
                        className="absolute left-[70%] top-4 w-4 h-4 rounded-full border-[3px] border-black bg-[#FFD700]"
                        style={{ animation: "sp-drop3 1.1s linear infinite", animationDelay: "0.4s" }}
                    />
                </div>
                <h2 className="text-center mt-2 text-black font-bold text-xl uppercase">
                        Loading..
                </h2>
                <h2 className="text-center mt-2 text-gray-600 font-bold text-normal capitalize">
                        Wait a moment...
                </h2>
            </div>
        </div>
    );
}

export default function LoadingScreen(props) {
    return <PiggyPotFillV3 {...props} />;
}
