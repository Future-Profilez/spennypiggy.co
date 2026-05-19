import seek from "../../../assets/img/seeksearch.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function FunPart({imgbg, textcolor, mainbg, textbg, heading, eclasses, text, img, classes, reverse, step}) {
    return (
        <>

  <div className={`${classes} md:flex ${reverse ? "flex-row-reverse" : ''} ${mainbg ? mainbg : 'bg-black'} box-border justify-between items-center relative`}>
    {!mainbg && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className={`absolute ${reverse ? 'bottom-0 left-0' : 'top-0 right-0'} w-96 h-96 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-3xl opacity-10 floating-shape`}></div>
        </div>
    )}
    <div  className={`${reverse ? 'border-r-2' : 'border-l-2'} border-black overflow-hidden ${eclasses} ${reverse ? "justify-start" : "justify-end"} pb-0 md:w-1/2 relative`}>
      <div className="w-full h-full">
        <LazyLoadImage
          alt="image" className='max-h-[600px] w-full h-full object-cover !bg-transparent'
          src={img || seek}
        />
      </div>
    </div>
    <div className={` ${reverse ? "justify-end" : "justify-start"} md:w-1/2 p-4 ${textbg}`}>
      <div className='max-w-[700px]  p-[20px] md:p-[30px]  lg:p-[50px] xl:p-[70px] '>
        {step && (
            <div className={`text-2xl font-bold mb-4 tracking-wider uppercase font-gulfs ${textcolor || 'text-white'}`}>
                {step}
            </div>
        )}
        <h3 className={`animate-fading text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl  
           font-gulfs ${textcolor || 'text-white'} mb-3 uppercase leading-tight`} >
          {heading}
        </h3>
        {text && (
            <div className={`text-lg leading-relaxed ${textcolor || 'text-white'}`} dangerouslySetInnerHTML={{ __html: text }} />
        )}
      </div>
    </div>
  </div>
</>

    )
}
