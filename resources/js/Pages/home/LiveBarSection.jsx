import spennys from "../../../assets/img/spennys.png";
import Lightbox from '../../includes/Lightbox'
import WishlistShowcase from './WishlistShowcase';
import ScrollX from '@/Components/animations/ScrollX';
import Parallax from '@/Components/animations/Parallax';
import Reveal3D from '@/Components/animations/Reveal3D';
import TiltCard from '@/Components/animations/TiltCard';

export default function LiveBarSection() {
  return (

    <section className='bg-transparent pb-14 md:pb-24 relative overflow-hidden'>
       {/* Decorative Background Elements */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 floating-shape"></div>
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
            <Parallax speed={60} className="absolute right-[10%] bottom-[10%]">
              <span className="text-5xl inline-block rotate-6 opacity-80">🎁</span>
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
           <TiltCard max={4} scale={1.01} className="rounded-[24px]">
           <div className="relative rounded-[24px] border-2 border-black bg-[#0c0c14] overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.22)]">
              {/* browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-black/50 border-b-2 border-white/10">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
                <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
                <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
                <span className="ml-3 text-[11px] md:text-xs font-semibold text-white/55 bg-white/10 rounded-full px-3 py-1">spennypiggy.co</span>
              </div>
              {/* branded poster — click to play */}
              <Lightbox classes="block w-full" images={[{ src: spennys }]} text={<>
                <div className="relative aspect-video cursor-pointer group overflow-hidden"
                     style={{ background: "radial-gradient(120% 120% at 50% 0%, #2a0f4a 0%, #14082a 45%, #0c0c14 100%)" }}>
                    <span className="absolute top-6 left-8 text-3xl opacity-70 -rotate-12 select-none" aria-hidden>🎧</span>
                    <span className="absolute top-10 right-10 text-3xl opacity-70 rotate-12 select-none" aria-hidden>📱</span>
                    <span className="absolute bottom-10 left-12 text-3xl opacity-60 rotate-6 select-none" aria-hidden>🎁</span>
                    <span className="absolute bottom-8 right-14 text-2xl opacity-60 -rotate-6 select-none" aria-hidden>💸</span>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <span className="relative flex items-center justify-center w-20 h-20">
                            <span className="absolute inset-0 rounded-full bg-[#FF007F]/40 animate-ping"></span>
                            <span className="relative w-20 h-20 rounded-full bg-[#FF007F] border-2 border-black flex items-center justify-center shadow-[0_8px_30px_rgba(255,0,127,0.5)] group-hover:scale-110 transition-transform duration-300">
                                <span className="w-0 h-0 border-y-[11px] border-y-transparent border-l-[18px] border-l-white ml-1.5"></span>
                            </span>
                        </span>
                        <span className="text-white font-gulfs uppercase text-sm md:text-base tracking-wide">Watch the 60-second tour</span>
                    </div>
                    <span className="absolute bottom-4 right-4 text-[11px] font-black text-white bg-black/70 border border-white/20 rounded-full px-3 py-1">0:60</span>
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
