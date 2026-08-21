import { rewardLines } from "@/constants/rewards";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useForm, usePage, Link } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import { Target } from "lucide-react";
import axios from "axios";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import PaymentMethodSelector from "@/Components/PaymentMethodSelector";
import Turnstile from "@/Components/Turnstile";
import { OrderContextCard } from "@/Components/Checkout/SummaryReceipt";
import { fieldClass } from "@/Components/Checkout/FormKit";
import confetti from "canvas-confetti";
import { riskMessageBody } from '@/constants/riskMessages';
import StepUpModal from '@/Components/Risk/StepUpModal';

const MIN_AMOUNT = 4.99;
const MAX_AMOUNT = 500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PiggyPotWidget({
    piggyPots,
    user,
    global_currency,
    inPopup,
    feed,
}) {
    // featuredPot may be undefined when there are no pots. All hooks below stay
    // null-safe and the early return happens AFTER every hook (Rules of Hooks).
    const featuredPot = piggyPots?.find((p) => p.is_pinned) || piggyPots?.[0];
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectegTag, setselectegTag] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});
    const [prices, setPrices] = useState(null);
    // Step-up (one-time code). Reachable on pots since the risk enforcement was
    // repaired — see handleContribute.
    const [showStepUp, setShowStepUp] = useState(false);
    const [stepUpUi, setStepUpUi] = useState(null);
    const [stepUpContext, setStepUpContext] = useState(null);

    const { auth, turnstileSiteKey } = usePage().props;
    const { errorAlert } = useAlerts();
    const turnstileRef = useRef(null);
    const [verified, setVerified] = useState(false);

    const { data, setData } = useForm({
        amount: "",
        currency: featuredPot?.currency,
        message: "",
        name: auth?.user?.name || "",
        email: auth?.user?.email || "",
        anonymous: 0,
        digital_waiver: false,
        agree: false,
        payment_method: "card",
        cf_turnstile_response: "",
    });

    const onTurnstileVerify = useCallback(
        (token) => {
            setData("cf_turnstile_response", token || "");
            setVerified(!!token);
        },
        [setData],
    );

    const potCurrency = (
        featuredPot?.currency ||
        global_currency ||
        "GBP"
    ).toUpperCase();
    const fmt = useMemo(() => {
        const formatter = new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: potCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return (v) => formatter.format(Number(v) || 0);
    }, [potCurrency]);

    const targetAmount = parseFloat(featuredPot?.target_amount || 0);
    const raisedAmount = parseFloat(featuredPot?.total_raised || 0);
    const progressPercent =
        targetAmount > 0
            ? Math.min(100, (raisedAmount / targetAmount) * 100)
            : 0;
    const remainingAmount = Math.max(
        0,
        parseFloat((targetAmount - raisedAmount).toFixed(2)),
    );
    const isComplete = targetAmount > 0 && remainingAmount <= 0;

    const deadlinePassed = featuredPot?.deadline
        ? new Date(String(featuredPot.deadline).replace(" ", "T")) < new Date()
        : false;
    const isHeld = featuredPot?.status === "moderation_hold";
    const isClosed =
        isComplete ||
        deadlinePassed ||
        isHeld ||
        ["archived", "completed", "expired"].includes(featuredPot?.status);

    const maxAllowed = Math.min(
        MAX_AMOUNT,
        remainingAmount > 0 ? remainingAmount : MAX_AMOUNT,
    );
    const presetAmounts = [25, 50, 75];

    const featuredCreatorId =
        featuredPot?.creator_id ||
        featuredPot?.creator?.id ||
        featuredPot?.user?.id ||
        featuredPot?.user_id;
    const isCreator =
        auth?.user?.id &&
        featuredCreatorId &&
        auth.user.id === featuredCreatorId;
    const shouldCelebrate = !!featuredPot?.is_pinned && isComplete && !inPopup;

    const closedReason = isHeld
        ? "This content is under review and will be available shortly."
        : deadlinePassed
          ? "The creator's deadline for this content has passed."
          : isComplete
            ? "This content goal has been reached and is now closed."
            : "This content is not available right now.";

    const statusLabel = isComplete
        ? "Completed"
        : featuredPot?.status || "active";

    const statusBadgeClass = isComplete
        ? "bg-black text-white"
        : statusLabel === "active"
          ? "bg-[#A2E4B8] text-black"
          : statusLabel === "moderation_hold"
            ? "bg-orange-400 text-white"
            : "bg-gray-200 text-gray-800";

    // Side-by-side on the profile, where the card has the full column width.
    // The popup is narrow — it stays stacked.
    const row = !inPopup;

    // The creator's own pot and a closed one have no purchase flow — just a
    // notice. It reads better full width UNDER the cover+content row than
    // squeezed into the right column.
    const noticeBelow = isCreator || isClosed;

    const [step, setStep] = useState(1);

    const selectPreset = (val) => {
        setAmount(String(val));
        setData("amount", val);
        setselectegTag(val);
        setFieldErrors((e) => ({ ...e, amount: null }));
    };

    const handleCustomAmount = (e) => {
        setAmount(e.target.value);
        setData("amount", e.target.value);
        setselectegTag("custom");
        setFieldErrors((err) => ({ ...err, amount: null }));
    };

    const validateAmount = () => {
        const n = parseFloat(amount);
        if (!n || Number.isNaN(n)) return "Enter an amount to continue.";
        if (n < MIN_AMOUNT) return `Minimum purchase is ${fmt(MIN_AMOUNT)}.`;
        if (n > MAX_AMOUNT) return `Maximum purchase is ${fmt(MAX_AMOUNT)}.`;
        if (remainingAmount > 0 && n > remainingAmount) {
            return `Only ${fmt(remainingAmount)} left before this goal is reached.`;
        }
        return null;
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (isClosed) {
                setFieldErrors({ amount: closedReason });
                return;
            }
            const err = validateAmount();
            if (err) {
                setFieldErrors({ amount: err });
                return;
            }
            setFieldErrors({});
            setStep(2);
        } else if (step === 2) {
            if (!auth?.user) {
                const errs = {};
                if (!data.name?.trim()) errs.name = "Enter a display name.";
                if (!EMAIL_RE.test(String(data.email || "").trim())) {
                    errs.email =
                        "Enter a valid email — your content and receipt are sent here.";
                }
                if (Object.keys(errs).length) {
                    setFieldErrors(errs);
                    return;
                }
            }
            setFieldErrors({});
            setStep(3);
        }
    };

    const handleContribute = async () => {
        if (loading) return;

        const err = validateAmount();
        if (err) {
            setStep(1);
            setFieldErrors({ amount: err });
            return;
        }

        if (!data.digital_waiver) {
            setFieldErrors({ waiver: "Please accept the terms to continue." });
            return;
        }

        if (turnstileSiteKey && !verified && !data.cf_turnstile_response) {
            errorAlert("Please complete the security check.");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(
                route("piggy-pot.pay", featuredPot.uuid),
                data,
            );

            if (res.data.status) {
                window.location.href = res.data.url;
                return;
            }

            // 🚨 The key is `step_up_required`, not `step_up`. This screen used
            // to check `step_up`, which the trait has never sent — and it was
            // harmless only because Piggy Pot's risk enforcement was broken and
            // STEP_UP could never be reached. Now that it can (a contribution
            // over the step-up threshold, or several rapid payments — both well
            // inside the £4.99–£500 pot range), a missed branch here is a
            // supporter told their payment failed while holding a valid code.
            if (res.data.step_up_required) {
                setStepUpUi(res.data.ui || null);
                setStepUpContext(res.data.step_up_context || null);
                setShowStepUp(true);
                // Reset the captcha so backing out of the modal leaves a
                // working form rather than a permanently disabled button.
                if (turnstileRef.current) {
                    turnstileRef.current.reset();
                }
                setVerified(false);
                setData("cf_turnstile_response", "");
                setLoading(false);
                return;
            }

            if (res.data.card_verification_required) {
                errorAlert(res.data.msg);
            } else {
                errorAlert(
                    res.data.msg ||
                        "Failed to start payment. Please try again.",
                );
            }
            setLoading(false);
        } catch (error) {
            const bag = error?.response?.data?.errors;
            const first = bag && Object.values(bag).flat()[0];
            errorAlert(
                first ||
                    error?.response?.data?.message ||
                    "Something went wrong. Your card has not been charged.",
            );
            setVerified(false);
            setData("cf_turnstile_response", "");
            if (turnstileRef.current) {
                turnstileRef.current.reset();
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (step !== 3 || !data.amount) {
            return;
        }
        let cancelled = false;
        const t = setTimeout(() => {
            axios
                .post("/payments/price-preview", {
                    amount: Number(data.amount),
                    currency: potCurrency,
                })
                .then((res) => {
                    if (!cancelled && res.data?.status)
                        setPrices(res.data.prices);
                })
                .catch(() => {
                    if (!cancelled) setPrices(null);
                });
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [step, data.amount, potCurrency]);

    const totalCharged = prices
        ? data.payment_method === "bank"
            ? prices.bank
            : prices.card
        : null;

    useEffect(() => {
        if (!shouldCelebrate) return;
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
            return;
        try {
            const key = `pp_celebrated_${featuredPot.uuid}`;
            if (sessionStorage.getItem(key) === "1") return;
            sessionStorage.setItem(key, "1");
            setTimeout(() => {
                confetti({
                    particleCount: 120,
                    spread: 90,
                    origin: { y: 0.35 },
                    colors: ["#FF007F", "#A2E4B8", "#FFFFFF"],
                });
            }, 350);
        } catch (e) {}
    }, [shouldCelebrate, featuredPot?.uuid]);

    // Nothing to show — safe to bail now that every hook has been called.
    if (!featuredPot) return null;

    const primaryBtn =
        "w-full min-h-[52px] py-3 rounded-box-sm border-[3px] border-black font-black text-base uppercase transition-all";
    // ⚠️ BLACK on brand pink. White measures 3.78:1 and fails AA; black is 5.56:1.
    // The lift is paired with brightness, the house press idiom — a bare
    // translate with no partner is the banned scale-effect by another name.
    const primaryOn =
 "bg-[#FF007F] text-black transition-[filter,transform] duration-200 hover:brightness-110 active:brightness-95 active:translate-y-[2px] ";
    const primaryOff = "bg-pink-200 text-pink-900 cursor-not-allowed";

    const fieldBase = fieldClass;
    const labelBase =
 "block font-black text-[12px] uppercase tracking-widest text-black/70 mb-1.5";

    const FieldError = ({ name }) =>
        fieldErrors[name] ? (
            <p
                role="alert"
                className="text-xs font-bold text-red-600 mt-1 px-1"
            >
                {fieldErrors[name]}
            </p>
        ) : null;

    // ⚠️ NO BOTTOM MARGIN ON THE ROOT. The card stack that renders this
    // component spaces its children with `gap-4`, so a margin here is added on
    // top of the gap and showed up as the one 32px seam in an otherwise uniform
    // 16px stack.
    //
    // 🚨 A PLAIN LINE COMMENT, never `{/* */}` — braces directly inside a
    // `return (` are an OBJECT LITERAL, not a JSX comment, and fail the whole
    // Vite build with `Expected ")" but found "className"`. None of the
    // `npm run check` scanners catch it; only the esbuild transform does.
    return (
        <div className="w-full flex relative z-10">
            <div
                className={`w-full ${inPopup ? "" : "bg-white rounded-box border-[3px] border-black p-4 md:p-6 lg:p-7"}`}
            >
                <div
                    className={`grid items-start gap-5 ${row ? "md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-7" : ""}`}
                >
                    {/* Cover rail — self-start so a tall form never stretches the cover */}
                    <div className="relative md:self-start">
                        <div className="absolute -top-3 -left-3 bg-[#A2E4B8] text-black px-4 py-1.5 rounded-full border-[3px] border-black font-black text-sm z-10 flex items-center gap-1 uppercase tracking-wide">
                            <Target size={14} strokeWidth={3} className="shrink-0" />
                            CONTENT GOAL
                        </div>
                        <div
 className={`w-full h-48 sm:h-56 ${row ? "md:h-[20rem]" : "md:h-64"} bg-[#16161C] rounded-box-sm border-[3px] border-black overflow-hidden relative `}
                        >
                            <img
                                src={
                                    featuredPot.cover_media ||
                                    "https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/"
                                }
                                alt={
                                    featuredPot.title
                                        ? `Cover art for ${featuredPot.title}`
                                        : "Content cover"
                                }
                                className="w-full h-full object-cover opacity-90"
                            />
                            {/* Status badge on image */}
                            <div className="absolute bottom-4 left-4 z-10">
                                <span
 className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest border-2 border-black ${statusBadgeClass}`}
                                >
                                    {isComplete
                                        ? "✓ COMPLETED"
                                        : statusLabel === "moderation_hold"
                                          ? "MODERATION HOLD"
                                          : statusLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Everything the buyer reads and acts on */}
                    <div className="min-w-0">
                        <h2 className="font-anton text-2xl md:text-[2rem] leading-tight text-black tracking-wide">
                            {featuredPot.title}
                        </h2>
                        {featuredPot.description && (
                            <p className="text-sm md:text-[0.95rem] text-black/60 mt-1 line-clamp-2">
                                {featuredPot.description}
                            </p>
                        )}

                        {/* The deliverable */}
                        {(featuredPot.content_description ||
                            featuredPot.content_file) && (
                            <div className="mt-3 rounded-box-sm border-[3px] border-black bg-[#A2E4B8] px-4 py-2.5 flex items-baseline gap-2 flex-wrap">
 <p className="font-black text-[12px] uppercase tracking-widest text-black shrink-0">
                                    You unlock
                                </p>
                                <p className="font-bold text-sm text-black min-w-0">
                                    {featuredPot.content_description ||
                                        "Exclusive content, delivered instantly after purchase."}
                                </p>
                            </div>
                        )}

                        {/* Progress — a coin meter: 20 segments, filled left to right */}
                        <div className="mt-3 rounded-box-sm border-[3px] border-black bg-[#f8f6f2] px-4 py-3">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="font-anton text-xl text-black leading-none">
                                    <span
                                        className={
                                            isComplete
                                                ? "text-[#0f8f52]"
                                                : "text-[#C4006A]"
                                        }
                                    >
                                        {fmt(raisedAmount)}
                                    </span>
 <span className="text-black/60 text-sm font-bold">
                                        {" "}
                                        of {fmt(targetAmount)}
                                    </span>
                                </p>
 <p className="font-black text-[12px] uppercase tracking-widest text-black/60 shrink-0">
                                    {Math.round(progressPercent)}% funded
                                </p>
                            </div>

                            <div
                                className="mt-2 flex gap-[3px] rounded-full border-[3px] border-black bg-white p-[3px] h-5"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(progressPercent)}
                                aria-label="Goal progress"
                            >
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`flex-1 rounded-[2px] transition-colors duration-300 ${
                                            i < Math.round(progressPercent / 5)
                                                ? isComplete
                                                    ? "bg-[#A2E4B8]"
                                                    : "bg-[#FF007F]"
                                                : "bg-black/[0.08]"
                                        }`}
                                    />
                                ))}
                            </div>

 <p className="mt-2 text-[12px] font-black uppercase tracking-widest text-black/60">
                                {isComplete
                                    ? "Goal reached"
                                    : `${fmt(remainingAmount)} left`}
                            </p>
                        </div>

                        {!isCreator && !isClosed && (
 <p className="text-[12px] font-black uppercase tracking-widest text-black/60 mt-4 mb-2">
                                Step {step} of 3 ·{" "}
                                {step === 1
                                    ? "Choose amount"
                                    : step === 2
                                      ? "Your details"
                                      : "Payment"}
                            </p>
                        )}

                        {step === 1 && !noticeBelow && (
                                <div className="animate-fade-in">
                                    {/* ⚠️ 2-up on a phone. Four tiles across a 350px card left each
                                        cell ~70px, so "£100.00" clipped inside its own
                                        border while the page reported no overflow. */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4">
                                        {presetAmounts.map((val) => {
                                            const disabled = val > maxAllowed;
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() =>
                                                        selectPreset(val)
                                                    }
                                                    disabled={disabled}
                                                    aria-pressed={
                                                        selectegTag === val
                                                    }
 className={`min-w-0 min-h-[48px] py-2 rounded-box-sm border-[3px] border-black font-black text-sm transition-all ${disabled ? "bg-gray-200 text-black/60 cursor-not-allowed" : selectegTag === val ? "bg-[#A2E4B8] active:translate-y-[2px]" : "bg-white hover:bg-black/[0.04] active:translate-y-[2px]"}`}
                                                >
                                                    {fmt(val)}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setselectegTag("custom");
                                                setAmount("");
                                                setData("amount", "");
                                            }}
                                            aria-pressed={
                                                selectegTag === "custom"
                                            }
 className={`px-2 min-h-[48px] rounded-box-sm border-[3px] border-black font-black text-sm transition-colors duration-200 active:translate-y-[2px] ${selectegTag === "custom" ? "bg-[#A2E4B8]" : "bg-white hover:bg-black/[0.04]"}`}
                                        >
                                            CUSTOM
                                        </button>
                                    </div>

                                    {selectegTag === "custom" && (
                                        <div className="mb-4 animate-fade-in">
                                            <label
                                                htmlFor="pp-amount"
                                                className={labelBase}
                                            >
                                                Amount ({potCurrency})
                                            </label>
                                            <input
                                                id="pp-amount"
                                                className={`${fieldBase} text-lg ${fieldErrors.amount ? "border-red-600" : ""}`}
                                                value={amount}
                                                onChange={handleCustomAmount}
                                                type="number"
                                                inputMode="decimal"
                                                min={MIN_AMOUNT}
                                                max={maxAllowed}
                                                step="0.01"
                                                aria-describedby="pp-amount-help"
                                                placeholder={`${MIN_AMOUNT}`}
                                            />
                                            <p
                                                id="pp-amount-help"
                                                className="text-xs font-bold text-black/60 mt-1 px-1"
                                            >
                                                {fmt(MIN_AMOUNT)} –{" "}
                                                {fmt(maxAllowed)}
                                            </p>
                                        </div>
                                    )}

                                    <FieldError name="amount" />

                                    {/* 🚨 A DISABLED PRIMARY CTA MUST SAY WHY.
                                        This shipped greyed and reading "Unlock
                                        Content" before the visitor had done
                                        anything wrong, so the page's one buy
                                        button looked unavailable on arrival —
                                        and, being `disabled`, it is not
                                        focusable, so a keyboard user never met
                                        it at all. The label now states the
                                        missing step; `aria-disabled` keeps it in
                                        the tab order so it can be read. */}
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        aria-disabled={!amount}
                                        className={`${primaryBtn} mt-2 ${!amount ? primaryOff : primaryOn}`}
                                    >
                                        {amount ? "Unlock Content" : "Choose an amount first"}
                                    </button>
                                </div>
                            )}

                        {step === 2 && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-black text-sm uppercase">
                                        Your Details
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-xs font-bold text-black/60 hover:text-black underline py-2 px-1"
                                    >
                                        Back to amount
                                    </button>
                                </div>

                                <div>
                                    <label
                                        htmlFor="pp-message"
                                        className={labelBase}
                                    >
                                        Note to the creator (optional)
                                    </label>
                                    <textarea
                                        id="pp-message"
                                        className={`${fieldBase} min-h-[88px]`}
                                        value={data.message}
                                        onChange={(e) =>
                                            setData("message", e.target.value)
                                        }
                                        placeholder="Say something to the creator."
                                    />
                                </div>

                                {!auth?.user && (
                                    <>
                                        <div>
                                            <label
                                                htmlFor="pp-name"
                                                className={labelBase}
                                            >
                                                Display name
                                            </label>
                                            <input
                                                id="pp-name"
                                                className={`${fieldBase} ${fieldErrors.name ? "border-red-600" : ""}`}
                                                value={data.name}
                                                onChange={(e) => {
                                                    setData(
                                                        "name",
                                                        e.target.value,
                                                    );
                                                    setFieldErrors((err) => ({
                                                        ...err,
                                                        name: null,
                                                    }));
                                                }}
                                                type="text"
                                                autoComplete="nickname"
                                                placeholder="How the creator sees you"
                                            />
                                            <FieldError name="name" />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="pp-email"
                                                className={labelBase}
                                            >
                                                Email
                                            </label>
                                            <input
                                                id="pp-email"
                                                className={`${fieldBase} ${fieldErrors.email ? "border-red-600" : ""}`}
                                                value={data.email}
                                                onChange={(e) => {
                                                    setData(
                                                        "email",
                                                        e.target.value,
                                                    );
                                                    setFieldErrors((err) => ({
                                                        ...err,
                                                        email: null,
                                                    }));
                                                }}
                                                type="email"
                                                autoComplete="email"
                                                inputMode="email"
                                                aria-describedby="pp-email-help"
                                                placeholder="you@example.com"
                                            />
                                            <FieldError name="email" />
                                            <p
                                                id="pp-email-help"
                                                className="text-xs text-black/60 mt-1 font-bold px-1"
                                            >
                                                Your content and receipt are
                                                sent here. Never shown to the
                                                creator.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {featuredPot.allow_anonymous && (
                                    <label className="flex items-center cursor-pointer gap-3 px-1 py-2 min-h-[44px]">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={!!data.anonymous}
                                                onChange={(e) =>
                                                    setData(
                                                        "anonymous",
                                                        e.target.checked
                                                            ? 1
                                                            : 0,
                                                    )
                                                }
                                            />
                                            <div
                                                className={`block w-11 h-7 rounded-full border-[3px] border-black transition-colors ${data.anonymous ? "bg-pink-500" : "bg-gray-300"}`}
                                            ></div>
                                            <div
                                                className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full border-[3px] border-black transition-transform ${data.anonymous ? "transform translate-x-4" : ""}`}
                                            ></div>
                                        </div>
                                        <span className="font-bold text-sm">
                                            Hide my name from the public list
                                        </span>
                                    </label>
                                )}

                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className={`${primaryBtn} mt-2 ${primaryOn}`}
                                >
                                    Continue
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col animate-fade-in">
                                <div className="flex justify-between items-center pb-3">
                                    <h4 className="font-black text-lg uppercase">
                                        Final Step
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="text-xs font-bold text-black/60 hover:text-black underline py-2 px-1"
                                    >
                                        Back
                                    </button>
                                </div>

                                <OrderContextCard
                                    className="mb-3"
                                    image={featuredPot.cover_media}
                                    typeBadge="Piggy Pot"
                                    itemTitle={featuredPot.title}
                                    itemSub={
                                        featuredPot.content_description ||
                                        featuredPot.description
                                    }
                                    payingLabel="You're unlocking from"
                                    creatorName={user?.name}
                                    creatorUsername={user?.username}
                                    creatorAvatar={user?.avatar_url}
                                    whatYouGet={[
                                        ...rewardLines(featuredPot),
                                        "Access to this pot's content after payment",
                                        "Your purchase counts toward the creator's goal",
                                        "A one-time payment — nothing recurring",
                                    ]}
                                />

                                <div className="rounded-box-sm border-[3px] border-black bg-gray-50 p-4 mb-3">
                                    <div className="flex justify-between items-center font-bold text-sm text-black/60">
                                        <span>Creator receives</span>
                                        <span>{fmt(data.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-black text-lg mt-2 pt-2 border-t-[3px] border-black">
                                        <span>You pay</span>
                                        <span className="text-[#FF007F]">
                                            {totalCharged != null
                                                ? fmt(totalCharged)
                                                : "Calculating…"}
                                        </span>
                                    </div>
 <p className="text-[12px] font-bold text-black/60 mt-2">
                                        Includes payment processing and platform
                                        fees.
                                    </p>
                                </div>

                                <PaymentMethodSelector
                                    amount={parseFloat(data.amount) || 0}
                                    currency={potCurrency}
                                    email={data.email || auth?.user?.email}
                                    creatorId={featuredCreatorId}
                                    value={data.payment_method}
                                    onChange={(m) =>
                                        setData("payment_method", m)
                                    }
                                    onPrices={setPrices}
                                    className="mb-2"
                                />

                                <CheckoutLegalTerms
                                    onAgreeChange={(checked) => {
                                        setData("agree", checked);
                                        setData("digital_waiver", checked);
                                        setFieldErrors((err) => ({
                                            ...err,
                                            waiver: null,
                                        }));
                                    }}
                                />

                                <FieldError name="waiver" />

                                {turnstileSiteKey ? (
                                    <div className="flex justify-center my-3">
                                        <Turnstile
                                            ref={turnstileRef}
                                            size="normal"
                                            theme="light"
                                            onVerify={onTurnstileVerify}
                                        />
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={handleContribute}
                                    disabled={
                                        loading ||
                                        !data.digital_waiver ||
                                        totalCharged == null ||
                                        (turnstileSiteKey && !verified)
                                    }
                                    aria-busy={loading}
                                    className={`${primaryBtn} ${!data.digital_waiver || loading || totalCharged == null || (turnstileSiteKey && !verified) ? primaryOff : primaryOn}`}
                                >
                                    {loading
                                        ? "Processing…"
                                        : totalCharged == null
                                          ? "Calculating…"
                                          : "Unlock content"}
                                </button>
                                <div className="mt-2 text-center text-xs font-bold text-black/60">
                                    🔒 Secured via Stripe
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* No purchase flow for the owner or a closed pot — the notice spans
                    the full card under the cover+content row instead of squeezing
                    into the right column. */}
                {isCreator ? (
                    <div className="animate-fade-in mt-5 flex flex-col gap-3 rounded-box border-[3px] border-black bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="font-black text-sm uppercase tracking-widest text-black">
                                Your content
                            </p>
                            <p className="text-black/60 text-sm font-bold mt-1">
                                Creators can&apos;t purchase their own content.
                            </p>
                        </div>
                        <Link
                            href={route("piggy-pots.index")}
 className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-box-sm border-2 border-black bg-[#A2E4B8] px-5 py-2 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-[#8fdcaa]"
                        >
                            Edit Piggy Pot
                        </Link>
                    </div>
                ) : isClosed ? (
                    <div className="animate-fade-in mt-5 flex flex-col gap-3 rounded-box border-[3px] border-black bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="font-black text-sm uppercase tracking-widest text-black">
                                Not available
                            </p>
                            <p className="text-black/60 text-sm font-bold mt-1">
                                {closedReason}
                            </p>
                        </div>
                        {(featuredPot.creator?.username || user?.username) && (
                            <Link
                                href={route("user.show", {
                                    username:
                                        featuredPot.creator?.username ||
                                        user?.username,
                                })}
                                className="inline-flex shrink-0 items-center justify-center rounded-box-sm border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-gray-100"
                            >
                                See other content
                            </Link>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Rendered OUTSIDE the form so backing out of it leaves the
                contribution exactly as it was — the amount, the email and the
                accepted terms all survive, and one more attempt completes. */}
            <StepUpModal
                open={showStepUp}
                ui={stepUpUi}
                context={stepUpContext}
                fallbackEmail={data.email}
                fallbackDeviceId={data.device_id}
                onClose={() => setShowStepUp(false)}
                onVerified={() => {
                    // The server consumes the verification from the session on
                    // the next attempt, so this simply re-submits.
                    setShowStepUp(false);
                    setStepUpContext(null);
                    handleContribute();
                }}
            />
        </div>
    );
}
