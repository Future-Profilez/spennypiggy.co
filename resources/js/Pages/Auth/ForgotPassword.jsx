import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";
import { useState } from "react";
/**
 * The same field the person signed up and signed in with. Login and registration
 * both render `register/Field.jsx`; this page had its own `<ul><li><label>` markup
 * over the legacy `TextInput`, so the third screen of one flow looked like a
 * different product again.
 */
import Field from "./register/Field";

/**
 * How long a reset link stays usable.
 *
 * Mirrors `PasswordResetLinkController::LINK_TTL_MINUTES`. Ten minutes is short
 * enough that someone who goes to make tea comes back to a dead link, so it is
 * said BEFORE the address is typed rather than only in the toast afterwards —
 * that is the difference between one reset and three.
 *
 * ⚠️ Keep in step with the constant. A page promising a window the server does
 * not honour is worse than saying nothing.
 */
const LINK_TTL_MINUTES = 10;

export default function ForgotPassword(props) {
    const { successAlert, errorAlert } = useAlerts();
    const { status, auth } = props;
    const { data, setData, errors } = useForm({
        email: "",
    });

    const [loading, setLoading] = useState(false);
    /**
     * The address the link actually went to.
     *
     * The old page cleared the field and relied on a toast, so seconds later the
     * screen was an empty form again — indistinguishable from a request that never
     * happened, which is precisely when someone sends a second link and kills the
     * first one.
     */
    const [sentTo, setSentTo] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        // Re-entrancy guard: the disabled re-render loses the double-tap race, and
        // each extra submit sends another reset mail and invalidates the last link.
        if (loading) return;
        setLoading(true);
        axios
            // Absolute, never relative. This page is served at BOTH `/forgot-password`
            // and (after a failed reset) other paths — a relative "forgot-password"
            // resolves against whatever the current directory happens to be.
            .post(route("password.email"), { email: data.email })
            .then((resp) => {
                if (resp.data.status) {
                    successAlert(resp.data.message);
                    setSentTo(data.email);
                    setData("email", "");
                } else {
                    errorAlert(resp.data.message);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Forgot password error:", err);
                // ⚠️ This branch called `setQuantity(intialItem)` — neither exists
                // here — so every failed request threw a ReferenceError instead of
                // showing anything, under the message "Unable to update quantity."
                const code = err?.response?.status;
                if (code === 429) {
                    errorAlert(
                        "Too many attempts. Please wait a minute and try again.",
                    );
                } else {
                    errorAlert(
                        err?.response?.data?.message ||
                            "We couldn't send the reset email. Please try again.",
                    );
                }
                setLoading(false);
            });
    };

    const sendAgain = () => {
        setSentTo(null);
    };

    return (
        <GuestLayout auth={auth && auth.user} user={auth && auth.user}>
            <Head title="Forgot password" />

            {/*
                Login's shell, exactly: #0B0B0C, one mint wash, a white bordered panel
                and the same field. This page was on the legacy `blackbg`/`headingLg`
                classes inside the fake browser window (traffic-light dots) that login
                has just lost, so the flow changed appearance halfway through.
            */}
            <div className="relative flex min-h-[85dvh] flex-col justify-center overflow-hidden bg-[#0B0B0C] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-6 sm:pt-12 lg:py-16">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                        background:
                            "radial-gradient(55% 55% at 50% 38%, #05EFB8 0%, transparent 70%)",
                    }}
                />

                {/*
                    Same two-column grid as login, same single DOM order: heading,
                    panel, then the way back. A phone stacks in the order it is used.
                */}
                <div className="relative mx-auto grid w-full max-w-[440px] gap-6 lg:max-w-[980px] lg:grid-cols-[minmax(0,1fr)_440px] lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-6">
                    <header className="lg:col-start-1 lg:row-start-1 lg:self-start">
                        <h1 className="font-gulfs text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[52px] lg:leading-[0.95]">
                            Reset your password
                        </h1>
                        <span
                            aria-hidden="true"
                            className="mt-4 block h-1 w-16 rounded-full bg-[#05EFB8]"
                        />
                        <p className="mt-4 max-w-[34ch] text-sm text-white/70 lg:text-base">
                            Tell us the email address on your account and we'll
                            send a link to choose a new password.
                        </p>

                        {/*
                            Both facts are things people learn the hard way: the
                            window is ten minutes, and asking for a second link
                            silently kills the first (`createToken` deletes the
                            existing row). Someone who reads this stops hunting
                            through their inbox for the older mail.
                        */}
                        <dl className="mt-6 max-w-[36ch] space-y-3 border-l-2 border-white/15 pl-4 text-sm">
                            <div>
                                <dt className="font-semibold text-white">
                                    The link lasts {LINK_TTL_MINUTES} minutes
                                </dt>
                                <dd className="text-white/60">
                                    Open it as soon as it arrives.
                                </dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-white">
                                    Only the newest link works
                                </dt>
                                <dd className="text-white/60">
                                    Asking for another one cancels the last.
                                </dd>
                            </div>
                        </dl>
                    </header>

                    {/*
                        `self-start`: the panel's top edge lines up with the top of the
                        headline. Rows are `auto`, never `1fr 1fr` — equal fractions
                        forced the one-line row below the heading to match the heading's
                        own height, which inflated the whole block and pushed the panel
                        far down the page against nothing.
                    */}
                    <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start">
                        {status && (
                            <p className="mb-4 rounded-box-sm border-2 border-[#05EFB8]/40 bg-[#05EFB8]/10 px-4 py-3 text-sm font-medium text-[#05EFB8]">
                                {status}
                            </p>
                        )}

                        <div className="rounded-box border-[3px] border-black bg-white p-4 sm:p-6">
                            {sentTo ? (
                                /*
                                    A state, not a toast. It names the address the mail
                                    went to, which is the one thing that turns "nothing
                                    arrived" into "I typed it wrong" without a support
                                    ticket.
                                */
                                <div>
                                    <span
                                        aria-hidden="true"
                                        className="grid h-12 w-12 place-items-center rounded-full bg-[#05EFB8]"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#000"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-6 w-6"
                                        >
                                            <path d="m3 7 9 6 9-6" />
                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="14"
                                                rx="2"
                                            />
                                        </svg>
                                    </span>

                                    <h2 className="mt-4 font-gulfs text-xl uppercase leading-tight text-black">
                                        Check your inbox
                                    </h2>
                                    <p className="mt-2 text-sm text-black/70">
                                        We sent a reset link to{" "}
                                        <strong className="font-semibold text-black">
                                            {sentTo}
                                        </strong>
                                        . It works for the next{" "}
                                        {LINK_TTL_MINUTES} minutes.
                                    </p>
                                    <p className="mt-2 text-sm text-black/60">
                                        Nothing there? Check spam, and confirm
                                        the address above is the one on your
                                        account.
                                    </p>

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <Link
                                            href={route("login")}
                                            className="flex min-h-[52px] flex-1 items-center justify-center rounded-box-sm border-[3px] border-black bg-[#05EFB8] font-gulfs text-sm uppercase tracking-[0.14em] text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 motion-reduce:hover:translate-y-0"
                                        >
                                            Back to sign in
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={sendAgain}
                                            className="flex min-h-[52px] flex-1 items-center justify-center rounded-box-sm border-[3px] border-black bg-white text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 motion-reduce:hover:translate-y-0"
                                        >
                                            Use another address
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={submit} noValidate>
                                    <Field
                                        id="email"
                                        label="Email address"
                                        type="email"
                                        name="email"
                                        required
                                        value={data.email}
                                        autoComplete="username"
                                        autoFocus
                                        placeholder="you@example.com"
                                        error={errors.email}
                                        status={errors.email ? "error" : "idle"}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />

                                    <LoaderButton
                                        disabled={loading}
                                        className={`!mt-5 flex min-h-[56px] w-full items-center justify-center rounded-box-sm border-[3px] border-black !bg-[#05EFB8] font-gulfs text-base uppercase tracking-[0.14em] !text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 motion-reduce:hover:translate-y-0 ${
                                            loading
                                                ? "cursor-not-allowed opacity-70 hover:translate-y-0"
                                                : ""
                                        }`}
                                        spinnerclass="fill-black"
                                    >
                                        {loading
                                            ? "Sending…"
                                            : "Send reset link"}
                                    </LoaderButton>
                                </form>
                            )}
                        </div>
                    </div>

                    <aside className="lg:col-start-1 lg:row-start-2 lg:self-start">
                        <p className="text-center text-sm text-white/60 lg:text-left">
                            Remembered it?{" "}
                            <Link
                                href={route("login")}
                                className="font-semibold text-[#05EFB8] underline decoration-2 underline-offset-4"
                            >
                                Back to sign in
                            </Link>
                        </p>
                    </aside>
                </div>
            </div>
        </GuestLayout>
    );
}
