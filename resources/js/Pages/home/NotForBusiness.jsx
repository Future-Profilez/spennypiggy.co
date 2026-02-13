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
        <section className="bg-black py-16 md:py-24 relative ">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float"></div>
                <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float-delayed" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="containerbox relative  ">
                <h2 className="fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-16 uppercase leading-tight">
                    How It <span className="text-gradient-wishlist">Works</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                    <div className="hidden md:block absolute top-[100px] left-[16%] right-[16%] h-1 bg-gradient-to-r from-pink-500 via-yellow-500  to-pink-500  z-0"></div>
                    {data.map((item, index) => (
                        <div key={index} className="mb-6 flex flex-col items-center text-center relative group">
                            {/* Step Number Badge */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-1 transition-transform duration-300 group-hover:-translate-y-2">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)] border-2 border-black text-white font-gulfs text-xl">
                                    {index + 1}
                                </div>
                            </div>

                            <div className="w-full mb-8 relative max-w-[300px]">
                                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-yellow-500 rounded-[40px]  transform rotate-3 scale-105 opacity-0 group-hover:opacity-30 transition-all duration-500 blur-xl"></div>
                                <div className="bg-black rounded-[40px]  transition-all duration-300  border border-gray-800 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]   relative overflow-hidden transition-all duration-300">
                                     <LazyLoadImage
                                        alt={item.title}
                                        effect="blur"
                                        src={item.image}
                                        className="w-full h-48 lg:h-56 object-contain transform group-hover:scale-110 transition-transform duration-500 transition-all duration-600 "
                                    />
                                </div>
                            </div>

                            <h3 className="fading text-xl lg:text-2xl font-gulfs text-white mb-1 md:mb-4 uppercase leading-tight px-4 group-hover:text-pink-500 transition-colors">
                                {item.title}
                            </h3>
                            <p className="fading text-gray-400 font-poppins text-sm lg:text-base leading-relaxed max-w-xs mx-auto whitespace-pre-line group-hover:text-gray-300 transition-colors">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
