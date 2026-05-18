import noresultimg from '../../assets/img/noresultimg.png' ;
import { Link } from '@inertiajs/react';

export default function Nocontent({
  error,
  text = "Nothing to see",
  classes = "",
  subheading,
  actionHref,
  actionText,
  illustrationSrc,
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
    <div className={`w-full flex justify-center ${mode === "card" ? "p-4" : ""} ${classes}`}>
        <div className={`${cardClasses} flex flex-col items-center text-center max-w-lg w-full`}>
            {!hideImage && (
                <div className="mb-6">
                    <img 
                        className="w-30 h-24 30:w-32 md:h-32 object-contain animate-float" 
                        alt="No content" 
                        src={imgSrc} 
                    />
                </div>
            )}
            
            <h2 className={`font-anton !text-xl tracking-[3px] uppercase ${mode === "card" ? "text-pink retro-text-glows" : "text-black"} ${hSize} mb-3 leading-tight`}>
                {text} !!
            </h2>
            
            {subheading && (
                <p className="font-sans text-gray-600 text-base md:text-lg mb-6 max-w-sm mx-auto">
                    {subheading}
                </p>
            )}

            {error ? (
                <Link 
                    href="/" 
                    className="inline-block bg-[#FF007F] text-white font-gulfs uppercase tracking-wider text-lg px-8 py-3 rounded-full border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                    Back to Home
                </Link>
            ) : actionHref && actionText ? (
                <Link 
                    href={actionHref} 
                    className="inline-block bg-[#FF007F] text-white font-gulfs uppercase tracking-wider text-lg px-8 py-3 rounded-full border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                    {actionText}
                </Link>
            ) : null}
        </div>
    </div>
  )
}
