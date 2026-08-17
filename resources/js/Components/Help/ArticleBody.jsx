/**
 * Renders an article's HTML.
 *
 * 🚨 The HTML comes from App\Support\HelpMarkdown, which renders Markdown with
 * `html_input => strip` and `allow_unsafe_links => false`. That server-side
 * stripping is what makes this injection safe — do NOT start passing HTML from
 * anywhere else into this component.
 *
 * ⚠️ `leading-*` in this project means PIXELS, not Tailwind's ratio:
 * tailwind.config.js extends lineHeight with numeric keys mapped to px, which
 * OVERRIDES Tailwind's own scale. `leading-7` is 7px, and 15px paragraphs then
 * render on top of each other. Use an arbitrary value.
 */
export default function ArticleBody({ html, className = "" }) {
    if (!html) return null;

    return (
        <div
            className={`help-prose text-[15px] leading-[1.65] text-black/80 ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
