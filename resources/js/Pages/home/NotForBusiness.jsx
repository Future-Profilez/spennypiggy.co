import howitworks1 from "../../../assets/new/howitworks1.png";
import howitworks2 from "../../../assets/new/howitworks2.png";
import howitworks3 from "../../../assets/new/howitworks3.png";
import { LazyLoadImage } from "react-lazy-load-image-component";

export default function NotForBusiness() {
    const data = [
        {
            title: "Create Your Wishlist",
            description:
                "Hop on Spenny Piggy, add your faves to your Wishlist, or create your own storefront to sell exclusive content, services, or products—and start sharing your page in no time!",
            image: howitworks1,
        },
        {
            title: "Receive endless gifts and support!",
            description:
                "Let your fans spoil you on Spenny Piggy with gifts from any online store!\n Receive gifts from 1000’s of brands shipped directly to your door.",
            image: howitworks2,
        },
        {
            title: "Get the gifts you’ve been dreaming of...",
            description:
                "Show off your gift with a shout-out on socials or send a personal thank-you directly on Spenny Piggy!",
            image: howitworks3,
        },
    ];

    return (
        <section className="bg-black py-16 md:py-24 relative overflow-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="containerbox relative z-10">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-16 uppercase leading-tight">
                    How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">Works</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[100px] left-[16%] right-[16%] h-1 bg-gradient-to-r from-pink-500/20 via-yellow-500/20 to-pink-500/20 z-0"></div>

                    {data.map((item, index) => (
                        <div key={index} className="flex flex-col items-center text-center relative z-10 group">
                            {/* Step Number Badge */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-yellow-500 flex items-center justify-center shadow-lg border-4 border-black text-white font-gulfs text-xl">
                                    {index + 1}
                                </div>
                            </div>

                            {/* Image Container */}
                            <div className="w-full mb-8 relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-yellow-500 rounded-[30px] transform rotate-3 scale-105 opacity-0 group-hover:opacity-30 transition-all duration-500 blur-xl"></div>
                                <div className="bg-gray-900 rounded-[30px] p-6 border border-gray-800 shadow-2xl relative overflow-hidden group-hover:border-pink-500/50 transition-colors duration-300">
                                     <LazyLoadImage
                                        alt={item.title}
                                        effect="blur"
                                        src={item.image}
                                        className="w-full h-48 lg:h-56 object-contain transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            </div>

                            <h3 className="text-2xl lg:text-3xl font-gulfs text-white mb-4 uppercase leading-tight px-4">
                                {item.title}
                            </h3>
                            <p className="text-gray-400 font-poppins text-sm lg:text-base leading-relaxed max-w-xs mx-auto whitespace-pre-line">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
