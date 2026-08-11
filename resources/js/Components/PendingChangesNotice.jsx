const LABELS = {
    avatar: "profile photo",
    cover: "cover banner",
    bio: "bio",
    socials: "social handles",
};

/**
 * "You changed this, and what everyone else sees has not changed yet."
 *
 * An edit to something already published leaves the approved version on the
 * profile until an admin decides. That is the right behaviour — nobody sees
 * unreviewed content, and a refusal costs the creator nothing — but without
 * saying so the creator uploads a new photo, lands back on their own profile,
 * sees the old one, and uploads it again.
 *
 * ⚠️ Owner-only. `pending_profile_changes` is sent by the profile controller
 * for the signed-in owner and is an empty array for everyone else.
 */
export default function PendingChangesNotice({ assets = [], className = "" }) {
    if (!assets?.length) return null;

    const names = assets.map((a) => LABELS[a] ?? a);
    const list =
        names.length === 1
            ? names[0]
            : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

    return (
        <div
            className={`rounded-box border-2 border-black bg-[#FDF6C3] px-5 py-4 ${className}`}
        >
            <p className="text-[15px] font-bold text-black">
                Your new {list} {names.length === 1 ? "is" : "are"} being reviewed
            </p>
            <p className="mt-1 text-[14px] leading-[1.55] text-black/75">
                Nothing is wrong — your profile stays exactly as it is until we
                approve the change, so visitors still see the version we already
                cleared. You do not need to upload it again.
            </p>
        </div>
    );
}
