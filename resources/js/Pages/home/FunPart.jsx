import seek from "../../../assets/img/seeksearch.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function FunPart({imgbg, textcolor, mainbg, textbg, heading, eclasses, text, img, classes, reverse}) {
    return (
        <>
  <style jsx>{`
    .box-s {
      border-${reverse ? "right" : "left"}: 2px solid #000;
      overflow: hidden; /* Prevent image from spilling out */
    }
    .image-container {
      width: 100%;
      height: 100%;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: transparent !important; /* Remove image background if any */
    }
  `}</style>

  <div className={`${classes} flex ${reverse ? "col-reverse" : ''} ${mainbg ? mainbg : 'bg-black'} flex borderbox justify-between items-center relative overflow-hidden`}>
    {/* Decorative Background Elements if bg is black/default */}
    {!mainbg && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className={`absolute ${reverse ? 'bottom-0 left-0' : 'top-0 right-0'} w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 floating-shape`}></div>
        </div>
    )}
    <div  className={` box-s ${eclasses} ${reverse ? "justify-content-start" : "justify-content-end"} pb-0 w-50 relative`}>
      <div className="image-container">
        <LazyLoadImage
          alt="image" className='max-h-[600px]'
          effect="blur"
          src={img || seek}
        />
      </div>
    </div>
    <div className={` box-e ${reverse ? "justify-content-end" : "justify-content-start"} w-50 p-4 ${textbg}`}>
      <div className='max-width-500'>
        <h3 className={`fading text-2xl md:text-4xl lg:text-5xl font-gulfs ${textcolor || 'text-white'} mb-3 uppercase leading-tight`} >
          {heading}
        </h3>
      </div>
    </div>
  </div>
</>

    )
}
