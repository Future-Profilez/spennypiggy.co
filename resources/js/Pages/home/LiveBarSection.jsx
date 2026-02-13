import spennys from "../../../assets/img/spennys.png";
import Lightbox from '../../includes/Lightbox'
import HeroWishlistImage from '../../../assets/new/HeroWishlist.png';

export default function LiveBarSection() {
  return (

    <section className='bg-black pb-24 relative overflow-hidden'>
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
        <p className='uppercase text-center mt-4 text-gray-400 font-poppins text-[10px] xl:text-[15px] tracking-wider'>*3 days Free trial and then requires a monthly £4 payment to cover stripe fees and compliance costs. </p>
      </div>
     

    <div className='w-full livebarsections-hidden relative'>
      <div className=' livebarsections pt-0 pt-md-5 mt-12 '>
        <div className='container px-4 w-full' >
          <h2 className='text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-4 uppercase leading-none' >
            What is <span className="text-gradient-wishlist">Spenny Piggy</span> ? 🐷
          </h2>

           <Lightbox classes="mx-auto block" text={<>
              <div className="videoBg !h-auto w-full mt-3 rounded-[30px] md:rounded-[40px]  border-2 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)] overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform duration-300" >
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
        </div>
      </div>
    </div>
    </section>
  )
}
