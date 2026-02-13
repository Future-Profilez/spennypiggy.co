import { usePage } from '@inertiajs/react';
import GifterItems from './GifterItems';
import GifterTips from './GifterTips';
import GifterSubscriptions from './GifterSubscriptions';
import GifterBills from './GifterBills';
import Social from '../Auth/Social';
import ShareProfile from '@/wishlist/ShareProfile';
import SocialLinks from '@/includes/SocialLinks';
import { Tab } from '@headlessui/react';
import { useState, useEffect, Fragment } from 'react';
import GifterFeed from './GifterFeed';
import MembershipLists from './MembershipLists';
import GifterMedia from './GifterMedia';
import ActivateCard from './ActivateCard';
import ThankyouMessages from './ThankyouMessages';


export default function Gifter({ IsloggedIn,  sLinks }){
  const pageProps = usePage().props || {};
  const { auth, user, itemid  } = pageProps;
  const categories = ['about', 'feed', 'memberships', 'gifts', 'tips', 'media', 'thanks'];
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Check for tab parameter in URL
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
            {/* Gifter Header Card */}
            <div className="relative mb-10 rounded-[30px] md:rounded-[40px]  overflow-hidden bg-[#1A1B23]/90 backdrop-blur-3xl border border-white/10 shadow-2xl group">
                {/* Cover Image Area */}
                <div className="h-48 md:h-64 relative overflow-hidden">
                    {user?.cover ? (
                        <img src={user.cover} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700" alt="Cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#8C52FF]/20 via-[#F94F97]/10 to-[#05EFB8]/20 animate-gradient-xy"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1B23] to-transparent"></div>
                </div>

                {/* Profile Info Overlay */}
                <div className="px-8 md:px-12 pb-12 -mt-16 relative">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                            {/* Avatar */}
                            <div className="relative group/avatar">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#05EFB8] via-[#8C52FF] to-[#F94F97] rounded-full blur opacity-40 group-hover/avatar:opacity-100 transition duration-500"></div>
                                <div className="relative w-32 h-32 rounded-full border-4 border-[#1A1B23] overflow-hidden bg-[#1A1B23]">
                                    <img src={user?.avatar || "/default-avatar.png"} className="w-full h-full object-cover" alt={user?.name} />
                                </div>
                            </div>
                            
                            <div className="text-center md:text-left mb-2">
                                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">{user?.name}</h1>
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <span className="text-white/40 font-black text-sm tracking-widest uppercase">@{user?.username}</span>
                                    <div className="h-4 w-[1px] bg-white/10"></div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05EFB8]/10 border border-[#05EFB8]/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#05EFB8] animate-pulse"></div>
                                        <span className="text-[10px] font-black text-[#05EFB8] tracking-widest uppercase">Elite Supporter</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {IsloggedIn && (
                            <div className="flex items-center gap-3 mb-4">
                                <ShareProfile username={user && user.name} classes={"px-8 py-4 bg-white text-black font-black text-[10px] tracking-[0.2em] uppercase rounded-[30px] md:rounded-[40px]  hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"}>
                                    Share Profile
                                </ShareProfile>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Bio Section */}
                        <div className="md:col-span-2">
                            <h3 className="text-[10px] font-black text-white/30 tracking-[0.25em] uppercase mb-4 flex items-center gap-4">
                                <div className="w-8 h-[1px] bg-gradient-to-r from-[#8C52FF] to-transparent"></div>
                                About Me
                            </h3>
                            <p className="text-white/80 text-lg md:text-xl leading-relaxed font-medium">
                                {(user && user.bio) || "Supporting incredible creators and being part of amazing journeys. 💖"}
                            </p>
                            
                            {/* Connected Socials */}
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <SocialLinks textcolor="text-white/40 hover:text-[#8C52FF] transition-all duration-300" links={sLinks} />
                            </div>
                        </div>

                        {/* Impact Stats Card */}
                        <div className="bg-white/5 rounded-[30px] md:rounded-[40px]  p-8 border border-white/5 backdrop-blur-xl">
                            <h3 className="text-[10px] font-black text-white/30 tracking-[0.25em] uppercase mb-6">Impact & Achievements</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-1">Impact Tier</p>
                                        <p className="text-white text-xl font-black">Diamond</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-[30px] md:rounded-[40px]  bg-gradient-to-br from-[#05EFB8] to-[#8C52FF] p-[1px]">
                                        <div className="w-full h-full rounded-[30px] md:rounded-[40px]  bg-[#1A1B23] flex items-center justify-center text-xl">💎</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-1">Badges Earned</p>
                                        <p className="text-white text-xl font-black">12</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-[30px] md:rounded-[40px]  bg-white/5 flex items-center justify-center text-xl">🏆</div>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                    <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-3 text-center">Next Milestone</p>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full w-[75%] bg-gradient-to-r from-[#8C52FF] to-[#F94F97] rounded-full shadow-[0_0_10px_#8C52FF]"></div>
                                    </div>
                                    <p className="text-white/30 text-[9px] font-bold mt-2 text-center uppercase tracking-widest">75% to Legend Status</p>
                                </div>
                            </div>
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
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8C52FF] to-[#F94F97] rounded-[30px] md:rounded-[40px]  blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative p-8 md:p-12 rounded-[30px] md:rounded-[40px]  bg-[#1A1B23]/90 backdrop-blur-3xl border border-white/10 shadow-2xl">
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
    <div className={`min-h-screen bg-[#0B0C10] pb-20 ${IsloggedIn ? "IsloggedIn" : ""}`} >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8">
          {IsloggedIn ? (
            <div className="inlinetab">
                <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                    <Tab.List className="flex items-center gap-8 mb-12 border-b border-white/5 px-4 overflow-x-auto scrollbar-hide">
                        {['About', 'Feed', 'Memberships', 'Gifts', 'Tips', 'Media', 'Wall of Fame'].map((category, idx) => (
                            <Tab
                                key={category}
                                as={Fragment}
                            >
                                {({ selected }) => (
                                    <button
                                        className={`
                                            relative py-4 text-sm font-black tracking-[0.2em] uppercase transition-all duration-300 whitespace-nowrap
                                            ${selected
                                                ? 'text-white'
                                                : 'text-white/40 hover:text-white/70'}
                                        `}
                                    >
                                        {category}
                                        {selected && (
                                            <div className="absolute -bottom-[1px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#05EFB8] via-[#8C52FF] to-[#F94F97] rounded-t-full shadow-[0_-2px_10px_rgba(140,82,255,0.5)]"></div>
                                        )}
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
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[30px] md:rounded-[40px]  p-8 border border-white/10 shadow-2xl">
                                <GifterFeed username={user && user.username || ''} />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[30px] md:rounded-[40px]  p-8 border border-white/10 shadow-2xl">
                                <MembershipLists username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[30px] md:rounded-[40px]  p-8 border border-white/10 shadow-2xl">
                                <GifterItems username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[30px] md:rounded-[40px]  p-8 border border-white/10 shadow-2xl">
                                <GifterTips username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[30px] md:rounded-[40px]  p-8 border border-white/10 shadow-2xl">
                                <GifterMedia username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[30px] md:rounded-[40px]  p-8 border border-white/10 shadow-2xl">
                                <ThankyouMessages username={user && user.username || ''}/>
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
