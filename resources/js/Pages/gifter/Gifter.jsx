import { usePage } from '@inertiajs/react';
import GifterItems from './GifterItems';
import GifterTips from './GifterTips';
import GifterSubscriptions from './GifterSubscriptions';
import GifterBills from './GifterBills';
import Social from '../Auth/Social';
import ShareProfile from '@/wishlist/ShareProfile';
import SocialLinks from '@/includes/SocialLinks';
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useState, useEffect } from 'react';
import GifterFeed from './GifterFeed';
import MembershipLists from './MembershipLists';
import GifterMedia from './GifterMedia';
import ActivateCard from './ActivateCard';


export default function Gifter({ IsloggedIn,  sLinks }){
  const { auth, user, itemid  } = usePage().props;
  const [activeTab, setActiveTab] = useState('home');
  
  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);
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
                <Tabs
                    activeKey={activeTab}
                    onSelect={(key) => setActiveTab(key)}
                    transition={true}
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
                    <Tab eventKey="subscriptions" title="Subscriptions">
                        <GifterSubscriptions IsloggedIn={IsloggedIn} />
                    </Tab>
                    <Tab eventKey="bills" title="Bills">
                        <GifterBills username={user && user.username || ''} />
                    </Tab>
                    <Tab eventKey="media" title="Media">
                            <GifterMedia username={user && user.username || ''} />
                        </Tab>
                   
                </Tabs>
            </div>
            </>
          : <AboutScreen /> }
        </div>
    </>
  )
}
