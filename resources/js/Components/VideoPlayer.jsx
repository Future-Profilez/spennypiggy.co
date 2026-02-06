/**
 * Simple VideoPlayer Component
 * This is a placeholder component to resolve the build error
 */
const VideoPlayer = ({ src, poster, controls = true, autoPlay = false, className = '' }) => {
    return (
        <div className={`video-player-container ${className}`}>
            {src ? (
                <video
                    className="w-full h-auto rounded-xl  shadow-sm"
                    controls={controls}
                    autoPlay={autoPlay}
                    poster={poster}
                >
                    <source src={src} type="video/mp4" />
                    <source src={src} type="video/webm" />
                    <source src={src} type="video/ogg" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div className="bg-gray-100 p-8 rounded-xl  text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mt-2">Video Player</h3>
                    <p className="text-gray-600 mt-1">Video player functionality will be implemented here</p>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
