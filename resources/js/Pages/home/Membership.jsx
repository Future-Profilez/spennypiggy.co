import LiveBar from '@/includes/LiveBar'
import support from '../../../assets/new/Support.png'
import FadeIn from '@/Components/animations/FadeIn'
import StaggerItem from '@/Components/animations/StaggerItem'
import TiltCard from '@/Components/animations/TiltCard'
import Reveal3D from '@/Components/animations/Reveal3D'
import WordReveal from '@/Components/animations/WordReveal'
import ScrollX from '@/Components/animations/ScrollX'
import Parallax from '@/Components/animations/Parallax'
import WatermarkStrip from '@/Components/animations/WatermarkStrip'

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
      "Let Supporters access exclusive posts, member-only products and more.",
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
      "Fans fund your wishes and unlock exclusive content — or send you a treat shipped directly to your door!",
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
      <section className='bg-transparent py-20 md:py-28 relative overflow-hidden'>
         <WatermarkStrip text="Premium" from={0} to={-450} opacity={0.18} className="top-2" />
         {/* Decorative Background Elements */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 floating-shape"></div>
        </div>

       <div className='container relative  px-4 mx-auto' >
        <h2 className="fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-tight">
            <ScrollX as="span" from={-100} to={50} className="inline-block">
                Premium <span className="text-gradient-wishlist">Membership</span>
            </ScrollX>
        </h2>
        <FadeIn y={20} delay={0.15}>
        <p className='fading max-w-4xl text-gray-300 m-auto text-center text-base md:text-xl font-poppins leading-relaxed mb-8 md:mb-12' >Discover a hassle-free way to enhance your earnings potential. Enjoy zero fees for fans, with creators keeping 100% of their earnings. Access premium features, including enhanced chargeback protection. Cancel anytime. Join us today!</p>
        </FadeIn>
      </div>

        <div className='relative p-0 md:p-4  ' >
         <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 z-1">
            <LiveBar reps={20} color={`yellowbg`} classes={''} text={"  Coming Soon      "} />
         </div>

              <Reveal3D delay={0.2} rotate={40} y={80}>
              <Parallax speed={45}>
              <div className='membership-image py-2 px-4 mx-auto flex justify-center max-w-5xl mt-3 relative z-10' >
                <TiltCard max={4} scale={1.01} className="rounded-[30px] w-full">
                <div className="relative w-full rounded-[30px] bg-[#0d0a16] border-2 border-[#FF007F]/40 shadow-[0_0_60px_rgba(236,72,153,0.32)] p-5 md:p-8 overflow-hidden">
                    {/* ambient glow */}
                    <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#8C52FF] blur-[90px] opacity-25"></div>
                    <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-[#FF007F] blur-[90px] opacity-25"></div>

                    <div className="relative flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFD60A] to-[#FF8E25] border-2 border-black grid place-items-center text-black shadow-[3px_3px_0_0_#000]">
                                <FaCrown size={20} />
                            </span>
                            <div className="text-left leading-tight">
                                <p className="font-gulfs uppercase text-white text-lg md:text-xl">Membership tiers</p>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-white/50">Set your own perks &amp; price</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#06281a] bg-[#05EFB8] rounded-full px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>0% fan fees
                        </span>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                        {[
                            { name: 'Supporter', price: '£3', accent: '#1AD1A6', perks: ['Member-only posts', 'Community shoutout'] },
                            { name: 'Super Fan', price: '£8', accent: '#FF007F', popular: true, perks: ['Everything in Supporter', 'Monthly video call', 'Early access drops'] },
                            { name: 'VIP', price: '£20', accent: '#8C52FF', perks: ['Everything in Super Fan', '1:1 requests', 'Name in the credits'] },
                        ].map((t, i) => (
                            <div
                                key={i}
                                className={`relative rounded-[22px] border-2 p-5 text-left flex flex-col bg-[#13101f] ${t.popular ? 'md:-translate-y-2 md:scale-[1.03]' : ''}`}
                                style={{ borderColor: t.accent, boxShadow: `6px 6px 0 0 ${t.accent}` }}
                            >
                                {t.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wide text-black bg-[#FFD60A] border-2 border-black rounded-full px-3 py-0.5 whitespace-nowrap">Most popular</span>
                                )}
                                <p className="font-gulfs uppercase text-white text-lg" style={{ textShadow: `0 0 14px ${t.accent}66` }}>{t.name}</p>
                                <p className="mt-1 mb-4">
                                    <span className="font-gulfs text-3xl md:text-[34px] leading-none" style={{ color: t.accent }}>{t.price}</span>
                                    <span className="text-white/55 font-bold text-[12px]"> /mo</span>
                                </p>
                                <ul className="space-y-2 mb-5">
                                    {t.perks.map((p, j) => (
                                        <li key={j} className="flex items-start gap-2 text-[12.5px] font-semibold text-white/80 leading-snug">
                                            <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full grid place-items-center text-[9px] text-black" style={{ background: t.accent }}>✓</span>
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className={`mt-auto w-full rounded-full py-2.5 text-[12px] font-black uppercase tracking-wide border-2 border-black transition-transform hover:-translate-y-0.5 ${t.popular ? 'text-white' : 'text-black'}`}
                                    style={{ background: t.popular ? '#FF007F' : t.accent, boxShadow: '3px 3px 0 0 #000' }}
                                >
                                    Join {t.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="relative mt-6 text-center text-[12px] font-semibold text-white/50">
                        Fans pay zero fees. You keep <span className="text-white font-black">100%</span> of every membership. Cancel anytime.
                    </p>
                </div>
                </TiltCard>
              </div>
              </Parallax>
              </Reveal3D>
        </div>
      </section>
      <section id='features' className="bg-black relative py-14 md:py-24 px-4 text-center overflow-hidden">
        <WatermarkStrip text="Features" from={120} to={-400} opacity={0.18} className="top-6" />
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        </div>

        <div className=" relative  ">
          <FadeIn y={20} scale={0.9} duration={0.5}>
          <div className="flex justify-center mb-6">
            <img src={support} alt="Pig Mascot" className="w-24 h-24 object-contain animate-bounce" />
          </div>
          </FadeIn>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-10 md:mb-16 uppercase leading-none tracking-[2px] max-w-6xl mx-auto drop-shadow-[4px_4px_0px_0px_#FF007F]">
              <span className="fading block mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"><WordReveal text="Supporting Creators!" stagger={0.08} /></span>
              <span className="fading block mb-2 animate-pulse drop-shadow-none"><WordReveal text="Empowering Supporters!" delay={0.2} stagger={0.08} wordClassName="text-gradient-wishlist" /></span>
              <span className="fading block text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" style={{WebkitTextStroke: '1px #000'}}><WordReveal text="Made for Everyone!" delay={0.4} stagger={0.08} /></span>
          </h2>
          
          {/* Rows of 4 drift in opposite directions, scrubbed to the scroll position */}
          {[supportData.slice(0, 4), supportData.slice(4)].map((row, rowIndex) => (
          <ScrollX
            key={rowIndex}
            from={rowIndex % 2 === 0 ? -110 : 110}
            to={rowIndex % 2 === 0 ? 55 : -55}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 max-w-7xl mx-auto px-3 mb-6 md:mb-16"
          >
            {row.map((item, index) => (
              <StaggerItem key={index} index={index} x={index % 2 === 0 ? 60 : -60} y={20} rotate={index % 2 === 0 ? 2 : -2} stagger={0.08} duration={0.6} className="group h-full">
              <TiltCard max={10} scale={1.03} className="rounded-[30px] h-full">
              <div
                  className="relative h-full bg-gray-900 rounded-[30px] border-2 p-6 md:p-7 flex flex-col items-start gap-4 text-left overflow-hidden"
                  style={{
                      borderColor: item.color,
                      boxShadow: `7px 7px 0 0 ${item.color}`
                  }}
              >
                {/* Corner glow */}
                <div
                  className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ background: item.color }}
                ></div>

                {/* Icon badge — sticker style */}
                <div
                  className="relative z-10 w-16 h-16 rounded-[18px] border-2 border-black shadow-black flex items-center justify-center -rotate-3 group-hover:rotate-3 transition-transform duration-300"
                  style={{ background: item.color }}
                >
                  <item.icon size={30} color={item.color === '#8C52FF' ? '#fff' : '#000'} />
                </div>

                <h3 className="relative z-10 leading-tight text-xl md:text-2xl uppercase font-gulfs text-white tracking-wide"
                    style={{ textShadow: `0 0 12px ${item.color}50` }}>
                  {item.title}
                </h3>

                <p className="relative z-10 text-base text-gray-300 leading-relaxed font-poppins font-medium group-hover:text-white transition-colors duration-300">
                  {item.description}
                </p>
              </div>
              </TiltCard>
            </StaggerItem>
            ))}
          </ScrollX>
          ))}
        </div>
      </section>
    </>
  )
}
