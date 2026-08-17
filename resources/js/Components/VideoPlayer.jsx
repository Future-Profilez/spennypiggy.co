import wishlistbannerimg from "../../assets/img/wishlistbannerimg.png";

/**
 * Simple VideoPlayer Component
 * This is a placeholder component to resolve the build error
 */
const VideoPlayer = ({ src, poster, controls = true, autoPlay = false, className = '' }) => {
    return (
        <div className={`video-player-container ${className}`}>
            {src ? (
                <video
                    className="w-full h-auto rounded-box border-[3px] border-black"
                    controls={controls}
                    autoPlay={false}
                    preload="none"
                    poster={poster}
                >
                    <source src={src} type="video/mp4" />
                    <source src={src} type="video/webm" />
                    <source src={src} type="video/ogg" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div className="relative aspect-video bg-gray-100 rounded-box border-[3px] border-black overflow-hidden group cursor-pointer">
                    <div className='absolute top-3 left-3 z-10 bg-white/90 px-3 py-1 rounded-full border-2 border-black text-[12px] font-black uppercase tracking-tight '>
                        Intro video
                    </div>
                    
                    <img 
                        src={poster || wishlistbannerimg} 
                        alt="Video placeholder" 
                        className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-300"
                        onError={(e) => {
                          if (e.target.src !== wishlistbannerimg) {
                            e.target.src = wishlistbannerimg;
                          }
                        }}
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-[#FF007F] rounded-full flex items-center justify-center border-[3px] border-black transition-colors duration-200 group-hover:brightness-110">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5V19L19 12L8 5Z" fill="black"/>
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
