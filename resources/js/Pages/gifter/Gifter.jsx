import { usePage } from '@inertiajs/react';
import GifterItems from './GifterItems';
import GifterTips from './GifterTips';
import GifterSubscriptions from './GifterSubscriptions';
import Social from '../Auth/Social';
import ShareProfile from '@/wishlist/ShareProfile';
import SocialLinks from '@/includes/SocialLinks';
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useState } from 'react';
import GifterFeed from './GifterFeed';
import MembershipLists from './MembershipLists';
import ActivateCard from './ActivateCard';


export default function Gifter({ IsloggedIn,  sLinks }){
  const { auth, user, itemid  } = usePage().props;
  const AboutScreen = () => {
    return <>
        <div className=" about-sec  m-auto " >
              <div className={`${user && !user.bio ? "d-nones":""}  p-3 rounded-2xl dark2     mb-4`} >
                  <p className=" text-white text-lg" >About me</p>
                  <p className={`  text-start mt-2 font-light text-gray-200`}>{(user && user.bio) || "I believe in good vibes and great creators. Supporting one smile at a time 😊"}</p>
                  
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
                            <ShareProfile username={user && user.name} classes={"flex ms-auto"}>
                                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" > <path d="M22.46 6.5C21.69 6.85 20.86 7.08 20 7.19C20.88 6.66 21.56 5.82 21.88 4.81C21.05 5.31 20.13 5.66 19.16 5.86C18.37 5 17.26 4.5 16 4.5C13.65 4.5 11.73 6.42 11.73 8.79C11.73 9.13 11.77 9.46 11.84 9.77C8.28004 9.59 5.11004 7.88 3.00004 5.29C2.63004 5.92 2.42004 6.66 2.42004 7.44C2.42004 8.93 3.17004 10.25 4.33004 11C3.62004 11 2.96004 10.8 2.38004 10.5V10.53C2.38004 12.61 3.86004 14.35 5.82004 14.74C5.19077 14.9122 4.53013 14.9362 3.89004 14.81C4.16165 15.6625 4.69358 16.4084 5.41106 16.9429C6.12854 17.4775 6.99549 17.7737 7.89004 17.79C6.37367 18.9904 4.49404 19.6393 2.56004 19.63C2.22004 19.63 1.88004 19.61 1.54004 19.57C3.44004 20.79 5.70004 21.5 8.12004 21.5C16 21.5 20.33 14.96 20.33 9.29C20.33 9.1 20.33 8.92 20.32 8.73C21.16 8.13 21.88 7.37 22.46 6.5Z" fill="#5D25FD" /> </svg>
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

              {/* {IsloggedIn ? <div className="finish mb-4 mt-0 d-block">
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
                <div className='max-w-3xl m-auto'>
                    <ActivateCard auth={auth}/>
                    <AboutScreen />
                </div>
                {/* <Tabs
                    defaultActiveKey="home"
                    transition={true}
                    onSelect={(e) => setTab(e)}
                    id="noanim-tab-example"
                    className="mb-3 justify-content-center" >
                    <Tab eventKey="home" title="About">
                        <div className='max-w-3xl m-auto'>
                            {auth?.user?.profile_status_lock == 1 ? <>
                                <ActivateCard auth={auth}/>
                            </> : '' }
                            <AboutScreen />
                        </div>
                    </Tab>
                    
                    <Tab eventKey="feed" title="Feed">
                        <GifterFeed username={user && user.username || ''} />
                    </Tab>
                    <Tab eventKey="memberships" title="Memberships">
                        <MembershipLists username={user && user.username || ''}/>
                    </Tab>
                    <Tab eventKey="media" title="Media">
                            <GifterMedia username={user && user.username || ''} />
                        </Tab>
                   
                </Tabs> */}
            </div>
            </>
          : <AboutScreen /> }
        </div>
    </>
  )
}
