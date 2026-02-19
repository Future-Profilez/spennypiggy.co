import { usePage } from '@inertiajs/react';
import GifterItems from './GifterItems';
import GifterTips from './GifterTips';
import ShareProfile from '@/wishlist/ShareProfile';
import SocialLinks from '@/includes/SocialLinks';
import { Tab } from '@headlessui/react';
import { useState, useEffect, Fragment } from 'react';
import GifterFeed from './GifterFeed';
import MembershipLists from './MembershipLists';
import GifterMedia from './GifterMedia';
import ActivateCard from './ActivateCard';
import ThankyouMessages from './ThankyouMessages';
import userphoto from "../../../assets/siteicon.png";

export default function Gifter({ IsloggedIn,  sLinks }){
  const pageProps = usePage().props || {};
  const { auth, user, itemid  } = pageProps;
  const categories = ['about', 'feed', 'memberships', 'gifts', 'tips', 'media', 'thanks'];
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      const index = categories.indexOf(tabParam.toLowerCase());
      if (index !== -1) {
        setSelectedIndex(index);
      }
    }
  }, []);

  const AboutScreen = () => {
    return (
        <div className="about-sec m-auto max-w-4xl">
            <div className="relative mb-10 rounded-[30px] md:rounded-[40px]  overflow-hidden bg-[#1A1B23]/40 border border-white/10 shadow-2xl group">
                <div className="p-12 relative">
                    <div className="">
                        <h3 className="text-[17px] font-black text-white/30 tracking-[0.25em] uppercase mb-4 flex items-center gap-4">
                            About Me
                        </h3>
                        <p className="text-white/80 text-lg md:text-xl leading-relaxed font-medium">
                            {user && user.bio ? user.bio : "Supporting incredible creators and being part of amazing journeys. 💖"}
                        </p>
                        
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <SocialLinks textcolor="text-white/40 hover:text-[#8C52FF] transition-all duration-300" links={sLinks} />
                        </div>
                    </div>

                    {IsloggedIn && user?.edit_bio_reason ? (
                        <div className="mt-10 p-6 rounded-[30px] md:rounded-[40px]  bg-red-500/5 border border-red-500/10">
                            <p className="text-red-400 font-black text-xs tracking-widest uppercase mb-2">Review Required</p>
                            <p className="text-red-400/70 text-sm leading-relaxed">{user?.edit_bio_reason}</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Supporter Offerings Card */}
            <div className="relative group mb-10">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8C52FF]/80 to-[#F94F97]/80 rounded-[30px] md:rounded-[40px]  blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative p-8 md:p-12 rounded-[30px] md:rounded-[40px]  bg-[#000]/50 backdrop-blur-3xl border border-white/10 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div>
                            <h3 className="text-sm font-black text-white/40 tracking-[0.25em] uppercase mb-4 flex items-center gap-4">
                                <div className="w-8 h-[1px] bg-gradient-to-r from-[#F94F97] to-transparent"></div>
                                Your Exclusive Benefits
                            </h3>
                            <p className="text-white text-2xl font-black">As a SpennyPiggy Supporter, you enjoy:</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Zero Wait Time", desc: "Priority support responses for all your inquiries.", icon: "⚡" },
                            { title: "Exclusive Badges", desc: "Unique identifiers that showcase your impact.", icon: "🎖️" },
                            { title: "Creator Access", desc: "Direct early access to content and special drops.", icon: "🔓" },
                            { title: "Impact Tracking", desc: "Detailed breakdown of how your support helps.", icon: "📊" },
                            { title: "Private Feed", desc: "A unified feed of all creators you support.", icon: "📱" },
                            { title: "Custom Flair", desc: "Unique visual styles for your profile and comments.", icon: "✨" },
                        ].map((benefit, i) => (
                            <div key={i} className="p-6 rounded-[30px] md:rounded-[40px]  bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                                <div className="text-3xl mb-4">{benefit.icon}</div>
                                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">{benefit.title}</h4>
                                <p className="text-white/50 text-xs leading-relaxed">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${IsloggedIn ? "IsloggedIn" : ""}`} >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8">
          {IsloggedIn ? (
            <div className="inlinetab ">
                <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                    <Tab.List className="flex items-center justify-center gap-4 md:gap-2 mb-12 px-4 overflow-x-auto scrollbar-hide">
                        {['About', 'Feed', 'Memberships', 'Gifts', 'Tips', 'Media'].map((category, idx) => (
                            <Tab key={category} as={Fragment} >
                                {({ selected }) => (
                                    <button
                                        className={`
                                            relative  focus:border-0 focus:outline-none text-sm font-black tracking-[0.2em] uppercase transition-all duration-300 whitespace-nowrap
                                            py-[12px] px-6 bg-gray-300 rounded-xl
                                            ${selected
                                                ? 'text-white bg-gradient-to-r from-[#05EFB8] via-[#8C52FF] to-[#F94F97]   shadow-[0_-2px_10px_rgba(140,82,255,0.5)]'
                                                : 'text-black hover:text-black/70  '}
                                        `}
                                    >
                                        {category}
                                    </button>
                                )}
                            </Tab>
                        ))}
                    </Tab.List>
                    <Tab.Panels>
                        <Tab.Panel className="focus:outline-none">
                            <div className='max-w-4xl mx-auto'>
                                {auth?.user?.profile_status_lock == 1 && <ActivateCard auth={auth}/>}
                                <AboutScreen />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="w-full max-w-[700px] mx-auto ">
                                <GifterFeed username={user && user.username || ''} />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[30px] md:rounded-[40px]  p-8 border border-white/10 shadow-2xl">
                                <MembershipLists username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-3xl mx-auto ">
                                <GifterItems username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-3xl mx-auto">
                                <GifterTips username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-3xl mx-auto">
                                <GifterMedia username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
          ) : (
            <div className='max-w-4xl mx-auto pt-10'>
                <AboutScreen />
            </div>
          )}
        </div>
    </div>
  )
}
