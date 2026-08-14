import PageCanvas from '@/Components/cinematic/PageCanvas';
import CreatorGuideLinks from './CreatorGuideLinks';
import SeeEverythingLink from './SeeEverythingLink';

/**
 * The shell every `/creators/*` paid-ads page renders inside.
 *
 * 🚨 ONE DARK FIELD BEHIND THE WHOLE PAGE, sections transparent — the same
 * arrangement as `Welcome.jsx`. `PageCanvas`'s own docblock is explicit that a
 * section must never carry its own background colour, because that cuts the
 * field in half and brings back the seam problem it exists to remove. These
 * pages were six flat mint pages, which is exactly that mistake six times.
 *
 * ⚠️ `includes/Header.jsx` is FIXED, so the shell owns the top clearance —
 * `pt-24 md:pt-28`. At `pt-8` a hero taller than the viewport ran up under the
 * header and lost its first rows.
 */
export default function AdPage({ children }) {
    return (
        <div className="relative min-h-dvh overflow-hidden bg-[#0B0B0C] font-sans">
            <PageCanvas />

            <div className="relative z-10">
                <div className="containerbox mx-auto pb-16 pt-24 md:pb-24 md:pt-28">
                    <SeeEverythingLink className="mb-10" />
                    {children}
                    <CreatorGuideLinks />
                </div>
            </div>
        </div>
    );
}
