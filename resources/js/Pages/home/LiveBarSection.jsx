import spennys from "../../../assets/img/spennys.png";
import Lightbox from '../../includes/Lightbox'
import HeroWishlistImage from '../../../assets/new/HeroWishlist.png';
import ScrollX from '@/Components/animations/ScrollX';
import Parallax from '@/Components/animations/Parallax';
import Reveal3D from '@/Components/animations/Reveal3D';
import TiltCard from '@/Components/animations/TiltCard';

export default function LiveBarSection() {
  return (

    <section className='bg-black pb-14 md:pb-24 relative overflow-hidden'>
       {/* Decorative Background Elements */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 floating-shape"></div>
        </div>

      <div className="relative ">
        <img
        className='w-full h-auto'
        src={HeroWishlistImage}
        alt="Wishlist image"
        />
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

           <div className="max-w-4xl mx-auto">
           <Reveal3D rotate={35} y={70}>
           <TiltCard max={5} scale={1.01} className="rounded-[30px]">
           <Lightbox classes="mx-auto block" text={<>
              <div className="videoBg !h-auto w-full mt-3 rounded-[30px]   border-2 border-[#FF007F] shadow-[0_0_30px_rgba(236,72,153,0.3)] overflow-hidden group cursor-pointer" >
                <div className="relative">
                    <img alt={"image"}  className='w-full h-full' src={spennys} />
                    <div className="absolute  inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/50 group-hover:scale-110 transition-transform duration-300">
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                        </div>
                    </div>
                </div>
              </div>
           </>
           } images={[ { src: spennys }]} />
           </TiltCard>
           </Reveal3D>
           </div>
        </div>
      </div>
    </div>
    </section>
  )
}
