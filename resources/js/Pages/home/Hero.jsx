import { Link, Head } from "@inertiajs/react";
import ModernImage from '../../Components/ModernImage';
import itsfree from "../../../assets/img/itsfree.png";
import itsfreemob from "../../../assets/img/itsfree-mob.png";
import herobanner from '../../../assets/new/HeroBg.png';

// 1x1 transparent placeholder for critical LCP optimization
const transparentPixel = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+';
import proud from '../../../assets/img/proud.png';
import TrustBox from './TrustBox';
import Scrollspy from 'react-scrollspy';
import { useState } from 'react';
import { useEffect } from 'react';
import Popup from '@/Components/Popup';

export default function Hero({auth}) {


  const sections = ['home', 'features', 'faq'];
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
     const handleScroll = () => {
       const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
       const offset = 150;

       const currentSection = sections.find(section => {
         const sectionElement = document.getElementById(section);
         if (sectionElement) {
           const { offsetTop, offsetHeight } = sectionElement;
           return scrollTop >= offsetTop - offset && scrollTop < offsetTop + offsetHeight - offset;
         }
         return false;
       });
       setActiveSection(currentSection || '');
     };

     window.addEventListener('scroll', handleScroll);
     return () => {
       window.removeEventListener('scroll', handleScroll);
     };
   }, []);

   const handleNavItemClick = (e, section) => {
    e.preventDefault();
    const targetElement = document.getElementById(section);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [showPopup, setShowPopup] = useState(false);
  useEffect(() => {
      const lastShown = localStorage.getItem("popupLastShown");
      if (!lastShown || Date.now() - parseInt(lastShown) > 1000 * 60 * 60 * 24 * 7) {
          setShowPopup(true);
          localStorage.setItem("popupLastShown", Date.now());
      }
  }, []);

  return <>
            {/* <Popup action={showPopup} space="4"
            modalclassName="pinkmodal" >
              <div className='p-8'>
              <h2 className='text-center font-GillSans text-purple text-[20px] text-uppercase'>For Open banking payments and same day payouts, sign up via <a href='https://uk.spennypiggy.co'  >uk.spennypiggy.co </a> 🤑🚀</h2>

              <div className='flex justify-center'>
                <a className='btn btn-pink mt-3 w-full max-w-[200px] ' href='https://uk.spennypiggy.co'> Sign Up</a>
              </div>
              </div>
            </Popup> */}

      <div className="block lg:hidden landing-bottom-bar">
        <Scrollspy items={sections} currentClassName="active" offset={-50}>
          <li>
            <a href="#home" className={activeSection === 'home' ? 'active' : ''} onClick={(e) => handleNavItemClick(e, 'home')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12.204C2 9.915 2 8.771 2.52 7.823C3.038 6.874 3.987 6.286 5.884 5.108L7.884 3.867C9.889 2.622 10.892 2 12 2C13.108 2 14.11 2.622 16.116 3.867L18.116 5.108C20.013 6.286 20.962 6.874 21.481 7.823C22 8.771 22 9.915 22 12.203V13.725C22 17.625 22 19.576 20.828 20.788C19.657 22 17.771 22 14 22H10C6.229 22 4.343 22 3.172 20.788C2 19.576 2 17.626 2 13.725V12.204Z" stroke="black" strokeWidth="1.5"/>
            <path d="M12 15V18" stroke="black" strokeWidth="1.5" stroke-linecap="round"/>
            </svg>
            </a>
          </li>
          <li>
            <a href="#features" className={activeSection === 'features' ? 'active' : ''} onClick={(e) => handleNavItemClick(e, 'features')}>
              Features
            </a>
          </li>
          <li>
            <a href="#reviews" className={activeSection === 'reviews' ? 'active' : ''} onClick={(e) => handleNavItemClick(e, 'reviews')}>
            reviews
            </a>
          </li>
          <li>
            <a href="#faq" className={activeSection === 'faq' ? 'active' : ''} onClick={(e) => handleNavItemClick(e, 'faq')}>
              FAQ's
            </a>
          </li>
        </Scrollspy>
      </div>


      {/* Critical LCP optimization: Inline 1x1 transparent placeholder */}
      <img 
        src={transparentPixel} 
        alt="" 
        width="1" 
        height="1" 
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        loading="eager"
        fetchPriority="high"
      />
      
      <div id="home" className="heroSec heroSec--optimized pb-2 sm:pb-10 position-relative">
        <div className="containerbox">
          <div className="welcome" data-aos="zoom-out" >
              <div className="welcomeLeft m-auto pt-[50px] xl:pt-[80px] d-table">
                  {/* <h2 className="text-center welcomeHeading shadow-yellow font-GillSans text-uppercase mb-1">
                    Oink! Oink! B*tch{" "}
                  </h2> */}
                  <h2 className=" headingSm shadow-none uppercase text-light font-gulfs stroke-none text-5xl md:text-6xl  xl:text-7xl max-w-3xl mx-auto text-center">
                    The everything {" "}
                    <div className='text-5xl md:text-7xl xl:text-8xl text-[#F94F96]  '>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 animate-pulse">
                                wishlist
                            </span>
                            </div>
                  </h2>
                  <h3 className="text-center text-xl uppercase text-yellow font-anton tracking-wide mt-2 sm:mt-3 mb-2 sm:mb-3">
                      Built for Creators
                  </h3>
                  <h3 className="text-center text-2xl uppercase text-white font-antons mb-3 max-w-[600px]">
                  Want gifts without TMI? Build your privacy-first Wishlist and let your fans spoil you!
                  </h3>
                  <div className=" pt-4 wishlistbtn wishlistbtnFixed m-auto d-table">
                    
                    
                    <div>

                    </div>
                    {auth?.user?.username
                      ?
                      <Link href={`/${auth && auth?.user && auth?.user?.username || ''}`} className="btn-shadow
                      btn-pink py-[8px] px-5 lg log" >
                        My Wishlist
                        <span className="absolute bottom-[-45px] animate-pulse right-[-10px] sm:right-[-50px] font-poppins capitalize text-mint font-bold text-shadow-none  p-2 text-sm rounded-xl">It's Free 🎉</span>
                      </Link>
                      :  <Link href="/register"
                      // className="bg-[#E6EA7B] font-anton text-black px-5 py-1 uppercase flex text-center items-center tracking-[1px] justify-center text-lg rounded-[30px] border-[2px] border-yellow transition-all duration-300 ease-in-out"
                      className="btn-shadow
                      btn-pink py-[8px] px-5 lg log">
                          Create  your page
                          <span className="absolute bottom-[-45px] animate-pulse right-[-10px] sm:right-[-50px] font-poppins capitalize text-mint font-bold text-shadow-none  p-2 text-sm rounded-xl">It's Free 🎉</span>
                         </Link>
                    }
                   
                    {/* <div className='itsfree-tag block md:hidden' >
                      <ModernImage
                        src={itsfreemob}
                        alt="It's free mobile badge"
                        className=""
                        priority={true}
                        responsive={true}
                        formats={['webp', 'avif']}
                        quality={85}
                        loading="eager"
                        decoding="async"
                        width={200}
                        height={"auto"}
                      />
                    </div> */}
                  </div>
                  <div className="mt-7 md:mt-1 flex justify-center pt-4 md:pt-0">
                    <TrustBox />
                </div>

                  {/* <div className="mt-4 pt-2 gifts-links text-white ps-0 ">
                  Proudly 🏳️‍🌈 Owned
                  </div> */}

                  {/* <div className="itsfree ps-0 mt-0 mt-md-3 pt-1 text-start"> Its’s Free 🎉 </div> */}

              </div>
          </div>

          {/* <div className="proud-banner flex  items-center w-full max-w-[500px]" >
            <img  className='object-contain' alt={"image"} src={proud}  />
            <p className='text-white ps-4 pb-3' >*Requires a monthly £4 subscription to cover stripe fees & compliance costs.</p>
          </div> */}
        </div>
      </div>
    </>
}

{/* <div className="welcomeRt">

    <h2 className="d-block d-md-none welcomeHeading shadow-yellow font-GillSans text-uppercase mb-1">
      Oink! Oink! <br /> B*tch{" "}
    </h2>

    <img alt={"image"}
    height={377.63}
    src={addwishlistimg}
    width={474} />

  <div className="proudlines mt-3 mt-md-0 mb-0 welcomeTitle sm text-center mt-1 shadow-yellow text-uppercase font-GillSans ps-0 ">
    Proudly 🏳️‍🌈 Owned
  </div>

</div>  */}
