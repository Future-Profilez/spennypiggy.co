/**
 * Registration flow constants.
 *
 * The step list is role-aware: a supporter answers four screens, a creator five.
 * Deriving the rail from this array means a "Step 2 of 4" label can never drift
 * from the screens actually shown — the old flow numbered its steps 0,1,2,3 and
 * skipped 1 and 2 for supporters, so no honest progress indicator was possible.
 *
 * Each screen asks for one thing. More screens, but none of them is a wall.
 */

export const ROLE_CREATOR = 1;
export const ROLE_SUPPORTER = 0;

/**
 * Badges.
 *
 * ⚠️ The list used to live HERE as 17 label strings, and a second copy of the
 * same 17 lived in `Pages/account/EditProfile.jsx` — so signup and the account
 * page could offer different things. Both now read `@/constants/badges`, which
 * mirrors `App\Support\Badges` and is asserted in step with it by test.
 *
 * Re-exported under the old names so nothing outside this folder had to change.
 */
export {
    INTEREST_GROUPS as CREATOR_CATEGORY_GROUPS,
    INTEREST_BADGES as CREATOR_CATEGORIES,
    MAX_INTERESTS as MAX_CATEGORIES,
    MAX_PRIDE,
    PRIDE_BADGES,
} from "@/constants/badges";

/**
 * Steps per role. `key` drives which screen renders; `label` is what the rail
 * prints. Keep both lists in the order they are walked.
 */
export const STEPS = {
    [ROLE_CREATOR]: [
        { key: "role", label: "You" },
        { key: "identity", label: "Name" },
        { key: "credentials", label: "Sign in" },
        { key: "profile", label: "Profile" },
        { key: "confirm", label: "Confirm" },
    ],
    [ROLE_SUPPORTER]: [
        { key: "role", label: "You" },
        { key: "identity", label: "Name" },
        { key: "credentials", label: "Sign in" },
        { key: "confirm", label: "Confirm" },
    ],
};

/**
 * A Google signup brings its own email and has no password to choose, so the `credentials`
 * screen has nothing left to ask a CREATOR — it is dropped for them.
 *
 * ⚠️ It is KEPT for a supporter, because that screen also carries **country**, which the server
 * requires for role 0 and which sets their display currency. Dropping it for everyone made the
 * form pass client-side and then fail at submit with a field the person was never shown.
 * Filtering here keeps the rail, the counter and the back button honest without any of them
 * knowing why a step is missing.
 */
export const stepsFor = (role, hasGoogle = false) => {
    const steps =
        STEPS[Number(role) === ROLE_CREATOR ? ROLE_CREATOR : ROLE_SUPPORTER];

    return hasGoogle && Number(role) === ROLE_CREATOR
        ? steps.filter((s) => s.key !== "credentials")
        : steps;
};

export const stepIndex = (role, key) =>
    stepsFor(role).findIndex((s) => s.key === key);

/** Accent per role — pink is the creator's, violet the supporter's. */
export const ACCENT = {
    [ROLE_CREATOR]: {
        hex: "#FF007F",
        shadow: "",
        text: "text-[#FF007F]",
        bg: "bg-[#FF007F]",
        ring: "focus-visible:ring-[#FF007F]",
    },
    [ROLE_SUPPORTER]: {
        hex: "#8C52FF",
        shadow: "",
        text: "text-[#8C52FF]",
        bg: "bg-[#8C52FF]",
        ring: "focus-visible:ring-[#8C52FF]",
    },
};

export const accentFor = (role) =>
    ACCENT[Number(role) === ROLE_CREATOR ? ROLE_CREATOR : ROLE_SUPPORTER];

/** Username rules, mirrored from RegisteredUserController's validation. */
export const usernameError = (value) => {
    if (!value) return null;
    if (value.length < 5) return "Usernames are at least 5 characters.";
    if (value.length > 20) return "Usernames are at most 20 characters.";
    if (/[A-Z]/.test(value)) return "Use lowercase letters only.";
    if (/\s/.test(value)) return "Usernames can't contain spaces.";
    if (/[^a-z0-9_.]/.test(value))
        return "Use letters, numbers, full stops and underscores only.";
    return null;
};

/**
 * Username suggestions built from the display name.
 *
 * Asking someone to invent a handle is the slowest field on the form — it is
 * the only one with rules they haven't read yet, and the only one that can come
 * back "already taken" after they've committed to it. Suggestions are derived
 * from what they already typed, so the common case is one tap.
 *
 * Every candidate is passed through `usernameError` before it is offered, so a
 * suggestion can never be one the server would reject on format.
 */
export const suggestUsernames = (name) => {
    const cleaned = String(name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip accents — not allowed in a handle
        .replace(/[^a-z0-9\s]/g, " ")
        .trim();

    if (!cleaned) return [];

    const parts = cleaned.split(/\s+/).filter(Boolean);
    const [first = "", ...rest] = parts;
    const last = rest.length ? rest[rest.length - 1] : "";
    const joined = parts.join("");

    const candidates = [
        joined,
        last ? `${first}.${last}` : `${first}.official`,
        last ? `${first}_${last}` : `${first}_official`,
        last ? `${first}${last.charAt(0)}` : `${first}x`,
        `${joined}${new Date().getFullYear() % 100}`,
        `the${joined}`,
    ];

    return [...new Set(candidates)]
        .map((c) => c.slice(0, 20))
        .filter((c) => c.length >= 5 && !usernameError(c))
        .slice(0, 4);
};

/**
 * 🚨 THE LENGTH HERE MUST MATCH `Password::min()` IN `AppServiceProvider`, AND IT
 * DID NOT — this said 8 while the server enforced 12, so a password that ticked
 * every rule on screen was refused with "The password field must be at least 12
 * characters", naming a rule the form never drew. Nothing links the two files;
 * move both or neither.
 *
 * ⚠️ The four composition rules below are ADVICE, not gates — the server checks
 * length and the breach list only (NIST: composition rules push people towards
 * `Password1!`). They stay because they are what a strength meter is for.
 */
export const PASSWORD_RULES = [
    {
        key: "length",
        label: "12 characters or more",
        test: (v) => v.length >= 12,
    },
    { key: "lower", label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
    {
        key: "upper",
        label: "An uppercase letter",
        test: (v) => /[A-Z]/.test(v),
    },
    { key: "number", label: "A number", test: (v) => /[0-9]/.test(v) },
    {
        key: "special",
        label: "A symbol",
        test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/]/.test(v),
    },
];

export const passwordScore = (value = "") =>
    PASSWORD_RULES.filter((r) => r.test(value)).length;

/**
 * Whether the register form may be submitted.
 *
 * 🚨 EXTRACTED FROM Register.jsx SO IT CAN BE TESTED, AND THAT IS THE WHOLE
 * POINT. The rule that decides this is a compliance rule, not a UX one: UK
 * PECR requires marketing consent to be OPTIONAL, so `consents.marketing`
 * must never appear below. Adding it is a three-word change that would pass
 * every backend test in the suite — the only thing that can catch it is a test
 * of this function, which is why it is no longer an inline expression.
 *
 * `marketing` is accepted in the argument object purely so a reader can see it
 * being deliberately ignored.
 */
export const canSubmitRegistration = ({
    consents = {},
    role,
    captchaRequired = false,
    captchaVerified = false,
}) => {
    const roleConsent =
        Number(role) === ROLE_CREATOR
            ? consents.creatorEmail
            : consents.ownDetails;

    return Boolean(
        consents.terms && roleConsent && (!captchaRequired || captchaVerified),
    );
};

/**
 * The three platforms a creator may give a handle for at signup.
 *
 * 🚨 MIRRORS `SocialLinks::ACCEPTED_PLATFORMS` (PHP), narrowed from thirteen to
 * three on 11 Aug 2026 by client decision. A key here that the server refuses is
 * dropped silently — the same class of fault as a `route()` name missing from the
 * generated ziggy snapshot — so the two lists are asserted equal by a test.
 *
 * ⚠️ `key` is the DATABASE COLUMN, not the brand. X's column is still `twitter`;
 * renaming it here writes the handle nowhere.
 */
export const SOCIAL_PLATFORMS = [
    { key: "instagram", label: "Instagram", placeholder: "yourname" },
    { key: "twitter", label: "X", placeholder: "yourname" },
    { key: "tiktok", label: "TikTok", placeholder: "yourname" },
];

/**
 * Can the creator leave the profile step?
 *
 * 🚨 THE SOCIAL HANDLE IS REQUIRED FOR A CREATOR (client decision, 25 Aug 2026).
 * It is not new friction, it is friction moved earlier: a creator already cannot go
 * live without an approved handle — `Profile/CreatorVerification.jsx` locks "Submit
 * for review" until socials, photo and bio are approved — so answering it here means
 * the social onboarding step is done before they reach the dashboard, and Creator
 * Studio prefills from that row instead of asking twice.
 *
 * ⚠️ THIS GATES THE STEP, NOT THE FINAL SUBMIT. `canSubmitRegistration` is the
 * CONSENT gate and must stay free of it — bundling a product requirement into the
 * consent check is how an optional consent quietly becomes conditional. The server's
 * `Rule::requiredIf` is the real enforcement; this is what makes the button honest.
 *
 * Named and exported for the same reason `canSubmitRegistration` is: as an inline
 * expression it cannot be tested, and it is one edit away from being wrong.
 */
export const creatorProfileStepComplete = ({
    categories = [],
    socialHandle = "",
}) => categories.length > 0 && String(socialHandle).trim() !== "";

/**
 * What the step's button should say — the missing thing, in the order the screen
 * asks for it. A disabled button with no explanation is the pattern this whole
 * signup rebuild exists to remove.
 */
export const creatorProfileStepAction = ({
    categories = [],
    socialHandle = "",
}) => {
    if (categories.length < 1) return "Pick at least one badge";
    if (String(socialHandle).trim() === "") return "Add a social account";

    return "Continue";
};
