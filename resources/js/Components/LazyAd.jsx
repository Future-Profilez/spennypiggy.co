import React, { useEffect, useRef } from 'react';
import scriptManager from '../utils/thirdPartyScriptManager';

/**
 * LazyAd Component
 * 
 * Example implementation of lazy-loaded advertisements and third-party iframes
 * using the third-party script governance manager.
 */
export default function LazyAd({ 
    src, 
    width = 300, 
    height = 250, 
    type = 'iframe',
    className = '',
    placeholder = 'Advertisement loading...',
    importance = 'low',
    ...props 
}) {
    const containerRef = useRef(null);
    const adRef = useRef(null);

    useEffect(() => {
        if (!src || !containerRef.current) return;

        if (type === 'iframe') {
            // Create lazy iframe using script manager
            const iframe = scriptManager.createLazyIframe({
                dataSrc: src,
                container: containerRef.current,
                attributes: {
                    width,
                    height,
                    importance,
                    loading: 'lazy',
                    className: `${className} lazy-ad-iframe`,
                    frameBorder: '0',
                    scrolling: 'no',
                    ...props
                }
            });

            adRef.current = iframe;
        } else if (type === 'script') {
            // Load ad script lazily
            const loadAdScript = async () => {
                try {
                    await scriptManager.lazyLoadScript({
                        id: `ad-script-${Date.now()}`,
                        src,
                        importance,
                        delay: 3000, // Load ads after 3 seconds
                        events: ['scroll', 'click', 'touchstart']
                    });
                } catch (error) {
                    console.warn('Failed to load ad script:', error);
                }
            };

            loadAdScript();
        }

        return () => {
            // Cleanup if needed
            if (adRef.current && adRef.current.parentNode) {
                adRef.current.parentNode.removeChild(adRef.current);
            }
        };
    }, [src, type, width, height, importance, className]);

    return (
        <div 
            ref={containerRef}
            className={`lazy-ad-container ${className}`}
            style={{ 
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                minHeight: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '4px'
            }}
            {...props}
        >
            {/* Placeholder content while ad loads */}
            <div className="ad-placeholder text-gray-500 text-sm">
                {placeholder}
            </div>
        </div>
    );
}

/**
 * GoogleAdsense Component
 * Specialized component for Google AdSense ads with lazy loading
 */
export function GoogleAdsense({ 
    client, 
    slot, 
    width = 300, 
    height = 250,
    className = '',
    format = 'auto',
    responsive = true 
}) {
    const adRef = useRef(null);

    useEffect(() => {
        if (!client || !slot) return;

        const loadGoogleAds = async () => {
            try {
                // Load Google AdSense script lazily
                await scriptManager.lazyLoadScript({
                    id: 'google-adsense',
                    src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
                    importance: 'low',
                    delay: 4000,
                    events: ['scroll', 'click'],
                    attributes: {
                        'data-ad-client': client,
                        async: true
                    }
                });

                // Initialize ad after script loads
                if (window.adsbygoogle && adRef.current) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (error) {
                console.warn('Failed to load Google AdSense:', error);
            }
        };

        loadGoogleAds();
    }, [client, slot]);

    return (
        <div className={`google-adsense-container ${className}`}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ 
                    display: 'block',
                    width: typeof width === 'number' ? `${width}px` : width,
                    height: typeof height === 'number' ? `${height}px` : height
                }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? 'true' : 'false'}
            />
        </div>
    );
}

/**
 * SocialEmbed Component
 * For lazy loading social media embeds (Twitter, Facebook, etc.)
 */
export function SocialEmbed({ 
    platform, 
    embedId, 
    width = 400, 
    height = 300,
    className = '' 
}) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!platform || !embedId || !containerRef.current) return;

        const loadSocialEmbed = () => {
            let embedUrl = '';
            let scriptSrc = '';

            switch (platform.toLowerCase()) {
                case 'twitter':
                    embedUrl = `https://platform.twitter.com/embed/Tweet.html?id=${embedId}`;
                    scriptSrc = 'https://platform.twitter.com/widgets.js';
                    break;
                case 'facebook':
                    embedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(embedId)}`;
                    break;
                case 'instagram':
                    embedUrl = `https://www.instagram.com/p/${embedId}/embed/`;
                    break;
                default:
                    console.warn(`Unsupported platform: ${platform}`);
                    return;
            }

            if (scriptSrc) {
                // Load social platform script
                scriptManager.lazyLoadScript({
                    id: `${platform}-embed`,
                    src: scriptSrc,
                    importance: 'low',
                    delay: 5000,
                    events: ['scroll', 'click', 'touchstart']
                });
            }

            if (embedUrl) {
                // Create lazy iframe for embed
                scriptManager.createLazyIframe({
                    dataSrc: embedUrl,
                    container: containerRef.current,
                    attributes: {
                        width,
                        height,
                        importance: 'low',
                        loading: 'lazy',
                        className: `${className} social-embed`,
                        frameBorder: '0',
                        scrolling: 'no'
                    }
                });
            }
        };

        loadSocialEmbed();
    }, [platform, embedId, width, height]);

    return (
        <div 
            ref={containerRef}
            className={`social-embed-container ${className}`}
            style={{ 
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                minHeight: '100px',
                backgroundColor: '#f9f9f9',
                border: '1px solid #e1e1e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div className="text-gray-500 text-sm">
                Loading {platform} embed...
            </div>
        </div>
    );
}

/**
 * Usage Examples:
 * 
 * // Basic lazy iframe ad
 * <LazyAd 
 *   src="https://example.com/ad-iframe"
 *   width={300}
 *   height={250}
 *   type="iframe"
 * />
 * 
 * // Google AdSense
 * <GoogleAdsense
 *   client="ca-pub-xxxxxxxxxx"
 *   slot="1234567890"
 *   width={728}
 *   height={90}
 * />
 * 
 * // Twitter embed
 * <SocialEmbed
 *   platform="twitter"
 *   embedId="1234567890"
 *   width={500}
 *   height={400}
 * />
 */
