import spennys from "../../../assets/img/spennys.png";
import Lightbox from '../../includes/Lightbox'
import HeroWishlistImage from '../../../assets/new/HeroWishlist.png';

export default function LiveBarSection() {
  return (

    <div className='bg-black pt-4 mb-24'>
      <img
      className='w-full h-auto'
      src={HeroWishlistImage}
      alt="Wishlist image"
      />
    <p className='fading uppercase text-center mt-1.5 text-white font-poppins text-[10px] xl:text-[15px]'>*3 days Free trial and then requires a monthly £4 payment to cover stripe fees and compliance costs. </p>
     

    <div className='w-100 livebarsections-hidden '>
      <div className=' livebarsections pt-0 pt-md-5 mt-4 '>
        <div className='container px-4 w-100' >
          <h2 className='fading headingSm shadow-none text-light stroke-none text-center text-4xl md:text-5xl mb-1 pt-4 pt-lg-0' >What is spenny Piggy ? 🐷</h2>

           <Lightbox classes="m-auto d-table" text={<>
              <div data-aos="zoom-out" className="videoBg w-100 mt-3 rounded-5 shadow-mint" >
                <img alt={"image"}  className='rounded-5 shadow-mint' src={spennys} />
              </div>
           </>
           } images={[ { src: spennys }]} />
        </div>
      </div>
    </div>
    </div>
  )
}
