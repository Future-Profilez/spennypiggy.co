import { useEffect, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
/**
 * The same field the person signed up, signed in and asked for the link with.
 * Login, registration and forgot-password all render `register/Field.jsx`; this
 * screen — the LAST step of the reset flow — was still on the legacy
 * `blackbg`/`containerbox` classes inside the fake browser window (traffic-light
 * dots) that the rest of the flow has lost, over hand-rolled `TextInput`
 * markup. One flow changed appearance twice on the way through.
 */
import Field from "./register/Field";

export default function ConfirmPassword(props) {
    const { uuid, token = "", auth } = props;
    const { successAlert, errorAlert } = useAlerts();

    // A reveal toggle, not a second "confirm password" box — the same reasoning
    // that removed confirm-password from registration and login. Retyping a
    // password you cannot see only ever costs time; being able to READ it is
    // what actually prevents the typo. The server rule is still `confirmed`,
    // which is satisfied by writing `password_confirmation` alongside
    // `password` in the same `setData` below.
    const [showPassword, setShowPassword] = useState(false);

    // `token` is the single-use reset token from the emailed link. The uuid alone is
    // a public identifier and proves nothing — the server refuses without this.
    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
        password_confirmation: "",
        token,
    });

    useEffect(() => {
        return () => {
            reset("password");
            reset("password_confirmation");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        if (processing) return;
        if (!token) {
            errorAlert(
                "This reset link is missing its security token. Please open the link from your email again, or request a new one.",
            );
            return;
        }
        post(route("changePassword", { uuid: uuid }), {
            preserveScroll: true,
            onSuccess: (resp) => {
                if (resp.props.flash?.success) {
                    successAlert(resp.props.flash?.success);
                }
                if (resp.props.flash?.error) {
                    errorAlert(resp.props.flash?.error);
                }
                reset();
            },
            onError: (err) => {
                reset("password");
                reset("password_confirmation");
                Object.keys(err).map((key) => {
                    errorAlert(err[key]);
                });
            },
        });
    };

    return (
        <GuestLayout auth={auth && auth.user} user={auth && auth.user}>
            <Head title="Set a new password" />

            {/*
                Login's shell, exactly: #0B0B0C, one mint wash, a white bordered
                panel and the same field. The accent is MINT like the rest of the
                reset flow — pink is the creator's colour and violet the
                supporter's, and this screen serves both.
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
                    Same two-column grid as login and forgot-password, same single
                    DOM order: heading, panel, then the way back. Rows are `auto`,
                    never `1fr 1fr` — equal fractions force the short row under the
                    heading to match the heading's own height, which inflates the
                    block and floats the panel in dead space.
                */}
                <div className="relative mx-auto grid w-full max-w-[440px] gap-6 lg:max-w-[980px] lg:grid-cols-[minmax(0,1fr)_440px] lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-6">
                    <header className="lg:col-start-1 lg:row-start-1 lg:self-start">
                        <h1 className="font-gulfs text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[52px] lg:leading-[0.95]">
                            Set a new password
                        </h1>
                        <span
                            aria-hidden="true"
                            className="mt-4 block h-1 w-16 rounded-full bg-[#05EFB8]"
                        />
                        <p className="mt-4 max-w-[34ch] text-sm text-white/70 lg:text-base">
                            Choose a new password for your account. This link
                            works once, and any "remember me" sessions will need
                            to sign in again.
                        </p>
                    </header>

                    {/* `self-start` so the panel's top edge lines up with the top
                        of the headline. */}
                    <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start">
                        <div className="rounded-box border-[3px] border-black bg-white p-4 sm:p-6">
                            <form onSubmit={submit} noValidate>
                                <Field
                                    id="password"
                                    label="New password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={data.password}
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="Your new password"
                                    error={errors.password}
                                    status={errors.password ? "error" : "idle"}
                                    onChange={(e) =>
                                        // Written to both keys at once: the server
                                        // rule is `confirmed`, and the screen only
                                        // asks once.
                                        setData((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                            password_confirmation:
                                                e.target.value,
                                        }))
                                    }
                                    suffix={
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            aria-pressed={showPassword}
                                            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-black/60 transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                                        >
                                            {showPassword ? (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M3 3l18 18" />
                                                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                                    <path d="M16.7 16.7A9.7 9.7 0 0 1 12 18c-5 0-9-6-9-6a17 17 0 0 1 4.2-4.7m3-1.1A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.2 2.8" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="3"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    }
                                />

                                <LoaderButton
                                    disabled={processing}
                                    className={`!mt-5 flex min-h-[56px] w-full items-center justify-center rounded-box-sm border-[3px] border-black !bg-[#05EFB8] font-gulfs text-base uppercase tracking-[0.14em] !text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 motion-reduce:hover:translate-y-0 ${
                                        processing
                                            ? "cursor-not-allowed opacity-70 hover:translate-y-0"
                                            : ""
                                    }`}
                                    spinnerclass="fill-black"
                                >
                                    {processing
                                        ? "Updating…"
                                        : "Save new password"}
                                </LoaderButton>
                            </form>
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
