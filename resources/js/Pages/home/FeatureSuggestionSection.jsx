import { useState } from 'react';
import FeatureSuggestionModal from '@/Components/FeatureSuggestionModal';
import { FaLightbulb, FaRocket, FaStar, FaMagic, FaPlus } from 'react-icons/fa';

export default function FeatureSuggestionSection({ auth }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <section className="bg-black py-24 md:py-32 relative overflow-hidden border-t border-white/5">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-500/5 rounded-full filter blur-[100px]"></div>
                
                {/* Floating particles */}
                <div className="absolute top-1/4 left-10 w-1 h-1 bg-white/20 rounded-full animate-ping"></div>
                <div className="absolute top-3/4 left-1/4 w-1.5 h-1.5 bg-purple-500/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
                <div className="absolute top-1/2 right-20 w-1 h-1 bg-yellow-400/20 rounded-full animate-pulse"></div>
                <div className="absolute top-10 right-1/3 w-2 h-2 bg-pink-500/10 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
            </div>

            <div className="containerbox relative z-10 px-4 mx-auto text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="fading flex justify-center mb-10">
                        <div className="relative group cursor-default">
                            <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full group-hover:bg-yellow-400/40 transition-all duration-700"></div>
                            <div className="relative w-24 h-24 bg-[#0d0d0d] border border-white/10 rounded-[30px] flex items-center justify-center shadow-2xl transform transition-transform duration-700 group-hover:scale-110">
                                <FaLightbulb className="text-[#EFEA7B] text-5xl drop-shadow-[0_0_15px_rgba(239,234,123,0.4)]" />
                            </div>
                        </div>
                    </div>
                    
                    <h2 className="fading text-4xl md:text-5xl lg:text-6xl font-gulfs text-white mb-6 uppercase tracking-tight leading-[1.1]">
                        Have a <span className="text-gradient-wishlist">Brilliant</span> Idea?
                    </h2>
                    
                    <p className="fading text-gray-400 text-lg md:text-xl font-poppins mb-12 leading-relaxed max-w-2xl mx-auto opacity-90">
                        We're constantly building and improving Spenny Piggy for our community. 
                        Is there a feature you'd love to see? Let us know and help shape the future of the platform!
                    </p>
                    
                    <div className="fading">
                        <button 
                            onClick={() => setShowModal(true)}
                            className="group relative inline-flex items-center gap-6 bg-white text-black font-gulfs uppercase text-lg md:text-xl py-4 px-10 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.15)] hover:scale-105 hover:-rotate-1 transition-all duration-500 overflow-hidden"
                        >
                            <span className="relative z-10">Suggest a Feature</span>
                            <FaRocket className="relative z-10 text-xl group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-500" />
                            
                            {/* Hover Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </button>
                    </div>
                </div>
            </div>

            <FeatureSuggestionModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                auth={auth} 
            />
        </section>
    );
}
