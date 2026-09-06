/**
 * The last few help answers this browser opened.
 *
 * 🚨 IT NEVER LEAVES THE DEVICE. There is no endpoint and no cookie: a list of
 * the help articles somebody has been reading is a list of the problems they are
 * having with their own account, and on a shared or public machine that is
 * exactly the sort of thing nobody expects a help centre to keep. Same rule, and
 * the same reasoning, as Discover's "Pick up where you left off".
 *
 * 🚨 EVERY READ AND WRITE GOES THROUGH `safeStorage`. Touching the
 * `localStorage` property itself THROWS a SecurityError when the browser refuses
 * site data — a sandboxed iframe, cookies blocked for the site, several in-app
 * webviews — and these calls sit on the article page's mount path.
 */
import { safeGet, safeSet } from "./safeStorage";

const KEY = "sp_help_recent_v1";

/** Deliberately small. A "recently viewed" list long enough to scroll is an archive. */
export const MAX_RECENTS = 5;

export function readHelpRecents() {
    try {
        const raw = safeGet(KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        // ⚠️ Every field is re-checked on the way OUT, not trusted because we
        // wrote it: this value survives deploys, so a shape change ships to
        // browsers already holding the old one.
        return parsed
            .filter((a) => a && typeof a.slug === "string" && typeof a.title === "string" && typeof a.category_slug === "string")
            .slice(0, MAX_RECENTS);
    } catch {
        return [];
    }
}

export function rememberHelpArticle(article) {
    if (!article?.slug || !article?.title || !article?.category_slug) return;

    const entry = {
        slug: article.slug,
        title: article.title,
        category_slug: article.category_slug,
        category_title: article.category_title ?? null,
    };

    const next = [entry, ...readHelpRecents().filter((a) => a.slug !== entry.slug)].slice(0, MAX_RECENTS);

    try {
        safeSet(KEY, JSON.stringify(next));
    } catch {
        // Storage full, or refused. The page is correct without it.
    }
}

export function clearHelpRecents() {
    safeSet(KEY, "[]");
}
