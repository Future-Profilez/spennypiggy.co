import { Link } from "@inertiajs/react";
import { FaCrown, FaTrophy, FaGift, FaArrowRight } from 'react-icons/fa';
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function FounderProgramAnnouncement({ founderBonus }) {
    // Default values in case founderBonus is not provided
    const defaultConfig = {
        minMonthlyEarnings: 2500,
        bonusPercentage: 10,
        maxBonusPerMonth: 1000,
        maxFounderSeats: 150,
        currencySymbol: '£'
    };

    const config = founderBonus || defaultConfig;

    return (
        <>
            <style jsx>{`
                .founder-gradient {
                    background: linear-gradient(135deg, #8C52FF 0%, #F94F96 50%,rgba(255, 242, 0, 0.9) 100%);
                    // background: linear-gradient(135deg,rgb(246, 234, 10) 0%, #F94F96 50%, #8C52FF 100%);
                }
                .founder-card {
                    backdrop-filter: blur(10px);
                    background: rgba(255, 255, 255, 0.95);
                    border: 2px solid rgba(140, 82, 255, 0.3);
                }
                .founder-icon {
                    animation: bounce 2s infinite;
                }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }
                .founder-button {
                    background: linear-gradient(45deg, #8C52FF, #F94F96);
                    transition: all 0.3s ease;
                }
                .founder-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(140, 82, 255, 0.3);
                }
            `}</style>

            <div className="founder-gradient mt-16 py-6 pt-12 md:pt-24 md:py-24 pinkbg px-4 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-10 left-10 opacity-20">
                    <FaCrown className="text-white text-6xl founder-icon" />
                </div>
                <div className="absolute bottom-10 right-10 opacity-20">
                    <FaTrophy className="text-white text-5xl founder-icon" style={{animationDelay: '0.5s'}} />
                </div>
                <div className="absolute top-1/2 left-1/4 opacity-10">
                    <FaGift className="text-white text-4xl founder-icon" style={{animationDelay: '1s'}} />
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        
                        {/* Left side - Content */}
                        <div className="flex-1 text-center lg:text-left" data-aos="fade-right">
                            <div className="mb-6">
                                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                                    <FaCrown className="text-yellow-300 mr-2" />
                                    <span className="text-white font-medium text-sm uppercase tracking-wider">
                                        New Program Launch
                                    </span>
                                </div>
                                
                                <h2 className="text-4xl lg:text-5xl xl:text-6xl font-gulfs text-white mb-4 leading-tight uppercase">
                                    Join the <span className="text-yellow-300">Founder</span> Program!
                                </h2>
                                
                                <p className="text-xl text-white/90 mb-6 max-w-2xl">
                                    Earn {config.currencySymbol}{config.minMonthlyEarnings} in your first 30 days from joining and automatically qualify for a {config.bonusPercentage}% bonus up to {config.currencySymbol}{config.maxBonusPerMonth}! 
                                    Join our exclusive founder program with special recognition and benefits. Only {config.maxFounderSeats} creators can join! Existing founders are excluded from future selections.
                                </p>
                            </div>

                            {/* Features list */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="flex justify-center md:justify-start items-center text-white">
                                    <div className="w-8 h-8 min-w-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                                        <FaTrophy className="text-purple-800 text-sm" />
                                    </div>
                                    <span className="text-start">{config.bonusPercentage}% bonus on monthly earnings</span>
                                </div>
                                <div className="flex justify-center md:justify-start items-center text-white">
                                    <div className="w-8 h-8 min-w-8 bg-pink-400 rounded-full flex items-center justify-center mr-3">
                                        <FaCrown className="text-white text-sm" />
                                    </div>
                                    <span className="text-start">Founder badge & recognition</span>
                                </div>
                                <div className="flex justify-center md:justify-start items-center text-white">
                                    <div className="w-8 h-8 min-w-8 bg-green-400 rounded-full flex items-center justify-center mr-3">
                                        <FaGift className="text-green-800 text-sm" />
                                    </div>
                                    <span className="text-start">Automatic qualification at {config.currencySymbol}{config.minMonthlyEarnings} in first 30 days</span>
                                </div>
                                <div className="flex justify-center md:justify-start items-center text-white">
                                    <div className="w-8 h-8 min-w-8 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                                        <FaArrowRight className="text-blue-800 text-sm" />
                                    </div>
                                    <span className="text-start">Priority support & feedback</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center lg:jsustify-start">
                                <Link 
                                    href="/founder/bonus"
                                    className="button b !px-4 !py-3 flex items-center justify-center"
                                >
                                    <FaCrown className="mr-2" />
                                    Join Founder Program
                                </Link>
                                
                                {/* <Link 
                                    href="/founder/bonus"
                                    className="button b !px-4 !py-3 flex items-center justify-center"
                                    >
                                    Learn More
                                    <FaArrowRight className="ml-2" />
                                </Link> */}
                            </div>
                        </div>

                        {/* Right side - Visual element */}
                        <div className="flex-1 max-w-md" data-aos="fade-left">
                            <div className="founder-card rounded-3xl p-4 md:p-8 text-center shadow-2xl">
                                <div className="mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 founder-icon">
                                        <FaCrown className="text-white text-3xl" />
                                    </div>
                                    {/* <h3 className="text-2xl font-bold text-gray-800 mb-2">Founding Member</h3> */}
                                    <p className="text-gray-600">Exclusive Status</p>
                                </div>
                                
                                <div className="space-y-3 text-left">
                                    <div className="text-center">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                                            Join Our Exclusive Founder Program
                                        </h2>
                                        {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                            Earn {config.currencySymbol}{config.minMonthlyEarnings} monthly and automatically qualify for a {config.bonusPercentage}% bonus up to {config.currencySymbol}{config.maxBonusPerMonth}! Join our exclusive founder program with special recognition and benefits. Only {config.maxFounderSeats} creators can join! Qualification based on last 30 days earnings.
                                        </p> */}
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Monthly Bonus</span>
                                        <span className="font-bold text-green-600">Up to {config.currencySymbol}{config.maxBonusPerMonth}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Badge Status</span>
                                        <span className="font-bold text-yellow-500 flex items-center"><FaCrown className="text-yellow-500 text-xl me-2" /> Founder</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Early Access</span>
                                        <span className="font-bold text-blue-600">✓ Included</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600">Support Priority</span>
                                        <span className="font-bold text-orange-600">High</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                                    <p className="text-sm text-gray-700 font-medium">
                                        🎯 Earn {config.currencySymbol}{config.minMonthlyEarnings} in your first 30 days from joining to automatically qualify for {config.bonusPercentage}% bonus up to {config.currencySymbol}{config.maxBonusPerMonth}! All creators who achieved this milestone are eligible, but existing founders are excluded from future selections.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}