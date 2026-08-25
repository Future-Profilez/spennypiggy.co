import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
/**
 * The same field every other door uses. This screen had NO shell at all — a bare
 * `<form>` of legacy `TextInput`s dropped straight into GuestLayout, so it
 * rendered as unstyled markup on a white page while login, forgot-password and
 * the reset confirmation all share one panel.
 */
import Field from './register/Field';

export default function ResetPassword({ token, email }) {
    // A reveal toggle, not a second "confirm password" box — the house pattern
    // from registration, login and the reset confirmation. The server rule is
    // still `confirmed`, satisfied by writing `password_confirmation` alongside
    // `password` in the same `setData`.
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        // Re-entrancy guard: the disabled re-render loses the double-tap race.
        if (processing) return;
        post(route('password.store'));
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="relative flex min-h-[85dvh] flex-col justify-center overflow-hidden bg-[#0B0B0C] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-6 sm:pt-12 lg:py-16">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                        background:
                            'radial-gradient(55% 55% at 50% 38%, #05EFB8 0%, transparent 70%)',
                    }}
                />

                {/* Same grid, same DOM order, same `auto` rows as the rest of the
                    flow — `1fr 1fr` inflates the short row and floats the panel. */}
                <div className="relative mx-auto grid w-full max-w-[440px] gap-6 lg:max-w-[980px] lg:grid-cols-[minmax(0,1fr)_440px] lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-6">
                    <header className="lg:col-start-1 lg:row-start-1 lg:self-start">
                        <h1 className="font-gulfs text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[52px] lg:leading-[0.95]">
                            Reset password
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

                    <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start">
                        <div className="rounded-box border-black bg-white p-4 sm:p-6">
                            <form onSubmit={submit} className="space-y-4" noValidate>
                                <Field
                                    id="email"
                                    label="Email address"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    placeholder="you@example.com"
                                    error={errors.email}
                                    status={errors.email ? 'error' : 'idle'}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />

                                <Field
                                    id="password"
                                    label="New password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="Your new password"
                                    error={
                                        errors.password ||
                                        errors.password_confirmation
                                    }
                                    status={
                                        errors.password ||
                                        errors.password_confirmation
                                            ? 'error'
                                            : 'idle'
                                    }
                                    onChange={(e) =>
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
                                                    ? 'Hide password'
                                                    : 'Show password'
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

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`!mt-5 flex min-h-[56px] w-full items-center justify-center rounded-box-sm border-black bg-[#05EFB8] font-gulfs text-base uppercase tracking-[0.14em] text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 motion-reduce:hover:translate-y-0 ${
                                        processing
                                            ? 'cursor-not-allowed opacity-70 hover:translate-y-0'
                                            : ''
                                    }`}
                                >
                                    {processing
                                        ? 'Updating…'
                                        : 'Save new password'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <aside className="lg:col-start-1 lg:row-start-2 lg:self-start">
                        <p className="text-center text-sm text-white/60 lg:text-left">
                            Remembered it?{' '}
                            <Link
                                href={route('login')}
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
