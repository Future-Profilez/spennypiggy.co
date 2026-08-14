import publish from '../../../assets/img/publish.png'
import { LazyLoadImage } from 'react-lazy-load-image-component'

export default function ForCreators() {
  return (
    <div className='bg-gray-900 py-12 md:py-28 relative overflow-hidden' >
       
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF007F] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
        </div>

       <div className='containerbox relative z-10' >

       <div className='mt-2 mt-sm-5  pt-5 text-center' >
            <h2 className='text-3xl md:text-4xl lg:text-5xl font-gulfs text-white mb-6 uppercase leading-tight' >
                Publish your <span className="text-gradient-wishlist">best Work</span>
            </h2>
            <p className='max-w-4xl mx-auto text-gray-300 text-xl md:text-2xl font-medium leading-relaxed mb-12' >
                Spenny Piggy makes it super easy to receive financial support, offer bespoke memberships & publish free and exclusive content!
            </p>

        <div className='publish-image max-w-5xl mx-auto relative group' >
             <div className="absolute inset-0 bg-gradient-to-b from-[#FF007F] to-[#05EFB8] rounded-box transform scale-105 opacity-50 blur-2xl group-hover:opacity-70 transition-opacity duration-500"></div>
            <div className="relative rounded-box overflow-hidden border-2 border-gray-800 bg-gray-800">
                <LazyLoadImage
                    alt={"image"} className="max-w-full w-full h-auto"

                    effect="blur"

                    src={publish}
                    width={799}
                    height={522}
                />
            </div>
          </div>

       </div>


       </div>

    </div>
  )
}
