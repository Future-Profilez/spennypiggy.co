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
  const { auth, user, itemid  } = usePage().props;
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
        <div className=" about-sec  m-auto " >
              <div className={`${user && !user.bio ? "hidden":""}  p-3 rounded-2xl dark2     mb-4`} >
                  <p className=" text-white text-lg" >About me</p>
                  <p className={`  text-left mt-2 font-light text-gray-200`}>{(user && user.bio) || "I believe in good vibes and great creators. Supporting one smile at a time 😊"}</p>
                  
                  {IsloggedIn && user?.edit_bio_reason  ?
                    <div className="mt-3">
                        <p className="text-red-700">Bio Edit Request</p>
                        <p className="text-red-500 text-sm">Reason : {user?.edit_bio_reason } Please update your bio as per requested.</p>
                    </div>
                  : ''}

                  <SocialLinks textcolor="text-gray-300 giftersocials" links={sLinks} />
                  {IsloggedIn ? <div className="addsocial flex">
                    <ul>
                        <li><Social  links={sLinks}/></li>
                        <li>
                            <ShareProfile username={user && user.name} classes={"flex ml-auto"}>
                                Share Profile
                            </ShareProfile>
                        </li>
                    </ul>
                </div> : ''}
              </div>

              {/* <GifterTips /> */}
              {/* <GifterItems IsloggedIn={IsloggedIn} /> */}
              {/* <GifterSubscriptions IsloggedIn={IsloggedIn} /> */}

              {/* <GifterMembership /> */}

              {/* {IsloggedIn ? <div className="finish mb-4 mt-0 block">
                  <p className="mb-4"> Finish setting up your account to receive funds. You have more steps to complete your payment setup. </p>
                  <Link href={"/stripe"} className="btn-pink lg" >
                      Become a creator
                  </Link>
              </div> : ''} */}

              {/* {IsloggedIn ? <ThankyouMessages /> : ''} */}
        </div>
    </>
  }

  return (
    <>
        <div className={`tabs-container gifter ${IsloggedIn ? "IsloggedIn" : ""}`} >
          {IsloggedIn ? <>
            <div className="inlinetab">
                <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                    <Tab.List className="flex space-x-1 rounded-xl bg-pink-900/20 p-1 mb-3 justify-center">
                        {['About', 'Feed', 'Memberships'].map((category) => (
                            <Tab
                                key={category}
                                as={Fragment}
                            >
                                {({ selected }) => (
                                    <button
                                        className={`
                                            w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-pink-700
                                            ring-white ring-opacity-60 ring-offset-2 ring-offset-pink-400 focus:outline-none focus:ring-2
                                            ${selected
                                                ? 'bg-white shadow'
                                                : 'text-gray-100 hover:bg-white/[0.12] hover:text-white'}
                                        `}
                                    >
                                        {category}
                                    </button>
                                )}
                            </Tab>
                        ))}
                    </Tab.List>
                    <Tab.Panels className="mt-2">
                        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-pink-400 focus:outline-none focus:ring-2">
                            <div className='max-w-3xl m-auto'>
                                {auth?.user?.profile_status_lock == 1 ? <>
                                    <ActivateCard auth={auth}/>
                                </> : '' }
                                <AboutScreen />
                            </div>
                        </Tab.Panel>
                        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-pink-400 focus:outline-none focus:ring-2">
                            <GifterFeed username={user && user.username || ''} />
                        </Tab.Panel>
                        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-pink-400 focus:outline-none focus:ring-2">
                            <MembershipLists username={user && user.username || ''}/>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
            </>
          : 
          <div className='max-w-3xl m-auto'>
              <AboutScreen />
          </div>
          }
        </div>
    </>
  )
}
