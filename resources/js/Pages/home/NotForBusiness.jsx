import howitworks1 from "../../../assets/new/howitworks1.png";
import howitworks2 from "../../../assets/new/howitworks2.png";
import howitworks3 from "../../../assets/new/howitworks3.png";
import { LazyLoadImage } from "react-lazy-load-image-component";
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';

export default function NotForBusiness() {
    const data = [
        {
            title: "Create Your Wishlist",
            description:
                "Hop on Spenny Piggy, add your faves to your Wishlist, or create your own storefront to sell exclusive content, services, or products—and start sharing your page in no time!",
            image: howitworks1,
        },
        {
            title: "Get the items you actually want",
            description:
                "Add anything you want from any store to your list. Your supporters unlock and buy the items, delivered straight to your door.",
            image: howitworks2,
        },
        {
            title: "Unlock what you’ve been dreaming of...",
            description:
                "Show off what you unlocked with a shout-out on socials, or send a personal thank-you right on Spenny Piggy!",
            image: howitworks3,
        },
    ];

    const accents = ["#FF007F", "#E6EA7B", "#05EFB8"];

    return (
        <section className="relative py-20 md:py-28 px-4 bg-transparent overflow-x-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-72 h-72 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float"></div>
                <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-[#E6EA7B] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float-delayed" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="max-w-6xl mx-auto relative">
                <FadeIn y={30} duration={0.6}>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-16 uppercase tracking-tight leading-tight">
                    How It <span>Works</span>
                </h2>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                    <div className="hidden md:block absolute top-[100px] left-[16%] right-[16%] h-1 bg-gradient-to-r from-[#FF007F] via-[#E6EA7B] to-[#05EFB8] z-0"></div>
                    {data.map((item, index) => {
                        const accent = accents[index % accents.length];
                        return (
                        <StaggerItem key={index} index={index} x={index % 2 === 0 ? -60 : 60} y={20} rotate={index % 2 === 0 ? -2 : 2} stagger={0.2} duration={0.7} className="mb-6 flex flex-col items-center text-center relative group">
                            {/* Step Number Badge */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-1 transition-transform duration-300 group-hover:-translate-y-2">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-black text-black font-gulfs text-xl" style={{ backgroundColor: accent }}>
                                    {index + 1}
                                </div>
                            </div>

                            <div className="w-full mb-8 relative max-w-[300px]">
                                <div
                                    className="bg-[#0d0a16] rounded-[24px] border-2 p-6 md:p-8 transition-all duration-300 relative overflow-hidden"
                                    style={{ borderColor: accent, boxShadow: `8px 8px 0 0 ${accent}` }}
                                >
                                     <LazyLoadImage
                                        alt={item.title}
                                        effect="blur"
                                        src={item.image}
                                        className="w-full h-48 lg:h-56 object-contain transform group-hover:scale-110 transition-transform duration-500 transition-all duration-600 "
                                    />
                                </div>
                            </div>

                            <h3 className="text-xl lg:text-2xl font-gulfs text-white mb-1 md:mb-4 uppercase tracking-tight leading-tight px-4 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-white/70 font-poppins text-sm lg:text-base leading-relaxed max-w-xs mx-auto whitespace-pre-line transition-colors">
                                {item.description}
                            </p>
                        </StaggerItem>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
