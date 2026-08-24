import { FaSearchPlus } from "react-icons/fa";
import spennys from "../../../assets/img/spennys.png";
import Lightbox from '../../includes/Lightbox'
import WishlistShowcase from './WishlistShowcase';
import ScrollX from '@/Components/animations/ScrollX';
import Parallax from '@/Components/animations/Parallax';
import Reveal3D from '@/Components/animations/Reveal3D';
import TiltCard from '@/Components/animations/TiltCard';

export default function LiveBarSection() {
  return (

    <section
      className='bg-transparent pb-14 md:pb-24 relative overflow-hidden'
    >
       {/* No ambient orbs here. `PageCanvas` is the page's one light source —
       a per-section orb bloomed where its section was and faded before
       the next, which is what made scrolling read as a row of coloured
       stops instead of one continuous field. */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        </div>

      <div className="relative container px-4 mx-auto pt-6 lg:pt-10">
        <WishlistShowcase />
      </div>


    <div className='w-full livebarsections-hidden relative'>
      <div className='pt-6 livebarsections pt-0 pt-md-5 mt-12 '>
        <div className='container px-4 w-full mx-auto relative' >

          {/* Side piggies drifting at different scroll speeds (desktop only) */}
          <div className="absolute inset-0 pointer-events-none select-none hidden lg:block" aria-hidden>
            <Parallax speed={90} className="absolute left-[4%] top-[30%]">
              <span className="text-6xl inline-block -rotate-12 opacity-80">🐷</span>
            </Parallax>
            <Parallax speed={-70} className="absolute right-[5%] top-[20%]">
              <span className="text-5xl inline-block rotate-12 opacity-80">💸</span>
            </Parallax>
            {/* ⚠️ Was 🎁 — a literal gift box, which is the framing every
                user-facing surface here is held away from. */}
            <Parallax speed={60} className="absolute right-[10%] bottom-[10%]">
              <span className="text-5xl inline-block rotate-6 opacity-80">🔓</span>
            </Parallax>
          </div>

          {/* Whole heading glides sideways with the scroll */}
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-4 uppercase leading-none' >
            <ScrollX as="span" from={-100} to={50} className="inline-block">
              What is <span className="text-gradient-wishlist">Spenny Piggy</span> ? 🐷
            </ScrollX>
          </h2>

           <div className="max-w-3xl mx-auto px-4">
           <Reveal3D rotate={18} y={60}>
           <TiltCard max={4} className="rounded-box">
           <div className="relative rounded-box border-2 border-black bg-[#0c0c14] overflow-hidden">
              {/* browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-black/50 border-b-2 border-white/10">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
                <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
                <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
                <span className="ml-3 text-[12px] font-semibold text-white/60 bg-white/10 rounded-full px-3 py-1">spennypiggy.co</span>
              </div>
              {/* branded poster — click to play */}
              <Lightbox classes="block w-full" images={[{ src: spennys }]} text={<>
                <div className="relative aspect-video cursor-pointer group overflow-hidden"
                     style={{ background: "radial-gradient(120% 120% at 50% 0%, #2a0f4a 0%, #14082a 45%, #0c0c14 100%)" }}>
                    {/* ⚠️ Content, not store goods. These were 🎧 📱 🎁 💸 — a
                        literal gift box and two products from the "anything from
                        any store" wishlist that is not built. The poster is the
                        first thing on the section that explains what the platform
                        IS, so it cannot illustrate something it does not do. */}
                    <span className="absolute top-6 left-8 text-3xl opacity-70 -rotate-12 select-none" aria-hidden>📸</span>
                    <span className="absolute top-10 right-10 text-3xl opacity-70 rotate-12 select-none" aria-hidden>🎬</span>
                    <span className="absolute bottom-10 left-12 text-3xl opacity-60 rotate-6 select-none" aria-hidden>🔓</span>
                    <span className="absolute bottom-8 right-14 text-2xl opacity-60 -rotate-6 select-none" aria-hidden>💸</span>
                    {/* 🚨 THE PLAY BUTTON AND THE "0:60" BADGE ARE GONE (21 Aug 2026).
                        There is no video. This drew browser chrome, a pulsing
                        `animate-ping` ring, a pink play triangle, the label "Watch
                        the 60-second tour" and a duration badge — and opened a
                        Lightbox containing ONE STILL IMAGE.

                        A play button is the most-clicked element on any landing
                        page, and this one sits in the middle of the page's longest
                        stretch without a signup CTA — so the highest-intent tap
                        available to a visitor spent their attention on a broken
                        promise. Trust does not recover from that inside one
                        session.

                        The frame still opens the screenshot full size, which is a
                        real and useful thing; it now says so. Restore the play
                        affordance and the badge together WITH the video, never
                        before it. */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <span className="relative w-16 h-16 rounded-full bg-[#FF007F] border-2 border-black flex items-center justify-center transition-[filter] duration-300 group-hover:brightness-110">
                            <FaSearchPlus className="text-black text-2xl" />
                        </span>
                        <span className="text-white font-gulfs uppercase text-sm md:text-base tracking-wide">See a creator page up close</span>
                    </div>
                </div>
              </>} />
           </div>
           </TiltCard>
           </Reveal3D>
           </div>
        </div>
      </div>
    </div>
    </section>
  )
}
