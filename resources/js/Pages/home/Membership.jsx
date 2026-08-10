import LiveBar from '@/includes/LiveBar'
import support from '../../../assets/new/Support.png'
import FadeIn from '@/Components/animations/FadeIn'
import StaggerItem from '@/Components/animations/StaggerItem'

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

// Canonical brand accent trio — cycled across sibling cards
const trio = ["#FF007F", "#E6EA7B", "#05EFB8"];

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
      <section className='relative bg-transparent py-12 md:py-28 px-4 overflow-hidden'>
        {/* single faint brand glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF007F] rounded-full blur-[140px] opacity-[0.08] z-0"></div>

        <div className='relative max-w-6xl mx-auto z-10'>
          <p className="text-center font-gulfs uppercase tracking-[3px] text-[11px] text-[#FF007F] mb-4">
            Premium
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase tracking-tight leading-tight">
            Premium Membership
          </h2>
          <FadeIn y={20} delay={0.15}>
            <p className='max-w-4xl text-white/70 m-auto text-center text-base md:text-xl leading-relaxed mb-8 md:mb-12'>Discover a hassle-free way to enhance your earnings potential. Enjoy zero fees for fans, with creators keeping 100% of their earnings. Access premium features, including enhanced chargeback protection. Cancel anytime. Join us today!</p>
          </FadeIn>
        </div>

        <div className='relative max-w-6xl mx-auto z-10'>
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-0">
            <LiveBar reps={20} color={`yellowbg`} classes={''} text={"  Coming Soon      "} />
          </div>

          <div className='membership-image py-2 px-4 mx-auto flex justify-center max-w-5xl mt-3 relative z-10'>
            <div className="relative w-full bg-[#0d0a16] border-2 border-[#FF007F] rounded-[24px] p-6 md:p-8">
              <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-[#E6EA7B] border-2 border-black grid place-items-center text-black">
                    <FaCrown size={20} />
                  </span>
                  <div className="text-left leading-tight">
                    <p className="font-gulfs uppercase text-white text-lg md:text-xl tracking-tight">Membership tiers</p>
                    <p className="text-[11px] font-gulfs uppercase tracking-[2px] text-white/60">Set your own perks &amp; price</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-black bg-[#05EFB8] rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>0% fan fees
                </span>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                {[
                  { name: 'Supporter', price: '£3', accent: '#05EFB8', perks: ['Member-only posts', 'Community shoutout'] },
                  { name: 'Super Fan', price: '£8', accent: '#FF007F', popular: true, perks: ['Everything in Supporter', 'Monthly video call', 'Early access drops'] },
                  { name: 'VIP', price: '£20', accent: '#E6EA7B', perks: ['Everything in Super Fan', '1:1 requests', 'Name in the credits'] },
                ].map((t, i) => (
                  <div
                    key={i}
                    className={`relative bg-[#0d0a16] border-2 rounded-[24px] p-5 text-left flex flex-col ${t.popular ? 'md:-translate-y-2' : ''}`}
                    style={{ borderColor: t.accent }}
                  >
                    {t.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase tracking-wide text-black bg-[#E6EA7B] border-2 border-black rounded-full px-3 py-0.5 whitespace-nowrap">Most popular</span>
                    )}
                    <p className="font-gulfs uppercase text-white text-lg tracking-tight">{t.name}</p>
                    <p className="mt-1 mb-4">
                      <span className="font-gulfs text-3xl md:text-[34px] leading-none" style={{ color: t.accent }}>{t.price}</span>
                      <span className="text-white/55 font-bold text-[12px]"> /mo</span>
                    </p>
                    <ul className="space-y-2 mb-5">
                      {t.perks.map((p, j) => (
                        <li key={j} className="flex items-start gap-2 text-[12.5px] font-semibold text-white/70 leading-snug">
                          <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full grid place-items-center text-[11px] text-black" style={{ background: t.accent }}>✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`mt-auto w-full rounded-full py-2.5 text-[12px] font-black uppercase tracking-wide border-2 border-black transition-transform hover:-translate-y-0.5 ${t.popular ? 'text-white' : 'text-black'}`}
                      style={{ background: t.accent }}
                    >
                      Join {t.name}
                    </button>
                  </div>
                ))}
              </div>

              <p className="relative mt-6 text-center text-[12px] font-semibold text-white/60">
                Fans pay zero fees. You keep <span className="text-white font-black">100%</span> of every membership. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id='features' className="relative bg-black py-12 md:py-28 px-4 text-center overflow-hidden">
        {/* single faint brand glow */}
        <div className="pointer-events-none absolute bottom-10 right-10 w-96 h-96 bg-[#FF007F] rounded-full blur-[140px] opacity-[0.08] z-0"></div>

        <div className="relative z-10">
          <FadeIn y={20} scale={0.9} duration={0.5}>
            <div className="flex justify-center mb-6">
              <img src={support} alt="Pig Mascot" className="w-24 h-24 object-contain" loading="lazy" decoding="async" />
            </div>
          </FadeIn>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-10 md:mb-16 uppercase leading-none tracking-tight max-w-6xl mx-auto">
            <span className="block mb-2">Supporting Creators!</span>
            <span className="block mb-2">Empowering Supporters!</span>
            <span className="block">Made for Everyone!</span>
          </h2>

          {[supportData.slice(0, 4), supportData.slice(4)].map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-3 mb-6 md:mb-8"
            >
              {row.map((item, index) => {
                const accent = trio[(rowIndex * 4 + index) % 3];
                return (
                  <StaggerItem key={index} index={index} y={20} stagger={0.08} duration={0.6} className="h-full">
                    <div
                      className="relative h-full bg-[#0d0a16] border-2 rounded-[24px] p-6 md:p-8 flex flex-col items-start gap-4 text-left"
                      style={{ borderColor: accent }}
                    >
                      <div
                        className="w-16 h-16 rounded-[18px] border-2 border-black flex items-center justify-center"
                        style={{ background: accent }}
                      >
                        <item.icon size={30} color="#000" />
                      </div>

                      <h3 className="leading-tight text-xl md:text-2xl uppercase font-gulfs text-white tracking-tight">
                        {item.title}
                      </h3>

                      <p className="text-base text-white/70 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
