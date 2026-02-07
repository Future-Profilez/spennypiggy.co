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


export default function Gifter({ IsloggedIn,  sLinks }){
  const pageProps = usePage().props || {};
  const { auth, user, itemid  } = pageProps;
  const categories = ['about', 'feed', 'memberships', 'gifts', 'tips'];
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
            <div className="relative group">
                {/* Subtle glow effect behind the card */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#05EFB8] via-[#8C52FF] to-[#F94F97] rounded-[42px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                
                <div className={`${user && !user.bio ? "hidden":""} relative p-8 md:p-12 rounded-[40px] bg-[#1A1B23]/90 backdrop-blur-3xl border border-white/10 shadow-2xl mb-10 transition-all hover:border-white/20`}>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                        <div>
                            <h3 className="text-sm font-black text-white/40 tracking-[0.25em] uppercase mb-4 flex items-center gap-4">
                                <div className="w-8 h-[1px] bg-gradient-to-r from-[#05EFB8] to-transparent"></div>
                                Gifter Profile
                            </h3>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                <div className="w-2 h-2 rounded-full bg-[#05EFB8] animate-pulse"></div>
                                <span className="text-[10px] font-black text-white/70 tracking-widest uppercase">Active Supporter</span>
                            </div>
                        </div>
                        
                        {IsloggedIn && (
                            <div className="flex items-center gap-3">
                                <ShareProfile username={user && user.name} classes={"px-6 py-3 bg-white text-black font-black text-[10px] tracking-[0.2em] uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"}>
                                    Share Profile
                                </ShareProfile>
                            </div>
                        )}
                    </div>

                    <div className="mb-12">
                        <p className="text-white text-2xl md:text-4xl font-bold leading-[1.15] tracking-tight whitespace-pre-wrap">
                            {(user && user.bio) || "I believe in good vibes and great creators. Supporting one smile at a time 😊"}
                        </p>
                    </div>

                    {/* Supporter Stats Placeholder */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                        <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10">
                            <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-1">Impact</p>
                            <p className="text-white text-2xl font-black">Top 1%</p>
                        </div>
                        <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10">
                            <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-1">Badges</p>
                            <p className="text-white text-2xl font-black">5+</p>
                        </div>
                        <div className="hidden md:block p-6 rounded-[32px] bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10">
                            <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-1">Community</p>
                            <p className="text-white text-2xl font-black">Elite</p>
                        </div>
                    </div>
                    
                    {IsloggedIn && user?.edit_bio_reason ? (
                        <div className="mb-12 p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
                            <p className="text-red-400 font-black text-xs tracking-widest uppercase mb-2">Review Required</p>
                            <p className="text-red-400/70 text-sm leading-relaxed">{user?.edit_bio_reason}</p>
                        </div>
                    ) : null}

                    <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex-1">
                            <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-4">Connected Socials</p>
                            <SocialLinks textcolor="text-white/40 hover:text-white transition-all duration-300" links={sLinks} />
                        </div>
                        
                        {IsloggedIn && (
                            <div className="flex items-center gap-4">
                                <Social links={sLinks}/>
                            </div>
                        )}
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
                        {['About', 'Feed', 'Memberships', 'Gifts', 'Tips'].map((category, idx) => (
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
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl">
                                <GifterFeed username={user && user.username || ''} />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl">
                                <MembershipLists username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl">
                                <GifterItems username={user && user.username || ''}/>
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-[#1A1B23]/80 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl">
                                <GifterTips username={user && user.username || ''}/>
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
