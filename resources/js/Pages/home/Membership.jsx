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
    bg: "bg-[#8C52FF]",
    icon: <FaGamepad size={70} className="text-white" />,
  },
  {
    title: "Rewards",
    description:
      "Let Supporters unlock exclusive posts, member-only products and more.",
    bg: "bg-[#D9DE62]",
    icon: <FaAward size={70} className="text-[#8C52FF]" />,
  },
  {
    title: "Commissions & Services",
    description:
      "Let Supporters buy unique work or pay for direct access to you.",
    bg: "bg-[#1AD1A6]",
    icon: <FaHandshake size={70} className="text-[#08654F]" />,
  },
  {
    title: "Membership Tiers",
    description:
      "Let fans support you monthly with Spenny Piggy Memberships.",
    bg: "bg-[#8C52FF]",
    icon: <FaUsers size={70} className="text-white" />,
  },
  {
    title: "Wishes",
    description:
      "Let supporters send you surprise gifts, cash gifts and gifts shipped directly to your door!",
    bg: "bg-[#D9DE62]",
    icon: <FaGift size={70} className="text-[#8C52FF]" />,
  },
  {
    title: "The Leaderboard",
    description:
      "Showcase your supporters contributions directly on your page and site wide.",
    bg: "bg-[#1AD1A6]",
    icon: <FaCrown size={70} className="text-[#08654F]" />,
  },
  {
    title: "Profile Intro Video",
    description:
      "Showcase a profile introduction video, making your page as unique as you are!",
    bg: "bg-[#8C52FF]",
    icon: <FaVideo size={70} className="text-white" />,
  },
  {
    title: "Monthly Bills",
    description:
      "Make exclusive content available to supporters or members. Getting those bills paid in the process.",
    bg: "bg-[#D9DE62]",
    icon: <FaCalendarAlt size={32} className="text-[#8C52FF]" />,
  },
];

export default function Membership() {
  return (
    <>
      <section className='bg-black py-16 md:py-24 relative overflow-hidden'>
         {/* Decorative Background Elements */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 floating-shape"></div>
        </div>

       <div className='container relative  px-4 mx-auto' >
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-tight">
            Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">Membership</span>
        </h2>
        <p className='max-w-4xl text-gray-300 m-auto text-center text-lg md:text-xl font-poppins leading-relaxed mb-12' >Discover a hassle-free way to enhance your earnings potential. Enjoy zero fees for fans, with creators keeping 100% of their earnings. Unlock premium features, including enhanced chargeback protection. Cancel anytime. Join us today!</p>
      </div>

        <div className='relative p-0 md:p-4  ' >
         <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 z-1">
            <LiveBar reps={20} color={`yellowbg`} classes={''} text={"  Coming Soon      "} />
         </div>

              <div data-aos="zoom-in-up" className='membership-image py-2 mx-auto flex justify-center max-w-4xl mt-3 relative ' >
                <div className="rounded-[30px] overflow-hidden border-4 border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
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
    <section id='features' className="bg-black relative overflow-hidden py-24 px-4 text-center">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      </div>

      <div className="containerbox relative  ">
        <div className="flex justify-center mb-6" data-aos="fade-down">
          <img src={support} alt="Pig Mascot" className="w-24 h-24 object-contain animate-bounce" />
        </div>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-gulfs text-white text-center mb-12 uppercase leading-tight max-w-4xl mx-auto">
          Supporting Creators! Empowering Gifters! <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">Made for Everyone!</span>
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {supportData.map((item, index) => (
            <div key={index} className="group flex flex-col items-center text-center mb-3 hover:-translate-y-2 transition-transform duration-300">
            <div className={`relative w-full max-w-[250px] min-h-[150px] ${item.bg} rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-white transform group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
            </div>

            <h3 className="mt-4 leading-tight md:leading-[1.35rem] text-lg md:text-xl uppercase font-gulfs text-white group-hover:text-pink-400 transition-colors">
              {item.title}
            </h3>

            <p className="mt-2 text-sm text-gray-300 leading-tight sm:leading-normal max-w-[17rem] font-poppins">
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
