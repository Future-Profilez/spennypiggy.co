import PREMIUMMEMBERSHIP from '../../../assets/img/PREMIUMMEMBERSHIP.png'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import LiveBar from '@/includes/LiveBar'
import support from '../../../assets/new/Support.png'

import {
  FaGamepad,
  FaAward,
  FaHandshake,
  FaUsers,
  FaGift,
  FaCrown,
  FaVideo,
  FaCalendarAlt,
} from "react-icons/fa";

const supportData = [
  {
    title: "Posts",
    description: "Share your creative journey with blog posts, videos and more!",
    color: "#8C52FF",
    icon: FaGamepad,
  },
  {
    title: "Rewards",
    description:
      "Let Supporters unlock exclusive posts, member-only products and more.",
    color: "#D9DE62",
    icon: FaAward,
  },
  {
    title: "Commissions & Services",
    description:
      "Let Supporters buy unique work or pay for direct access to you.",
    color: "#1AD1A6",
    icon: FaHandshake,
  },
  {
    title: "Membership Tiers",
    description:
      "Let fans support you monthly with Spenny Piggy Memberships.",
    color: "#8C52FF",
    icon: FaUsers,
  },
  {
    title: "Wishes",
    description:
      "Let supporters send you surprise gifts, cash gifts and gifts shipped directly to your door!",
    color: "#D9DE62",
    icon: FaGift,
  },
  {
    title: "The Leaderboard",
    description:
      "Showcase your supporters contributions directly on your page and site wide.",
    color: "#1AD1A6",
    icon: FaCrown,
  },
  {
    title: "Profile Intro Video",
    description:
      "Showcase a profile introduction video, making your page as unique as you are!",
    color: "#8C52FF",
    icon: FaVideo,
  },
  {
    title: "Monthly Bills",
    description:
      "Make exclusive content available to supporters or members. Getting those bills paid in the process.",
    color: "#D9DE62",
    icon: FaCalendarAlt,
  },
];

export default function Membership() {
  return (
    <>
      <section className='bg-black py-16 md:py-24 relative'>
         {/* Decorative Background Elements */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 floating-shape"></div>
        </div>

       <div className='container relative  px-4 mx-auto' >
        <h2 className="fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-tight">
            Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">Membership</span>
        </h2>
        <p className='fading max-w-4xl text-gray-300 m-auto text-center text-lg md:text-xl font-poppins leading-relaxed mb-12' >Discover a hassle-free way to enhance your earnings potential. Enjoy zero fees for fans, with creators keeping 100% of their earnings. Unlock premium features, including enhanced chargeback protection. Cancel anytime. Join us today!</p>
      </div>

        <div className='relative p-0 md:p-4  ' >
         <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 z-1">
            <LiveBar reps={20} color={`yellowbg`} classes={''} text={"  Coming Soon      "} />
         </div>

              <div data-aos="zoom-in-up" className='membership-image py-2 px-4 mx-auto flex justify-center max-w-4xl mt-3 relative  ' >
                <div className="rounded-[30px] overflow-hidden border-4 border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.3)] ">
                    <LazyLoadImage
                    alt={"image"}
                    effect="blur"
                    className="w-full h-auto"
                    src={PREMIUMMEMBERSHIP}
                    />
                </div>
              </div>
        </div>
      </section>
      <section id='features' className="bg-black relative py-24 px-4 text-center">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        </div>

        <div className="containerbox relative  ">
          <div className="flex justify-center mb-6" data-aos="fade-down">
            <img src={support} alt="Pig Mascot" className="w-24 h-24 object-contain animate-bounce" />
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-5xl font-gulfs text-white text-center mb-16 uppercase leading-none tracking-[2px] max-w-6xl mx-auto drop-shadow-2xl">
              <span className="fading block mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Supporting Creators!</span>
              <span className="fading block mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 animate-pulse drop-shadow-none">Empowering Gifters!</span>
              <span className="fading block text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" style={{WebkitTextStroke: '1px #000'}}>Made for Everyone!</span>
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
            {supportData.map((item, index) => (
              <div key={index} className=" group flex flex-col items-center text-center mb-6 hover:-translate-y-2 transition-transform duration-300">
              <div 
                  className="relative w-full max-w-[220px] aspect-[4/3] bg-gray-900 rounded-[30px] flex items-center justify-center border-4 transition-all duration-300 overflow-hidden group-hover:shadow-lg"
                  style={{
                      borderColor: item.color,
                      // boxShadow: `6px 6px 0 0 ${item.color}`
                  }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 drop-shadow-lg">
                  <item.icon size={60} color={item.color} />
                </div>
              </div>

              <h3 className="fading mt-6 leading-tight text-lg md:text-xl uppercase font-gulfs text-white group-hover:text-pink-400 transition-colors tracking-wide">
                {item.title}
              </h3>

              <p className=" fading text-sm text-gray-400 leading-relaxed max-w-[16rem] font-poppins group-hover:text-gray-200 transition-colors">
                {item.description}
              </p>
            </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
