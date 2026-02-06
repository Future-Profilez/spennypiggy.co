import seek from "../../../assets/img/seeksearch.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function FunPart({imgbg, textcolor, mainbg, textbg, heading, eclasses, text, img, classes, reverse}) {
    return (
        <>

  <div className={`${classes} flex ${reverse ? "flex-row-reverse" : ''} ${mainbg ? mainbg : 'bg-black'} box-border justify-between items-center relative`}>
    {/* Decorative Background Elements if bg is black/default */}
    {!mainbg && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className={`absolute ${reverse ? 'bottom-0 left-0' : 'top-0 right-0'} w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 floating-shape`}></div>
        </div>
    )}
    <div  className={`${reverse ? 'border-r-2' : 'border-l-2'} border-black overflow-hidden ${eclasses} ${reverse ? "justify-start" : "justify-end"} pb-0 w-1/2 relative`}>
      <div className="w-full h-full">
        <LazyLoadImage
          alt="image" className='max-h-[600px] w-full h-full object-cover !bg-transparent'
          effect="blur"
          src={img || seek}
        />
      </div>
    </div>
    <div className={` ${reverse ? "justify-end" : "justify-start"} w-1/2 p-4 ${textbg}`}>
      <div className='max-w-[500px]'>
        <h3 className={`animate-fading text-2xl md:text-4xl lg:text-5xl font-gulfs ${textcolor || 'text-white'} mb-3 uppercase leading-tight`} >
          {heading}
        </h3>
      </div>
    </div>
  </div>
</>

    )
}
