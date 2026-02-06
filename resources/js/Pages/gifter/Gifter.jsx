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
  const categories = ['home', 'feed', 'memberships'];
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      const index = categories.indexOf(tabParam);
      if (index !== -1) {
        setSelectedIndex(index);
      }
    }
  }, []);

  const AboutScreen = () => {
    return <>
<<<<<<< HEAD
        <div className="about-sec m-auto max-w-4xl" >
              <div className={`${user && !user.bio ? "hidden":""} p-10 rounded-[40px] bg-white/5 backdrop-blur-2xl border border-white/5 shadow-2xl mb-10 transition-all hover:border-white/10`} >
                  <h3 className="text-sm font-black text-white/40 tracking-[0.25em] uppercase mb-8 flex items-center gap-4">
                      <div className="w-8 h-[1px] bg-gradient-to-r from-[#05EFB8] to-transparent"></div>
                      About me
                  </h3>
                  <p className="text-white text-xl md:text-2xl font-medium leading-relaxed whitespace-pre-wrap tracking-tight">
                      {(user && user.bio) || "I believe in good vibes and great creators. Supporting one smile at a time 😊"}
                  </p>
=======
        <div className=" about-sec  m-auto " >
              <div className={`${user && !user.bio ? "hidden":""}  p-3 rounded-xl  dark2     mb-4`} >
                  <p className=" text-white text-lg" >About me</p>
                  <p className={`  text-left mt-2 font-light text-gray-200`}>{(user && user.bio) || "I believe in good vibes and great creators. Supporting one smile at a time 😊"}</p>
>>>>>>> 4286dab852d4241f6daa5a78c59cae76d8347e63
                  
                  {IsloggedIn && user?.edit_bio_reason  ?
                    <div className="mt-8 p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
                        <p className="text-red-400 font-black text-xs tracking-widest uppercase mb-2">Review Required</p>
                        <p className="text-red-400/70 text-sm leading-relaxed">{user?.edit_bio_reason}</p>
                    </div>
                  : ''}

                  <div className="mt-12 pt-10 border-t border-white/5">
                      <SocialLinks textcolor="text-white/40 hover:text-white transition-all duration-300" links={sLinks} />
                  </div>
                  
                  {IsloggedIn && (
                    <div className="mt-10 flex flex-wrap items-center gap-6">
                        <Social links={sLinks}/>
                        <ShareProfile username={user && user.name} classes={"ml-auto px-8 py-3 bg-white text-black font-black text-[11px] tracking-[0.2em] uppercase rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"}>
                            Share Profile
                        </ShareProfile>
                    </div>
                  )}
              </div>
        </div>
    </>
  }

  return (
    <div className={`min-h-screen bg-[#0B0C10] pb-20 ${IsloggedIn ? "IsloggedIn" : ""}`} >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8">
          {IsloggedIn ? (
            <div className="inlinetab">
                <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                    <Tab.List className="flex items-center gap-8 mb-12 border-b border-white/5 px-4 overflow-x-auto scrollbar-hide">
                        {['About', 'Feed', 'Memberships'].map((category, idx) => (
                            <Tab
                                key={category}
                                as={Fragment}
                            >
                                {({ selected }) => (
                                    <button
                                        className={`
<<<<<<< HEAD
                                            relative py-4 text-sm font-black tracking-[0.2em] uppercase transition-all duration-300 whitespace-nowrap
=======
                                            w-full rounded-xl  py-2.5 text-sm font-medium leading-5 text-pink-700
                                            ring-white ring-opacity-60 ring-offset-2 ring-offset-pink-400 focus:outline-none focus:ring-2
>>>>>>> 4286dab852d4241f6daa5a78c59cae76d8347e63
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
                            <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10">
                                <GifterFeed username={user && user.username || ''} />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none">
                            <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10">
                                <MembershipLists username={user && user.username || ''}/>
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
