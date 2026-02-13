{{-- Critical CSS for Profile Pages - Inline for fastest render --}}
<style>
/* Critical Profile Page Styles - Above the fold content only */

/* Layout basics */
.containerbox { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.relative { position: relative; }
.absolute { position: absolute; }
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.block { display: block; }

/* Profile header critical styles */
.wishbanner {
    position: relative;
    margin-bottom: 2rem;
}

.wishbanner img:not(.banner) {
    width: 100%;
    height: 400px;
    object-fit: cover;
    border-radius: 30px;
    border: 2px solid #000;
}

/* User profile picture */
.userphoto {
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid #fff;
    overflow: hidden;
    background: #fff;
}

.userphoto img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Navigation tabs */
.newnav-tabs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    margin-bottom: 1rem;
}

.newnav-tabs .flex {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.newnav-tabs .flex::-webkit-scrollbar {
    display: none;
}

.newnav-tabs a {
    padding: 0.5rem 0;
    margin-right: 2rem;
    border-bottom: 2px solid transparent;
    color: #9CA3AF;
    text-decoration: none;
    text-transform: uppercase;
    font-weight: 500;
    transition: all 0.2s;
    white-space: nowrap;
}

.newnav-tabs a.active,
.newnav-tabs a:hover {
    color: #EC4899;
    border-bottom-color: #EC4899;
}

/* Grid layouts for content */
.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
}

.grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
}

.grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
}

/* Card components */
.shadow-pinks {
    box-shadow: 0 10px 15px -3px rgba(236, 72, 153, 0.1), 0 4px 6px -2px rgba(236, 72, 153, 0.05);
}

.rounded-[30px] md:rounded-[40px] 3 {
    border-radius: 23px;
}

.border-pink-500 {
    border-color: #EC4899;
}

/* Typography */
.text-pink-600 {
    color: #DB2777;
}

.text-gray-400 {
    color: #9CA3AF;
}

.text-gray-800 {
    color: #1F2937;
}

.font-bold {
    font-weight: 700;
}

.font-poppins {
    font-family: 'Poppins', system-ui, -apple-system, sans-serif;
}

/* Loading states */
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: .5;
    }
}

/* Fast tab renderer critical styles */
.fast-tab-renderer {
    min-height: 60vh;
    position: relative;
}

.fast-tab-renderer > div {
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .containerbox {
        padding: 0 0.5rem;
    }
    
    .wishbanner img:not(.banner) {
        height: 250px;
        border-radius: 20px;
    }
    
    .userphoto {
        width: 80px;
        height: 80px;
        bottom: -30px;
    }
    
    .grid-cols-2 {
        gap: 0.5rem;
    }
    
    .grid-cols-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }
    
    .grid-cols-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }
    
    .newnav-tabs a {
        margin-right: 1rem;
        font-size: 0.875rem;
    }
}

/* Large screens */
@media (min-width: 1024px) {
    .grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    
    .grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

/* XL screens */
@media (min-width: 1280px) {
    .grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

/* Performance optimization */
* {
    box-sizing: border-box;
}

img {
    max-width: 100%;
    height: auto;
}

/* Prevent layout shifts */
.wishlistcntbox {
    contain: layout style;
}

/* Hardware acceleration for transforms */
.fast-tab-renderer > div {
    will-change: transform, opacity;
    transform: translateZ(0);
}

/* Preload font display */
@font-face {
    font-family: 'CeraGR';
    font-display: swap;
    src: url('/build/assets/CeraGRMedium.woff2') format('woff2');
    font-weight: 400;
}

@font-face {
    font-family: 'CeraGR';
    font-display: swap;
    src: url('/build/assets/CeraGRBold.woff2') format('woff2');
    font-weight: 700;
}
</style>
