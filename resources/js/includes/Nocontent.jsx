import noresultimg from '../../assets/img/noresultimg.png' ;
import { Link } from '@inertiajs/react';

export default function Nocontent({
  error, showdiscover,
  text = "Nothing here yet",
  classes = "",
  subheading,
  actionHref,
  actionText,
  // A caller can supply its own CTA node (e.g. a Follow button) when a link
  // cannot express the action. Takes precedence over actionHref/actionText.
  action,
  illustrationSrc,
  discoverHref = "/discover",
  hideImage = false,
  size = "md",
  mode = "card"
}) {
  const headingClasses = {
    sm: "text-xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl"
  };
  
  const hSize = headingClasses[size] || headingClasses.md;
  const imgSrc = illustrationSrc || noresultimg;

  const cardClasses = ''

  return (
    <div className={`bg-white rounded-box !p-6 md:!p-12 overflow-hidden border-2 border-black w-full flex justify-center ${mode === "card" ? "p-4" : ""} ${classes}`}>
        <div className={`${cardClasses} flex flex-col items-center text-center max-w-lg w-full`}>
            {!hideImage && (
                <div className="mb-6">
                    <img 
                        className="w-30 h-24 md:w-32 md:h-32 object-contain motion-safe:animate-float" 
                        alt="No content" 
                        src={imgSrc} 
                    />
                </div>
            )}
            
            <h2 className={`font-anton tracking-[3px] uppercase ${mode === "card" ? "text-pink retro-text-glows" : "text-black"} ${hSize} mb-3 leading-tight`}>
                {text}
            </h2>
            
            {subheading && (
                <p className="font-sans text-black/80 text-base md:text-lg mb-6 max-w-sm mx-auto">
                    {subheading}
                </p>
            )}

            {action ? (
                <div className="flex w-full max-w-xs justify-center">{action}</div>
            ) : error ? (
                <Link 
                    href="/" 
                    className="inline-block bg-[#FF007F] text-black font-gulfs uppercase tracking-wider text-lg px-8 py-3 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                >
                    Back to Home
                </Link>
            ) : actionHref && actionText ? (
                <Link 
                    href={actionHref} 
                    className="inline-block bg-[#FF007F] text-black font-gulfs uppercase tracking-wider text-lg px-8 py-3 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                >
                    {actionText}
                </Link>
            ) : null}

            {showdiscover && <div className="mt-6 pt-4 text-sm md:text-base font-bold text-black/80 border-t-2 border-black/10 w-full">
                Can't find what you're looking for?{" "}
                <Link href={discoverHref} className="text-[#C4006A] underline font-black uppercase tracking-wider">
                    Explore Discover
                </Link>
                .
            </div>}
        </div>
    </div>
  )
}
