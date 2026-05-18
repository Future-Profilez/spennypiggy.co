import { Tab } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import JoinUs from '@/Components/JoinUs';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
    SearchIcon, 
    HeartIcon, 
    UserPlusIcon, 
    ShieldCheckIcon, 
    ShareIcon,
    RocketIcon, 
    BoltIcon,
    SparklesIcon,
} from "@animateicons/react/lucide";
import { 
    Wand2, 
    Crown 
} from "lucide-react";
import vishitimg from "../../../assets/img/vishitimg01.png";
import giftbasketimg from "../../../assets/img/giftbasketimg01.png";
import fundbasketimg from "../../../assets/img/fundbasketimg01.png";
import yourwishlist from "../../../assets/img/yourwishlist01.png";
import setuppaymentimg from "../../../assets/img/setuppaymentimg01.png";
import sharlinkimg from "../../../assets/img/sharlinkimg.png";
import { useRef } from 'react';

const StepCard = ({ step, title, description, img, icon: Icon, color, shadowColor, index }) => {
    const iconRef = useRef(null);
    return (
        <div 
            className={`group bg-gray-900 border-2 border-${color} rounded-[30px] p-6 md:p-8 relative hover:-translate-y-3 transition-all duration-300 shadow-[8px_8px_0px_0px_${shadowColor}] h-full flex flex-col`}
            data-aos="fade-up"
            data-aos-delay={index * 100}
            onMouseEnter={() => iconRef.current?.startAnimation()}
        >
            {/* Floating Icon */}
            <div className={`absolute -top-6 -right-6 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300 bg-${color} text-black`}>
                <Icon ref={iconRef} />
            </div>

            {/* Step Label */}
            <div className={`inline-block w-fit px-3 py-1 rounded-full bg-${color}/10 text-${color} font-black text-xs uppercase tracking-widest mb-4 border border-${color}/20`}>
                {step}
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl md:text-3xl font-gulfs text-white mb-4 uppercase leading-none tracking-tight">
                {title}
            </h3>
            <p className="text-gray-400 text-lg mb-8 leading-snug flex-grow" dangerouslySetInnerHTML={{ __html: description }} />

            {/* Image Container */}
            <div className="relative mt-auto rounded-[20px] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm shadow-inner group-hover:shadow-[4px_4px_0px_0px_#FF007F]xl transition-shadow duration-300">
                <LazyLoadImage 
                    src={img} 
                    alt={title} 
                    effect="blur"
                    className="w-full h-48 object-cover transform transition-transform duration-700 group-hover:scale-110" 
                />
            </div>
        </div>
    );
};

export default function Works(props) {
    const { auth } = props;

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            easing: 'ease-out-back'
        });
    }, []);

    const supporterSteps = [
        {
            step: "Step 1",
            title: "Seek & Search",
            description: "Find your favorite creators. Browse their profile, shop items, and check out their latest wishes.",
            img: vishitimg,
            icon: SearchIcon,
            color: "pink-500",
            shadowColor: "#FF007F"
        },
        {
            step: "Step 2",
            title: "Support Them",
            description: "Join a membership, purchase a wish, or simply send some love to fill their Piggy Bank.",
            img: giftbasketimg,
            icon: HeartIcon,
            color: "yellow-400",
            shadowColor: "#FACC15"
        },
        {
            step: "Step 3",
            title: "Create Account",
            description: "Sign up to track your exclusive content and custom orders. Quick and easy checkout!",
            img: fundbasketimg,
            icon: UserPlusIcon,
            color: "purple-500",
            shadowColor: "#A855F7"
        }
    ];

    const creatorSteps = [
        {
            step: "Step 1",
            title: "Set Up Page",
            description: "Craft your unique space. Publish a reward-based Wishlist or offer tailored memberships.",
            img: yourwishlist,
            icon: SparklesIcon,
            color: "pink-500",
            shadowColor: "#FF007F"
        },
        {
            step: "Step 2",
            title: "Secure Payouts",
            description: "Connect our secure third-party payment processor and start funding your fabulous lifestyle!",
            img: setuppaymentimg,
            icon: ShieldCheckIcon,
            color: "yellow-400",
            shadowColor: "#FACC15"
        },
        {
            step: "Step 3",
            title: "Share & Grow",
            description: "Update your fans, share on socials, and watch the support roll in with auto-tweets.",
            img: sharlinkimg,
            icon: ShareIcon,
            color: "purple-500",
            shadowColor: "#A855F7"
        }
    ];

    return (
        <Authenticated auth={auth?.user || ''}>
            <Head title="How It Works — Spenny Piggy" />
            
            <div className="min-h-screen bg-black text-white relative overflow-hidden pb-24">
                {/* Decorative Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 floating-shape"></div>
                    <div className="absolute top-40 right-10 w-64 h-64 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 floating-shape" style={{animationDelay: '1s'}}></div>
                    <div className="absolute bottom-40 left-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 floating-shape" style={{animationDelay: '2s'}}></div>
                </div>

                {/* Hero Section */}
                <div className="relative z-10 pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
                    <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300 mb-6">
                        <span className="bg-yellow-400 text-black font-black px-6 py-2 uppercase tracking-widest text-sm rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                            ✨ Join the Spenny Piggy Party ✨
                        </span>
                    </div>

                    <h1 className="uppercase text-4xl md:text-6xl lg:text-7xl font-gulfs tracking-[2px] text-white mb-6 leading-none drop-shadow-[4px_4px_0px_0px_#FF007F]xl" data-aos="fade-down">
                        How it <span className="text-gradient-wishlist">works</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium leading-relaxed" data-aos="fade-up" data-aos-delay="200">
                        Setting up your page only takes a few minutes. 🚀🐷 <br/>
                        Choose your path below to get started.
                    </p>
                </div>

                {/* Tab Section */}
                <div className="relative z-10 px-4 max-w-7xl mx-auto">
                    <Tab.Group>
                        <Tab.List className="flex p-2 space-x-4 bg-gray-500/10 backdrop-blur-xl rounded-[25px] max-w-md mx-auto mb-20 border-2 border-white/10 shadow-[4px_4px_0px_0px_#FF007F]xl" data-aos="zoom-in" data-aos-delay="400">
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`
                                            w-full py-3 text-lg font-gulfs leading-5 rounded-[18px] uppercase tracking-wider transition-all duration-300
                                            focus:outline-none ring-0 border-0
                                            ${selected 
                                                ? 'bg-[#FF007F] text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] scale-105' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        Supporters
                                    </button>
                                )}
                            </Tab>
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`
                                            w-full py-3 text-lg font-gulfs leading-5 rounded-[18px] uppercase tracking-wider transition-all duration-300
                                            focus:outline-none ring-0 border-0
                                            ${selected 
                                                ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] scale-105' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        Creators
                                    </button>
                                )}
                            </Tab>
                        </Tab.List>

                        <Tab.Panels>
                            <Tab.Panel className="outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 px-4">
                                    {supporterSteps.map((step, idx) => (
                                        <StepCard key={idx} index={idx} {...step} />
                                    ))}
                                </div>
                            </Tab.Panel>
                            <Tab.Panel className="outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 px-4">
                                    {creatorSteps.map((step, idx) => (
                                        <StepCard key={idx} index={idx} {...step} />
                                    ))}
                                </div>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>

                {/* Bottom Call to Action */}
                <div className="relative z-10 mt-32 text-center" data-aos="fade-up">
                    <p className="text-gray-400 mb-8 uppercase tracking-widest font-black text-sm">
                        Ready to start your journey?
                    </p>
                    <JoinUs />
                </div>
            </div>
        </Authenticated>
    );
}
