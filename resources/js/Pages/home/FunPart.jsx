import seek from "../../../assets/img/seeksearch.png";
import FadeIn from '@/Components/animations/FadeIn';
import Parallax from '@/Components/animations/Parallax';
import Reveal3D from '@/Components/animations/Reveal3D';

/* Cinematic story: the heading's beats become a numbered, 3D-revealed storyboard. */
function Story({ items, textcolor }) {
    const ink = textcolor || 'text-white';
    return (
        <div className="relative">
            <FadeIn delay={0.05}>
                <p className={`text-[12px] md:text-xs font-black uppercase tracking-[0.22em] ${ink} opacity-60 mb-6`}>
                    Your page, in three moves
                </p>
            </FadeIn>
            <ol className="relative">
                {items.map((s, i) => (
                    <Reveal3D key={i} delay={0.12 + i * 0.16} rotate={24} y={40}>
                        <li className="relative flex items-start gap-4 md:gap-6 pb-7 md:pb-9 last:pb-0">
                            {/* connector rail */}
                            {i < items.length - 1 && (
                                <span className={`absolute left-[18px] md:left-[26px] top-[42px] md:top-[56px] bottom-2 w-[3px] ${ink === 'text-black' ? 'bg-black/20' : 'bg-white/20'}`} aria-hidden="true" />
                            )}
                            <span className={`relative shrink-0 font-gulfs text-[38px] md:text-[54px] leading-[0.8] ${ink} w-9 md:w-[52px] text-center`}>
                                {i + 1}
                            </span>
                            <div className="pt-1 md:pt-1.5 min-w-0">
                                <h3 className={`font-gulfs uppercase text-2xl md:text-4xl leading-[1.02] ${ink}`}>{s.title}</h3>
                                {s.text && (
                                    <p className={`mt-2 text-sm md:text-lg font-semibold ${ink} opacity-70 max-w-[34ch] leading-snug`}>{s.text}</p>
                                )}
                            </div>
                        </li>
                    </Reveal3D>
                ))}
            </ol>
        </div>
    );
}

export default function FunPart({imgbg, textcolor, mainbg, textbg, heading, eclasses, text, img, classes, reverse, step, mockup, story}) {
    return (
        <>

  <div className={`${classes} md:flex ${reverse ? "flex-row-reverse" : ''} ${mainbg ? mainbg : 'bg-black'} box-border justify-between items-stretch relative`}>
    {!mainbg && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className={`absolute ${reverse ? 'bottom-0 left-0' : 'top-0 right-0'} w-96 h-96 bg-[#FF007F] rounded-full mix-blend-screen filter blur-3xl opacity-10 floating-shape`}></div>
        </div>
    )}
    <FadeIn x={reverse ? -60 : 60} y={0} duration={0.7} className={`${reverse ? 'border-r-2' : 'border-l-2'} border-black overflow-hidden ${eclasses} ${reverse ? "justify-start" : "justify-end"} pb-0 md:w-1/2 relative`}>
      {mockup ? (
        <div className="funviz relative w-full h-full min-h-[440px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* depth: brand glow + masked grid fills the panel so the mockup feels staged, not floating in a void */}
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 46%, rgba(255,0,127,0.22), transparent 62%)" }}></div>
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "38px 38px", maskImage: "radial-gradient(circle at 50% 46%, black, transparent 72%)", WebkitMaskImage: "radial-gradient(circle at 50% 46%, black, transparent 72%)" }}></div>
          <div className="funfloat relative z-10 scale-[1.06] md:scale-[1.22] drop-shadow-[0_36px_70px_rgba(0,0,0,0.55)]">{mockup}</div>
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
        {story ? (
            <Story items={story} textcolor={textcolor} />
        ) : (
            <Reveal3D delay={0.15} rotate={30} y={40}>
                <h3 className={`animate-fading text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
                   font-gulfs ${textcolor || 'text-white'} mb-3 uppercase leading-tight`} >
                  {heading}
                </h3>
            </Reveal3D>
        )}
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
