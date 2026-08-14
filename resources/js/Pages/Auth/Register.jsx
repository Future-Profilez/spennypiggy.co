import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import axios from "axios";
import GuestLayout from "@/Layouts/GuestLayout";
import { useAlerts } from "@/Components/Alerts";
import { subscriptionPlan } from "@/constants/creatorSubscription";

import ProgressRail from "./register/ProgressRail";
import StepTransition from "./register/StepTransition";
import PreviewCard from "./register/PreviewCard";
import RoleChooser from "./register/RoleChooser";
import IdentityStep from "./register/IdentityStep";
import CredentialsStep from "./register/CredentialsStep";
import CreatorProfileStep from "./register/CreatorProfileStep";
import ReviewStep from "./register/ReviewStep";
import SignupPausedPanel from "./register/SignupPausedPanel";
import {
    MAX_CATEGORIES,
    ROLE_CREATOR,
    ROLE_SUPPORTER,
    accentFor,
    stepsFor,
    usernameError,
} from "./register/constants";

/**
 * Registration.
 *
 * One screen asks one thing. The old flow put ~14 fields on a single page —
 * including five billing-address fields a supporter had to complete before
 * they had bought anything — behind a role picker and a full-screen warning.
 *
 * The billing address is gone from signup entirely: `successCheckout` already
 * writes the card-verified address to `gifter_addresses` at the first purchase,
 * so asking for it here collected a worse copy of the same data at the most
 * expensive possible moment. Country stays, because it sets the currency.
 */
export default function Register() {
    const {
        turnstileSiteKey,
        subscriptionPlan: planFromServer,
        googleProfile = null,
        googleUtm = null,
        googleEnabled = false,
    } = usePage().props;

    const effectiveSiteKey = googleProfile ? null : turnstileSiteKey;
    const { url } = usePage();
    const { successAlert, errorAlert } = useAlerts();
    const plan = useMemo(
        () => subscriptionPlan(planFromServer),
        [planFromServer],
    );

    const params = new URLSearchParams(url.split("?")[1]);
    const referralFromUrl = params.get("ref");
    const typeFromUrl = params.get("type");
    const startsAsCreator = typeFromUrl === "creator";

    const [role, setRole] = useState(
        startsAsCreator ? ROLE_CREATOR : ROLE_SUPPORTER,
    );
    const [stepKey, setStepKeyRaw] = useState(
        startsAsCreator ? "identity" : "role",
    );
    // +1 forward, -1 back. Drives which side the next screen slides in from, so the direction of
    // travel is legible without reading the rail.
    const [direction, setDirection] = useState(1);

    const setStepKey = useCallback((key, dir = 1) => {
        setDirection(dir);
        setStepKeyRaw(key);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        // Pre-filled from the Google profile. The email is display-only — `store()` reads the
        // authoritative copy from the session, so changing it here changes nothing.
        name: googleProfile?.name || "",
        username: "",
        email: googleProfile?.email || "",
        password: "",
        password_confirmation: "",
        gender: "they",
        role: startsAsCreator ? ROLE_CREATOR : ROLE_SUPPORTER,
        creator_category: "",
        promo: "",
        country: "",
        country_code: "",
        cf_turnstile_response: "",
        creator_email_receipt_ack: false,
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        crm_invite_token: "",
    });

    const isCreator = Number(role) === ROLE_CREATOR;
    const accent = accentFor(role);

    /* ----------------------------- attribution ---------------------------- */

    useEffect(() => {
        if (typeof window === "undefined") return;

        const search = new URLSearchParams(window.location.search);
        // `googleUtm` carries the tags that were on the URL before the trip to Google — they are
        // not on it any more, and localStorage is the only other place they survive.
        const pick = (key) =>
            search.get(key) ||
            googleUtm?.[key] ||
            localStorage.getItem(key) ||
            "";

        const utm_source = pick("utm_source");
        const utm_medium = pick("utm_medium");
        const utm_campaign = pick("utm_campaign");
        const crm_invite_token = localStorage.getItem("sp_invite_token") || "";

        if (utm_source || utm_medium || utm_campaign || crm_invite_token) {
            setData((prev) => ({
                ...prev,
                utm_source,
                utm_medium,
                utm_campaign,
                crm_invite_token,
            }));
        }
    }, []);

    /* --------------------------- live validation -------------------------- */

    // Set only when the server refuses because creator sign-ups are paused
    // platform-wide. Holds the server's own copy — never a string written here.
    const [signupPaused, setSignupPaused] = useState(null);

    const [liveErrors, setLiveErrors] = useState({});
    const [validity, setValidity] = useState({});
    const [checking, setChecking] = useState({});
    const [touched, setTouched] = useState({});
    const [takenUsername, setTakenUsername] = useState(null);
    const timers = useRef({});
    const seqRef = useRef({});

    const markTouched = useCallback((field) => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    }, []);

    /**
     * Returns the server's field errors (an empty object when it accepted the
     * payload) so a caller can attach the verdict to the exact value it asked
     * about. `liveErrors` alone is not enough for that: it is read a render
     * later, by which point the value may already have changed.
     */
    const validateRemote = useCallback(async (payload) => {
        const fields = Object.keys(payload);
        if (fields.length === 0) return {};

        // ⚠️ The debounce cancels a PENDING timer, never an in-flight request. Type "priya",
        // wait for the request to leave, then type "priyas": two are in the air, and if the
        // first lands last its verdict is written against the second value — "taken" on a free
        // handle, or a tick on one that is not. Each field keeps a sequence; a response that is
        // no longer the latest is dropped.
        const seq = (seqRef.current[fields[0]] =
            (seqRef.current[fields[0]] ?? 0) + 1);
        const isStale = () => seqRef.current[fields[0]] !== seq;

        setChecking((prev) => ({
            ...prev,
            ...Object.fromEntries(fields.map((f) => [f, true])),
        }));

        try {
            await axios.post(route("register.validate"), payload);
            if (isStale()) return {};
            setLiveErrors((prev) => {
                const next = { ...prev };
                fields.forEach((f) => delete next[f]);
                return next;
            });
            setValidity((prev) => ({
                ...prev,
                ...Object.fromEntries(fields.map((f) => [f, true])),
            }));
            return {};
        } catch (err) {
            // 🚨 Only a 422 is an answer. On a network failure or a 500 there is no
            // `err.response.data.errors`, and treating that empty object as "no errors" set
            // validity to TRUE — the field drew a green tick claiming it had been checked by
            // something that never replied, and the person found out three screens later.
            if (err?.response?.status !== 422) {
                if (isStale()) return {};
                setValidity((prev) => {
                    const next = { ...prev };
                    fields.forEach((f) => delete next[f]);
                    return next;
                });

                return {};
            }

            const responseErrors = err?.response?.data?.errors || {};
            if (isStale()) return {};
            setLiveErrors((prev) => {
                const next = { ...prev };
                fields.forEach((f) => {
                    const msg = responseErrors?.[f]?.[0];
                    if (msg) next[f] = msg;
                    else delete next[f];
                });
                return next;
            });
            setValidity((prev) => {
                const next = { ...prev };
                fields.forEach((f) => {
                    next[f] = !responseErrors?.[f];
                });
                return next;
            });
            return responseErrors;
        } finally {
            if (!isStale()) {
                setChecking((prev) => {
                    const next = { ...prev };
                    fields.forEach((f) => delete next[f]);
                    return next;
                });
            }
        }
    }, []);

    const clearField = useCallback((field) => {
        setLiveErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setValidity((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    // Username: check the local rules first so an obviously invalid handle
    // never costs a round trip, then ask the server about availability.
    useEffect(() => {
        clearTimeout(timers.current.username);
        clearField("username");
        if (!data.username) return;

        timers.current.username = setTimeout(() => {
            const value = data.username;
            const local = usernameError(value);
            if (local) {
                setLiveErrors((prev) => ({ ...prev, username: local }));
                setValidity((prev) => ({ ...prev, username: false }));
                setTakenUsername(null);
                return;
            }
            validateRemote({ username: value }).then((errs) => {
                // Record WHICH handle was rejected. A bare boolean stayed true
                // for a moment after the suggestion auto-advanced, so the next
                // suggestion was skipped as though it were taken too.
                setTakenUsername(errs?.username ? value : null);
            });
        }, 450);

        return () => clearTimeout(timers.current.username);
    }, [data.username, validateRemote, clearField]);

    useEffect(() => {
        clearTimeout(timers.current.email);
        clearField("email");
        if (!data.email) return;

        timers.current.email = setTimeout(() => {
            validateRemote({ email: data.email });
        }, 550);

        return () => clearTimeout(timers.current.email);
    }, [data.email, validateRemote, clearField]);

    const fieldError = useCallback(
        (field) => {
            // Availability answers are useful the moment they arrive; everything
            // else waits until the field has been left, so a half-typed value is
            // never called wrong.
            const always = field === "username" || field === "email";
            if (!always && !touched[field]) return "";

            const live = liveErrors[field];
            if (live) return live;

            const server = errors[field];
            return Array.isArray(server) ? server[0] || "" : server || "";
        },
        [errors, liveErrors, touched],
    );

    const fieldStatus = useCallback(
        (field) => {
            if (checking[field]) return "checking";
            if (fieldError(field)) return "error";

            const value =
                field === "country" ? data.country : data[field] || "";
            if (!String(value).trim()) return "idle";

            if (validity[field]) return "success";
            if (field === "name" || field === "country") return "success";
            return "idle";
        },
        [checking, data, fieldError, validity],
    );

    /* -------------------------------- steps ------------------------------- */

    const chooseRole = (nextRole) => {
        setRole(nextRole);
        setData((prev) => ({
            ...prev,
            role: nextRole,
            // A supporter has no categories and no creator acknowledgement;
            // clear them so a change of mind can't submit a stale value.
            creator_category:
                nextRole === ROLE_CREATOR ? prev.creator_category : "",
            creator_email_receipt_ack: false,
        }));
        setStepKey("identity");
    };

    const goBack = () => {
        const steps = stepsFor(role, !!googleProfile).map((s) => s.key);
        const i = steps.indexOf(stepKey);
        if (i > 0) setStepKey(steps[i - 1], -1);
    };

    const identityComplete = useMemo(
        () =>
            !!data.name.trim() &&
            !!data.username.trim() &&
            !liveErrors.name &&
            !liveErrors.username,
        [data.name, data.username, liveErrors],
    );

    const credentialsComplete = useMemo(() => {
        // A Google signup has no password to choose and its email is settled server-side, so the
        // only thing this screen still gates is the supporter's country. Requiring a password
        // here would leave the button permanently disabled with nothing on screen to fix.
        if (googleProfile) {
            return isCreator || !!data.country;
        }

        return (
            !!data.email.trim() &&
            data.password.length > 7 &&
            !liveErrors.email &&
            !liveErrors.password &&
            (isCreator || !!data.country)
        );
    }, [data, liveErrors, isCreator, googleProfile]);

    // Derived from the same `stepsFor` the rail draws, so the button can never send someone to a
    // screen the progress bar does not show — a Google creator has no `credentials` screen.
    const afterIdentity = useMemo(() => {
        const keys = stepsFor(role, !!googleProfile).map((s) => s.key);

        return keys[keys.indexOf("identity") + 1] ?? "confirm";
    }, [role, googleProfile]);

    const advance = (fields, ready, nextKey) => {
        fields.forEach(markTouched);
        if (!ready) {
            const firstError = fields
                .map((f) => liveErrors[f])
                .filter(Boolean)[0];
            errorAlert(firstError || "Fill in the fields above to continue.");
            return;
        }
        setStepKey(nextKey);
    };

    /* ------------------------------ categories ---------------------------- */

    const [categories, setCategories] = useState([]);

    const toggleCategory = (value) => {
        setCategories((prev) => {
            const next = prev.includes(value)
                ? prev.filter((c) => c !== value)
                : prev.length >= MAX_CATEGORIES
                  ? prev
                  : [...prev, value];
            setData("creator_category", JSON.stringify(next));
            return next;
        });
    };

    /* ------------------------------- referral ----------------------------- */

    const [referral, setReferral] = useState(referralFromUrl || "");
    const [referralMessage, setReferralMessage] = useState("");
    const [referralType, setReferralType] = useState("");

    useEffect(() => {
        if (isCreator && referralFromUrl) {
            setReferral(referralFromUrl);
            setData("promo", referralFromUrl);
        }
    }, [isCreator, referralFromUrl]);

    const checkReferral = () => {
        const code = referral.trim();
        if (!code) {
            setReferralMessage("");
            setReferralType("");
            setData("promo", "");
            return;
        }

        const endpoint = isCreator
            ? `/check-referral-code/${code}`
            : `/check-coupon-code/${code}`;

        axios
            .get(endpoint)
            .then((resp) => {
                if (resp.data.status) {
                    setData("promo", code);
                    setReferralType("success");
                    setReferralMessage(resp.data.msg || "Code applied.");
                } else {
                    setData("promo", "");
                    setReferralType("error");
                    setReferralMessage(
                        resp.data.msg || "That code isn't valid.",
                    );
                }
            })
            .catch(() => {
                setData("promo", "");
                setReferralType("error");
                setReferralMessage("Couldn't check that code. Try again.");
            });
    };

    /* ------------------------------- turnstile ---------------------------- */

    const [verified, setVerified] = useState(false);
    const [turnstileEl, setTurnstileEl] = useState(null);
    const widgetId = useRef(null);

    const bindTurnstile = useCallback((el) => setTurnstileEl(el), []);

    const onVerify = useCallback(
        (token) => {
            setData("cf_turnstile_response", token || "");
            setVerified(!!token);
        },
        [setData],
    );

    const resetCaptcha = useCallback(() => {
        setVerified(false);
        setData("cf_turnstile_response", "");
        if (widgetId.current !== null && window.turnstile) {
            window.turnstile.reset(widgetId.current);
        }
    }, [setData]);

    useEffect(() => {
        if (!effectiveSiteKey || !turnstileEl) return;

        const render = () => {
            if (!window.turnstile || !turnstileEl) return;
            if (widgetId.current !== null) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
            turnstileEl.innerHTML = "";
            widgetId.current = window.turnstile.render(turnstileEl, {
                sitekey: effectiveSiteKey,
                theme: "light",
                size: "flexible",
                callback: onVerify,
                "expired-callback": () => onVerify(""),
                "error-callback": () => onVerify(""),
            });
        };

        if (window.turnstile) {
            render();
            return;
        }

        const existing = document.querySelector(
            'script[data-turnstile-script="true"]',
        );
        if (existing) {
            existing.addEventListener("load", render);
            setTimeout(render, 0);
            return () => existing.removeEventListener("load", render);
        }

        const script = document.createElement("script");
        script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = "true";
        script.onload = render;
        document.head.appendChild(script);

        return () => {
            if (widgetId.current !== null && window.turnstile) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, [effectiveSiteKey, turnstileEl, onVerify]);

    /* -------------------------------- consent ----------------------------- */

    const [consents, setConsents] = useState({
        terms: false,
        creatorEmail: false,
        ownDetails: false,
    });

    const setConsent = (key, value) => {
        setConsents((prev) => ({ ...prev, [key]: value }));
        if (key === "creatorEmail") {
            setData("creator_email_receipt_ack", value);
        }
    };

    const canSubmit =
        consents.terms &&
        (isCreator ? consents.creatorEmail : consents.ownDetails) &&
        (!effectiveSiteKey || verified);

    /* -------------------------------- submit ------------------------------ */

    const submitting = useRef(false);

    const submit = () => {
        if (submitting.current || processing) return;
        if (!canSubmit) return;

        submitting.current = true;
        post(route("register"), {
            preserveScroll: true,
            onSuccess: (resp) => {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("sp_invite_token");
                }
                if (resp?.props?.flash?.success) {
                    successAlert(resp.props.flash.success);
                }
                if (resp?.props?.flash?.error) {
                    errorAlert(resp.props.flash.error);
                }
            },
            onError: (err) => {
                // 🚨 Platform-paused is NOT a field error and must not be toasted.
                // The refusal is permanent for as long as the pause lasts, so a
                // toast that fades leaves the person on a form that will refuse
                // them again with no explanation. It takes over the screen and
                // offers the waitlist instead — which is the whole reason this
                // branch exists, and the click paid acquisition already bought.
                if (err?.signup_paused) {
                    setSignupPaused(err.signup_paused);
                    resetCaptcha();
                    return;
                }

                Object.values(err).forEach((msg) => errorAlert(msg));
                resetCaptcha();

                // A server error belongs to a field on one of the two form
                // screens. Sending the person back to the one that owns it is
                // the difference between a fixable error and a dead end.
                const owner = [
                    { step: "identity", fields: ["name", "username"] },
                    {
                        step: "credentials",
                        fields: ["email", "password", "country"],
                    },
                ].find((s) => s.fields.some((f) => err[f]));

                if (owner) {
                    setTouched((prev) => ({
                        ...prev,
                        ...Object.fromEntries(
                            owner.fields.map((f) => [f, true]),
                        ),
                    }));
                    setStepKey(owner.step);
                }
            },
            onFinish: () => {
                submitting.current = false;
            },
        });
    };

    /* -------------------------------- render ------------------------------ */

    // The preview is a strip above the form, not a second column. A side column
    // only had something to show on one of the five steps, so on every other
    // one it was an empty card sitting in half the page.
    const showPreview =
        (stepKey === "identity" || stepKey === "profile") &&
        !!(data.name || data.username);

    // Each step is its own screen, so it has to start at the top of itself.
    // The Continue button sits near the fold, so without this the next step
    // opened already scrolled past its own heading.
    useEffect(() => {
        if (typeof window === "undefined") return;
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "auto"
                : "smooth",
        });
    }, [stepKey]);

    return (
        <GuestLayout>
            <Head title="Create account" />

            {/* Header already renders its own 75px spacer, so this only adds
                breathing room on top of it — pt-28 here was ~170px of dead
                space above the fold on a phone. */}
            <div className="relative min-h-dvh overflow-hidden bg-[#0B0B0C] px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-10">
                {/* A single soft wash keyed to the chosen path — the page used to
                    carry three animated blur orbs that read as decoration. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-25 transition-colors duration-700"
                    style={{
                        background: `radial-gradient(60% 100% at 50% 0%, ${accent.hex} 0%, transparent 70%)`,
                    }}
                />

                {/* One column at every width. The form is a single stack of
                    short screens, so a wider container only spreads four fields
                    across a line they don't need. */}
                <div
                    className={`relative mx-auto w-full ${
                        stepKey === "role" ? "max-w-5xl" : "max-w-[560px]"
                    }`}
                >
                    {/* Sign-ups paused: this REPLACES the form rather than sitting
                        above it. Leaving the fields on screen invites the person to
                        submit again into a refusal that has not changed, and the
                        rail below would still be counting steps towards an account
                        they cannot open. */}
                    {signupPaused ? (
                        <div className="pt-4">
                            {/* ⚠️ Google first. A Google sign-up posts no email —
                                the verified address is merged in from the session
                                — so `data.email` is blank and the panel would ask
                                for an address the server has ALREADY captured. The
                                person then types a different one and we hold two
                                leads for one human, and email them twice. */}
                            <SignupPausedPanel
                                message={signupPaused}
                                email={googleProfile?.email || data.email}
                                role={1}
                            />
                        </div>
                    ) : (
                    <>
                    <div className="mb-5 sm:mb-7">
                        <ProgressRail
                            role={role}
                            currentKey={stepKey}
                            hasGoogle={!!googleProfile}
                            onBack={stepKey !== "role" ? goBack : null}
                        />
                    </div>

                    {googleProfile && (
                        <div className="mb-5 flex items-center justify-between gap-3 rounded-box-sm border-2 border-dashed border-white/20 bg-white/5 p-3 text-xs text-white">
                            <span className="truncate">
                                Registering with Google: <strong className="text-[#05EFB8]">{googleProfile.email}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => router.post(route("auth.google.cancel"))}
                                className="font-bold text-[#FF007F] underline hover:text-white shrink-0"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {showPreview && (
                        /* The category list is a full screen on its own, so on
                           a phone the strip is dropped there — a selected chip
                           already turns pink in the list, and the counter says
                           how many. On the name screen it stays: that is where
                           it is the only feedback. */
                        <div
                            className={`mb-5 ${
                                stepKey === "profile" ? "hidden sm:block" : ""
                            }`}
                        >
                            <PreviewCard
                                role={role}
                                name={data.name}
                                username={data.username}
                                categories={categories}
                            />
                        </div>
                    )}

                    <StepTransition stepKey={stepKey} direction={direction}>
                        {stepKey === "role" && (
                            <RoleChooser
                                onChoose={chooseRole}
                                plan={plan}
                                googleEnabled={googleEnabled && !googleProfile}
                            />
                        )}

                        {stepKey === "identity" && (
                            <div className="pt-3">
                                <IdentityStep
                                    role={role}
                                    data={data}
                                    setData={setData}
                                    fieldStatus={fieldStatus}
                                    fieldError={fieldError}
                                    onFieldBlur={markTouched}
                                    takenUsername={takenUsername}
                                    onSubmit={() =>
                                        advance(
                                            ["name", "username"],
                                            identityComplete,
                                            afterIdentity,
                                        )
                                    }
                                    canContinue={identityComplete}
                                />
                            </div>
                        )}

                        {stepKey === "credentials" && (
                            <CredentialsStep
                                role={role}
                                data={data}
                                setData={setData}
                                onCountry={(raw) => {
                                    const c = JSON.parse(raw);
                                    setData((prev) => ({
                                        ...prev,
                                        country: c.label,
                                        country_code: c.code,
                                    }));
                                    markTouched("country");
                                }}
                                fieldStatus={fieldStatus}
                                fieldError={fieldError}
                                onFieldBlur={markTouched}
                                googleProfile={googleProfile}
                                onSubmit={() =>
                                    advance(
                                        googleProfile
                                            ? ["country"]
                                            : ["email", "password", "country"],
                                        credentialsComplete,
                                        isCreator ? "profile" : "confirm",
                                    )
                                }
                                canContinue={credentialsComplete}
                            />
                        )}

                        {stepKey === "profile" && (
                            <CreatorProfileStep
                                categories={categories}
                                onToggleCategory={toggleCategory}
                                referral={referral}
                                referralLocked={!!referralFromUrl}
                                onReferralChange={setReferral}
                                onReferralCheck={checkReferral}
                                referralMessage={referralMessage}
                                referralType={referralType}
                                onSubmit={() => setStepKey("confirm")}
                            />
                        )}

                        {stepKey === "confirm" && (
                            <ReviewStep
                                role={role}
                                data={data}
                                consents={consents}
                                setConsent={setConsent}
                                turnstileSiteKey={effectiveSiteKey}
                                bindTurnstile={bindTurnstile}
                                processing={processing}
                                canSubmit={canSubmit}
                                onSubmit={submit}
                                plan={plan}
                            />
                        )}
                    </StepTransition>
                    </>
                    )}

                    <p className="mt-5 text-center text-sm text-white/60">
                        Already have an account?{" "}
                        <Link
                            href={route("login")}
                            className="font-semibold underline decoration-2 underline-offset-4"
                            style={{ color: accent.hex }}
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
