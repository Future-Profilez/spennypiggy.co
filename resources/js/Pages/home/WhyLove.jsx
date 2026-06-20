import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import TiltCard from '@/Components/animations/TiltCard';
import WatermarkStrip from '@/Components/animations/WatermarkStrip';
import amazon from "../../../assets/new/amazon.png";
import nike from "../../../assets/new/nike.png";
import uniqlo from "../../../assets/new/uniqlo.png";
import beauty from "../../../assets/new/beauty.png";
import apple from "../../../assets/new/apple.png";
import kylie from "../../../assets/new/kylie.png";
import asos from "../../../assets/new/asos.png";
import nova from "../../../assets/new/nova.png";
import other from "../../../assets/new/other.png";
import alo from "../../../assets/new/alo.png";
import huel from "../../../assets/new/huel.png";

export default function WhyLove() {
    const brandLogos = [
      { name: "Amazon", src: amazon },
      { name: "Nike", src: nike },
      { name: "Uniqlo", src: uniqlo },
      { name: "Fenty", src: beauty },
      { name: "Apple", src: apple },
      { name: "Kylie", src: kylie },
      { name: "Asos", src: asos },
      { name: "Fashion Nova", src: nova },
      { name: "Sephora", src: other },
      { name: "Alo", src: alo },
      { name: "Huel", src: huel },
    ];

    return (
        <>
            <section className="bg-transparent py-20 md:py-28 relative overflow-hidden">
                <WatermarkStrip text="Stores" from={150} to={-350} opacity={0.18} className="top-4" />
                 {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pink-600/40 rounded-full mix-blend-screen filter blur-[100px] animate-float"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/40 rounded-full mix-blend-screen filter blur-[120px] animate-float-delayed"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/30 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"></div>
                </div>

                <div className="container relative px-4 mx-auto">
                    <FadeIn y={30} duration={0.6}>
                    <h2 className="fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-none drop-shadow-lg">
                        Add From Your <span className="text-gradient-wishlist drop-shadow-none">Favourite Stores</span>
                    </h2>
                    </FadeIn>
                    <FadeIn y={20} delay={0.15}>
                    <p className="fading text-gray-300 text-base md:text-xl max-w-3xl mx-auto font-poppins leading-relaxed mb-8 md:mb-12 text-center">
                        Drop a link to anything you want onto one page. Add items from our
                        Oink Store partner stores, or any other online store. Your supporters
                        unlock and buy what's on your list, delivered straight to your door.
                    </p>
                    </FadeIn>

                    <div className="flex flex-wrap justify-center gap-3 md:gap-8 max-w-[1000px] m-auto">
                      {brandLogos.map((brand, index) => (
                         <StaggerItem key={index} index={index} stagger={0.05} y={20}>
                         <TiltCard max={18} scale={1.1} className="fading group relative w-24 h-24 sm:w-28 sm:h-28 rounded-[30px] bg-white backdrop-blur-sm p-6 flex items-center justify-center transition-colors duration-300 border border-gray-800 hover:border-[#FF007F] shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                           <img
                             src={brand.src}
                             alt={brand.name}
                             className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                           />
                         </TiltCard>
                       </StaggerItem>
                      ))}
                    </div>
                </div>
            </section>
        </>
    );
}
