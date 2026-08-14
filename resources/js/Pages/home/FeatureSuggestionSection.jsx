import { useState } from 'react';
import FeatureSuggestionModal from '@/Components/FeatureSuggestionModal';
import { FaLightbulb, FaRocket, FaStar, FaMagic, FaPlus } from 'react-icons/fa';
import FadeIn from '@/Components/animations/FadeIn';
import ScrollX from '@/Components/animations/ScrollX';
import WatermarkStrip from '@/Components/animations/WatermarkStrip';
import Magnetic from '@/Components/animations/Magnetic';

export default function FeatureSuggestionSection({ auth }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <section
            className="py-12 md:py-28 relative overflow-hidden"
        >
        
            <WatermarkStrip text="Ideas" from={-300} to={50} opacity={0.28} className="top-28" />

            <div className="containerbox relative z-10 px-4 mx-auto text-center">
                <div className="max-w-4xl mx-auto">
                    <FadeIn y={20} scale={0.9} duration={0.5}>
                    <div className="fading flex justify-center mb-6 md:mb-10">
                        {/* Bulb tile spins gently as the page scrolls */}
                        <ScrollX from={0} to={0} rotate={18}>
                        <div className="relative group cursor-default">
                            <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full group-hover:bg-yellow-400/40 transition-all duration-700"></div>
                            <div className="relative w-16 h-16 md:w-24 md:h-24 bg-[#0d0d0d] border-2 border-white/10 rounded-box flex items-center justify-center transition-colors duration-500 group-hover:border-white/25">
                                <FaLightbulb className="text-[#E6EA7B] text-3xl md:text-5xl drop-shadow-[0_0_15px_rgba(230,234,123,0.4)]" />
                            </div>
                        </div>
                        </ScrollX>
                    </div>
                    </FadeIn>

                    {/* Whole heading glides sideways with the scroll */}
                    <h2 className="fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white mb-6 uppercase tracking-wide leading-[1.1]">
                            Have a <span className="text-yellow-400">Brilliant</span> Idea?
                    </h2>

                    <FadeIn y={20} delay={0.2}>
                    <p className="fading text-gray-100 text-base md:text-xl font-poppins mb-8 md:mb-12 leading-relaxed max-w-2xl mx-auto opacity-90">
                        We're constantly building and improving Spenny Piggy for our community.
                        Is there a feature you'd love to see? Let us know and help shape the future of the platform!
                    </p>
                    </FadeIn>

                    <FadeIn y={15} delay={0.3}>
                    <div className="fading">
                        <Magnetic strength={0.3}>
                        <button
                            onClick={() => setShowModal(true)}
                            className="group relative inline-flex min-h-[48px] items-center gap-3 md:gap-6 bg-white text-black font-gulfs uppercase text-base md:text-xl py-3 px-7 md:py-4 md:px-10 rounded-full transition-[filter] duration-300 active:brightness-95 overflow-hidden"
                        >
                            <span className="relative z-10">Suggest a Feature</span>
                            <FaRocket className="relative z-10 text-xl group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#E6EA7B] via-[#FF007F] to-[#05EFB8] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </button>
                        </Magnetic>
                    </div>
                    </FadeIn>
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
