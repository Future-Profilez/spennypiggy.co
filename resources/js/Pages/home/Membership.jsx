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
    {/* <style>{`
    .commingsooon {
      position:absolute;
      top:47%;
      left:0
    }
    `}</style>
      <div className='forcreators overflow-hidden py-3 py-md-5 px-3 px-md-0 bg-white' >
       <div className='container py-4' >
        <h2 className='headingSm shadow-none text-dark stroke-none mb-3 text-center mb-6' >Premium Membership</h2>
        <p className='max-width-900 text-muted m-auto text-center text-[20px]' >Discover a hassle-free way to enhance your earnings potential. Enjoy zero fees for fans, with creators keeping 100% of their earnings. Unlock premium features, including enhanced chargeback protection. Cancel anytime. Join us today!</p>
      </div>

        <div className='position-relative p-0 p-md-4' >
        <LiveBar reps={20} color={`yellowbg`} classes={'commingsooon'} text={"  Coming Soon      "} />

              <div data-aos="zoom-in-up" className='membership-image py-2 m-auto d-table flex justify-content-center max-width-900 mt-3 ' >
                <LazyLoadImage
                  alt={"image"}

                  effect="blur"
                  className=""
                  src={PREMIUMMEMBERSHIP}
                  width={982}
                  height={600}
                />
              </div>
              <strong className='font-[23px] text-center my-2 m-auto d-table' >*Supporters just pay payment processing. No service fees.</strong>
        </div>

    </div> */}
    <section  id='features' className="bg-black text-white py-16 px-4 text-center">
    <div className=" ">
      <div className="flex justify-center mb-6">
        <img src={support} alt="Pig Mascot" className="w-24 h-24 object-contain" />
      </div>

      <h2 className="headingSm shadow-none text-light font-gulfs stroke-none text-3xl md:text-4xl uppercase mb-6 max-w-3xl mx-auto text-center">
        Supporting Creators! Empowering Gifters! Made for Everyone!
      </h2>
      <div data-aos="zoom-out-up" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-8 max-w-7xl mx-auto">
        {supportData.map((item, index) => (
          <div  key={index} className="flex flex-col membershipitems items-center text-center mb-3 ">
          <div className={`relative w-full max-w-[250px] min-h-[150px] ${item.bg} rounded-2xl flex items-center justify-center`}>
          <div className="absolute bg-white/20 rounded-full" />
            <div className="relative z-10 text-white">
              {item.icon}
            </div>
          </div>

          <h3 className="mt-3 leading-tight md:leading-[1.35rem] text-lg md:text-xl uppercase font-gulfs">
            {item.title}
          </h3>

          <p className="mt-1 md:mt-1.5 text-sm text-white leading-tight sm:leading-normal max-w-[17rem] font-poppins">
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
