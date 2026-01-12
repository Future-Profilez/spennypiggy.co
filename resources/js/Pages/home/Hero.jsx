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
import { FaRocket } from 'react-icons/fa';

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
      <div className="block lg:hidden landing-bottom-bar bg-gray-900 border-t border-gray-800">
        <Scrollspy items={sections} currentClassName="active" offset={-50}>
          <li>
            <a href="#home" className={activeSection === 'home' ? 'active text-pink-500' : 'text-white'} onClick={(e) => handleNavItemClick(e, 'home')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12.204C2 9.915 2 8.771 2.52 7.823C3.038 6.874 3.987 6.286 5.884 5.108L7.884 3.867C9.889 2.622 10.892 2 12 2C13.108 2 14.11 2.622 16.116 3.867L18.116 5.108C20.013 6.286 20.962 6.874 21.481 7.823C22 8.771 22 9.915 22 12.203V13.725C22 17.625 22 19.576 20.828 20.788C19.657 22 17.771 22 14 22H10C6.229 22 4.343 22 3.172 20.788C2 19.576 2 17.626 2 13.725V12.204Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 15V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            </a>
          </li>
          <li>
            <a href="#features" className={activeSection === 'features' ? 'active text-pink-500' : 'text-white'} onClick={(e) => handleNavItemClick(e, 'features')}>
              Features
            </a>
          </li>
          <li>
            <a href="#reviews" className={activeSection === 'reviews' ? 'active text-pink-500' : 'text-white'} onClick={(e) => handleNavItemClick(e, 'reviews')}>
            reviews
            </a>
          </li>
          <li>
            <a href="#faq" className={activeSection === 'faq' ? 'active text-pink-500' : 'text-white'} onClick={(e) => handleNavItemClick(e, 'faq')}>
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
      
      <div id="home" className="bg-black relative  min-h-[80vh] lg:min-h-[85vh] flex items-center justify-center overflow-hidden py-2 md:py-24">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-0 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 floating-shape animate-float"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 floating-shape animate-float-delayed" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 floating-shape animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="containerbox relative   w-full">
          <div className="welcome" data-aos="zoom-out" >
              <div className="welcomeLeft m-auto   d-table w-full text-center">
                  
                  <h2 className="headingSm shadow-none uppercase text-light font-gulfs stroke-none text-xl md:text-5xl xl:text-6xl max-w-4xl mx-auto text-center leading-tight">
                    The everything {" "}
                    <div className='block mt-2 text-3xl md:text-6xl xl:text-7xl'>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 animate-pulse">
                                wishlist
                            </span>
                            </div>
                  </h2>
                  <h3 className="text-center text-xl uppercase text-yellow-400 font-bold tracking-widest mt-6 mb-4">
                      Built for Creators
                  </h3>
                  <h3 className="text-center text-xl md:text-2xl text-gray-300 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
                  Want gifts without TMI? Build your privacy-first Wishlist and let your fans spoil you!
                  </h3>
                  <div className="pt-4 wishlistbtn wishlistbtnFixed m-auto d-table">
                    
                    
                    <div>

                    </div>
                    {auth?.user?.username
                      ?
                      <Link href={`/${auth && auth?.user && auth?.user?.username || ''}`} 
                        className="relative inline-flex items-center gap-4 bg-white text-black font-black text-normal md:text-xl py-3 px-8 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden" >
                        <span className="relative z-10">My Wishlist</span>
                        <FaRocket className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Link>
                      :  <Link href="/register"
                      className="relative inline-flex items-center gap-4 bg-white text-black font-black text-normal md:text-xl py-3 px-8 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden">
                          <span className="relative z-10">Create your page</span>
                          <FaRocket className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         </Link>
                    }
                    <span className="absolute -top-4 -right-3 bg-pink-500 text-white text-[14px] font-bold px-2 py-1 rounded-full animate-pulse">It's Free 🎉</span>
                   
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
