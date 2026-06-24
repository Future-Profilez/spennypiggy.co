import React from "react";
import { useVideoPoster } from "../utils/videoPoster";

/**
 * Drop-in <video> that resolves a real poster lazily (Uploadcare thumbnail,
 * avatar fallback) and never preloads bytes until the user plays it.
 *
 * @param {string} src        Video URL (also used to derive the poster UUID).
 * @param {string} posterSrc  URL to derive the poster from when the video uses
 *                            <source> children instead of a src attribute.
 * @param {string} fallback   Poster shown until the real one is ready (avatar/default).
 */
export default function LazyVideo({ src, posterSrc, fallback = null, children, ...rest }) {
    const poster = useVideoPoster(posterSrc || src, fallback);
    return (
        <video preload="none" poster={poster || undefined} src={src} {...rest}>
            {children}
        </video>
    );
}
