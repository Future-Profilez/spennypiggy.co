import { usePage } from "@inertiajs/react";

/**
 * What a reviewer asked this creator to change about their PROFILE.
 *
 * 🚨 THE PROP WAS BEING SENT AND DRAWN NOWHERE. `auth.user.edit_requested_reason`
 * shipped with the Daily Review feed's Request Edit action and had zero readers
 * in `resources/js` — the same class of fault as `SaveButton`'s dead `is_saved`
 * prop: nothing errors, nothing is missing, the fact is simply never rendered.
 * So a profile edit request reached the creator by e-mail and bell only, and the
 * live example was a bio a reviewer had asked to be rewritten.
 *
 * ⚠️ AMBER, NEVER RED. Red on this platform means a person said no; the profile
 * is still LIVE and still selling while the creator fixes it. It is a request,
 * not a takedown — `SuspendedBanner` beside it owns the red.
 *
 * ⚠️ OWNER-GATED BY ITS CALLER. `/{username}` is also the public profile, so the
 * mount carries `IsloggedIn` exactly as `SuspendedBanner` does — without it a
 * visitor would read what we asked of somebody else.
 *
 * ⚠️ Renders on the PRESENCE of the reason. The server sends null when there is
 * no request, so an always-sent object is one truthiness slip away from telling
 * every creator they have been asked to change something.
 */
export default function EditRequestNotice({ className = "" }) {
    const { auth } = usePage().props;
    const reason = auth?.user?.edit_requested_reason;

    if (!reason) return null;

    return (
        <div
            /* ⚠️ `border-[#E8B400]`, an ARBITRARY colour — so `border-2` is
               honoured. `border-black` is redefined in index.css as a full
               `border` shorthand and would silently reset the width. */
            className={`rounded-box border-2 border-[#E8B400] bg-[#FFF6DF] p-4 ${className}`}
            role="status"
        >
            <p className="text-[11px] font-black uppercase tracking-widest text-[#8A6A00]">
                Change requested
            </p>

            {/* `whitespace-pre-line`: a reviewer writes this by hand and their
                line breaks carry meaning. */}
            <p className="mt-1.5 whitespace-pre-line text-[15px] font-semibold leading-[1.5] text-black">
                {reason}
            </p>

            <p className="mt-2 text-[13px] font-medium leading-[1.5] text-[#8A6A00]">
                Your profile is still live. Update it and we will check it again.
            </p>
        </div>
    );
}
