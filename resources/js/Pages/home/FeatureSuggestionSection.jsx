import { useState } from 'react';
import FeatureSuggestionModal from '@/Components/FeatureSuggestionModal';
import { FaLightbulb, FaRocket, FaStar, FaMagic, FaPlus } from 'react-icons/fa';

export default function FeatureSuggestionSection({ auth }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <section className="bg-black py-32 relative overflow-hidden border-t border-white/5">
            <div className="containerbox relative z-10 px-4 mx-auto text-center">
                <div className="max-w-5xl mx-auto">
                    <div className="fading inline-flex items-center justify-center w-28 h-28 bg-white/5 border border-white/10 rounded-[35px] mb-10 transform -rotate-6 hover:rotate-0 transition-all duration-700 hover:border-[#EFEA7B] hover:shadow-[0_0_50px_rgba(239,234,123,0.3)] group cursor-default backdrop-blur-sm">
                        <FaLightbulb className="text-[#EFEA7B] text-6xl transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_#EFEA7B]" />
                    </div>
                    
                    <h2 className="fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white mb-4 uppercase leading-none tracking-tight">
                        Have a <span className="bg-gradient-to-r from-[#EFEA7B] via-[#F94F96] to-[#924DFF] bg-clip-text text-transparent animate-gradient-x">Brilliant</span> Idea?
                    </h2>
                    
                    <p className="fading text-gray-400 text-xl md:text-2xl font-poppins mb-6 leading-relaxed max-w-3xl mx-auto opacity-80">
                        We're constantly building and improving Spenny Piggy for our community. 
                        Is there a feature you'd love to see? Let us know and help shape the future of the platform!
                    </p>
                    
                    <div className="fading">
                        <button 
                            onClick={() => setShowModal(true)}
                            className="group relative inline-flex items-center justify-center px-8 py-4 font-gulfs uppercase text-xl md:text-xl text-white bg-transparent rounded-full border-2 border-white/20 transition-all duration-500 hover:border-transparent hover:text-black overflow-hidden active:scale-95 shadow-2xl"
                        >
                            <span className="relative z-10 flex items-center gap-6">
                                Suggest a Feature
                                <FaRocket className="text-xl transition-all duration-500 group-hover:translate-x-4 group-hover:-translate-y-4 group-hover:scale-125" />
                            </span>
                            
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#EFEA7B] via-[#F94F96] to-[#924DFF] opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-full group-hover:translate-y-0"></div>
                            
                            {/* Glow Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#EFEA7B] via-[#F94F96] to-[#924DFF] rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-500 z-0"></div>
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
