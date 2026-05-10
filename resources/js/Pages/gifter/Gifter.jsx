import { usePage } from '@inertiajs/react';
import GifterItems from './GifterItems';
import GifterTips from './GifterTips';
import SocialLinks from '@/includes/SocialLinks';
import { Tab } from '@headlessui/react';
import { useState, useEffect, Fragment } from 'react';
import GifterFeed from './GifterFeed';
import MembershipLists from './MembershipLists';
import GifterMedia from './GifterMedia';
import ActivateCard from './ActivateCard';

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
            <div className="relative mb-10 rounded-[30px] overflow-hidden bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group">
                <div className="p-8 md:p-12 relative">
                    <div className="">
                        <h3 className="text-sm font-black text-black tracking-widest uppercase mb-4 flex items-center gap-4">
                            About Me
                        </h3>
                        <p className="text-black text-lg md:text-xl leading-relaxed font-bold">
                            {user && user.bio ? user.bio : "The overall effect is both humbling and inspiring in its clarity."}
                        </p>
                        
                        <div className="mt-8 pt-8 border-t-[3px] border-black/20">
                            <SocialLinks textcolor="text-black hover:text-black transition-all duration-300" links={sLinks} />
                        </div>
                    </div>

                    {IsloggedIn && user?.edit_bio_reason ? (
                        <div className="mt-10 p-6 rounded-xl bg-red-400 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <p className="text-black font-black text-xs tracking-widest uppercase mb-2">Review Required</p>
                            <p className="text-gray-900 font-bold text-sm leading-relaxed">{user?.edit_bio_reason}</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Supporter Offerings Card */}
            {IsloggedIn && (
                <div className="relative group mb-10">
                    <div className="relative p-8 md:p-12 rounded-[30px] bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div>
                                <h3 className="text-xs font-black text-black tracking-widest uppercase mb-4 flex items-center gap-4">
                                    <div className="w-8 h-[3px] bg-pink-400 border border-black"></div>
                                    Your Exclusive Benefits
                                </h3>
                                <p className="text-black text-2xl font-black tracking-wide">As a SpennyPiggy Supporter, you enjoy:</p>
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
                                <div key={i} className="p-6 rounded-[30px] bg-white/5 border-[3px] border-black/20 hover:bg-white/10 hover:border-black/40 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300">
                                    <div className="text-3xl mb-4 drop-shadow-md">{benefit.icon}</div>
                                    <h4 className="text-black font-black text-sm uppercase tracking-widest mb-2">{benefit.title}</h4>
                                    <p className="text-black font-bold text-xs leading-relaxed">{benefit.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className={`relative z-1 min-h-screen pb-20 bg-[#A2E4B8] ${IsloggedIn ? "IsloggedIn" : ""}`} >
        <div className="max-w-[1400px] mx-auto  pt-8">
          {IsloggedIn ? (
            <>
                <div className='max-w-4xl mx-auto'>
                    <ActivateCard />
                </div>
                <div className="inlinetab ">
                     <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                        <Tab.List className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-12 overflow-x-auto scrollbar-hide p-2 pt-1">
                            {['About', 'Feed', 'Memberships', 'Gifts', 'Tips', 'Media'].map((category, idx) => (
                                <Tab key={category} as={Fragment} >
                                    {({ selected }) => (
                                        <button
                                            className={`relative focus:border-0 focus:outline-none text-sm md:text-base 
                                                font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap
                                                py-2 px-6 border-[3px] border-black rounded-[30px] 
                                                ${selected ? 'text-black bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' : 'text-black bg-white hover:bg-yellow-100 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'} 
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
                                <AboutScreen />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="w-full max-w-[700px] mx-auto ">
                                <GifterFeed username={user && user.username || ''} />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto">
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
                            <div className="max-w-3xl mx-auto ">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                                    <GifterMedia username={user && user.username || ''}/>
                                </div>
                            </div>
                        </Tab.Panel>

                    </Tab.Panels>
                </Tab.Group>
            </div>
            </>
          ) : (
            <div className='max-w-4xl mx-auto pt-10'>
                <AboutScreen />
            </div>
          )}
        </div>
    </div>
  )
}
