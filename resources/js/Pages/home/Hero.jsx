import { Link, Head } from "@inertiajs/react";
import ModernImage from '../../Components/ModernImage';
import itsfree from "../../../assets/img/itsfree.png";
import itsfreemob from "../../../assets/img/itsfree-mob.png";
import herobanner from '../../../assets/new/HeroBg.png';

// 1x1 transparent placeholder for critical LCP optimization
const transparentPixel = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+';
import proud from '../../../assets/img/proud.png';
import TrustBox from './TrustBox';
import { useState, useEffect, useRef } from 'react';
import Popup from '@/Components/Popup';
import { RocketIcon, HouseIcon } from "@animateicons/react/lucide";

export default function Hero({auth}) {
  const houseIconRef = useRef(null);
  const rocketIconRef1 = useRef(null);
  const rocketIconRef2 = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
        houseIconRef.current?.startAnimation?.();
        rocketIconRef1.current?.startAnimation?.();
        rocketIconRef2.current?.startAnimation?.();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="block lg:hidden landing-bottom-bar bg-gray-900 border-t border-gray-800">
            <ul className="px-2 flex justify-between items-center w-full text-sm sm:text-normal mx-auto">
              <li>
                <a 
                    href="#home" 
                    className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'home' ? 'active text-pink-500' : 'text-white'}`} 
                    onClick={(e) => handleNavItemClick(e, 'home')}
                    onMouseEnter={() => houseIconRef.current?.startAnimation()}
                >
                  <HouseIcon ref={houseIconRef} size={24} color="currentColor" duration={1.5} />
                </a>
              </li>
              <li>
                <a href="#features" className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'features' ? 'active text-pink-500' : 'text-white'}`} onClick={(e) => handleNavItemClick(e, 'features')}>
                  Features
                </a>
              </li>
              <li>
                <a href="#reviews" className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'reviews' ? 'active text-pink-500' : 'text-white'}`} onClick={(e) => handleNavItemClick(e, 'reviews')}>
                reviews
                </a>
              </li>
              <li>
                <a href="#faq" className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'faq' ? 'active text-pink-500' : 'text-white'}`} onClick={(e) => handleNavItemClick(e, 'faq')}>
                  FAQ's
                </a>
              </li>
            </ul>
        </div>
        <img 
          src={transparentPixel} 
          alt="" 
          width="1" 
          height="1" 
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          loading="eager"
        />
        <div id="home" className="bg-black relative min-h-[80vh] lg:min-h-[85vh] flex items-center justify-center py-2 md:py-24">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
              <div className="absolute top-[-40px] left-0 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 floating-shape animate-float"></div>
              <div className="absolute top-20 right-10 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 floating-shape animate-float-delayed" style={{animationDelay: '1s'}}></div>
              <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 floating-shape animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="containerbox relative w-full">
            <div className="welcome px-4" >
                <div className="welcomeLeft mx-auto w-full text-center">
                    <h2 className="fading shadow-none uppercase text-white font-gulfs tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[70px] max-w-5xl mx-auto text-center leading-[1.1] md:leading-[1]">
                      The everything 
                      <div className='block mt-2 text-4xl md:text-7xl xl:text-[80px]'>
                        <span className="text-gradient-wishlist drop-shadow-[0_0_30px_rgba(249,79,150,0.3)]">
                            wishlist
                        </span>
                      </div>
                    </h2>
                    <div className="flex items-center justify-center mt-6 mb-4">
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-yellow-400/50"></div>
                      <h3 className="text-center text-sm md:text-lg uppercase text-yellow-400 font-gulfs tracking-[0.3em] px-4">
                          Built for Creators
                      </h3>
                      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-yellow-400/50"></div>
                    </div>
                    <h3 className="text-center text-lg md:text-2xl text-gray-400 font-poppins font-light mb-12 max-w-3xl mx-auto leading-relaxed opacity-90">
                      Get paid with secure, trackable income — with built-in 
                      <span className="text-white font-medium"> protection against disputes and chargebacks.</span>
                    </h3>
                    <div className="pt-4 wishlistbtn wishlistbtnFixed mx-auto relative inline-block">
                      
                      
                      <div>

                      </div>
                      {auth?.user?.username
                        ?
                        <Link 
                          href={`/${auth && auth?.user && auth?.user?.username || ''}`} 
                          className="relative inline-flex items-center gap-4 bg-white text-black font-black text-normal md:text-xl py-3 px-8 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden" 
                          onMouseEnter={() => rocketIconRef1.current?.startAnimation()}
                        >
                          <span className="relative z-10">My Wishlist</span>
                          <RocketIcon ref={rocketIconRef1} size={24} duration={1.5} className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        :  <Link 
                          href="/register"
                          className="relative inline-flex items-center gap-4 bg-white text-black font-black text-normal md:text-xl py-3 px-8 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden"
                          onMouseEnter={() => rocketIconRef2.current?.startAnimation()}
                        >
                            <span className="relative z-10">Create your page</span>
                            <RocketIcon ref={rocketIconRef2} size={24} duration={1.5} className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </Link>
                      }
                      <span className="absolute -top-5 -right-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[12px] font-gulfs uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-white/10 animate-bounce
                      ">It's Free 🎉</span>
                    
                    </div>
                    <div className=" flex justify-center">
                      <TrustBox />
                  </div>

                </div>
            </div>
          </div>
        </div>
    </>
}
