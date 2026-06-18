import seek from "../../../assets/img/seeksearch.png";
import FadeIn from '@/Components/animations/FadeIn';
import Parallax from '@/Components/animations/Parallax';
import Reveal3D from '@/Components/animations/Reveal3D';

export default function FunPart({imgbg, textcolor, mainbg, textbg, heading, eclasses, text, img, classes, reverse, step, mockup}) {
    return (
        <>

  <div className={`${classes} md:flex ${reverse ? "flex-row-reverse" : ''} ${mainbg ? mainbg : 'bg-black'} box-border justify-between items-stretch relative`}>
    {!mainbg && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className={`absolute ${reverse ? 'bottom-0 left-0' : 'top-0 right-0'} w-96 h-96 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-3xl opacity-10 floating-shape`}></div>
        </div>
    )}
    <FadeIn x={reverse ? -60 : 60} y={0} duration={0.7} className={`${reverse ? 'border-r-2' : 'border-l-2'} border-black overflow-hidden ${eclasses} ${reverse ? "justify-start" : "justify-end"} pb-0 md:w-1/2 relative`}>
      {mockup ? (
        <div className="funviz relative w-full h-full min-h-[380px] md:min-h-[520px] flex items-center justify-center overflow-hidden">
          <div className="funfloat relative z-10">{mockup}</div>
        </div>
      ) : (
        <div className="w-full h-full overflow-hidden">
          <Parallax speed={35} className="w-full h-full">
            {/* eager native img — these panels sit just below the fold and must
                never show an empty side while a lazy loader kicks in */}
            <img
              alt="image" className='max-h-[600px] w-full h-full object-cover !bg-transparent scale-110'
              src={img || seek}
              loading="eager"
              decoding="async"
            />
          </Parallax>
        </div>
      )}
    </FadeIn>
    <div className={`flex items-center ${reverse ? "justify-end" : "justify-start"} md:w-1/2 p-4 ${textbg}`}>
      <div className='max-w-[700px]  p-[20px] md:p-[30px]  lg:p-[50px] xl:p-[70px] '>
        {step && (
            <FadeIn delay={0.1}>
                <div className={`text-2xl font-bold mb-4 tracking-wider uppercase font-gulfs ${textcolor || 'text-white'}`}>
                    {step}
                </div>
            </FadeIn>
        )}
        <Reveal3D delay={0.15} rotate={30} y={40}>
            <h3 className={`animate-fading text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
               font-gulfs ${textcolor || 'text-white'} mb-3 uppercase leading-tight`} >
              {heading}
            </h3>
        </Reveal3D>
        {text && (
            <FadeIn delay={0.35} y={20}>
                <div className={`text-lg leading-relaxed ${textcolor || 'text-white'}`} dangerouslySetInnerHTML={{ __html: text }} />
            </FadeIn>
        )}
      </div>
    </div>
  </div>
</>

    )
}
