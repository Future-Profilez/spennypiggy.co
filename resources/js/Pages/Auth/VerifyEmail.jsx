import GuestLayout from "@/Layouts/GuestLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import { Head, Link, useForm } from "@inertiajs/react";

export default function VerifyEmail({ status }) {
    const { get, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        get(route("verification.email"));
    };

    return (
        // <GuestLayout>
        //     <Head title="Email Verification" />

        //     {/* <div className="mb-4 text-sm text-gray-600">
        //         Thanks for signing up! Before getting started, could you verify
        //         your email address by clicking on the link we just emailed to
        //         you? If you didn't receive the email, we will gladly send you
        //         another.
        //     </div> */}

        //     {/* {status === "verification-link-sent" && (
        //         <div className="mb-4 font-medium text-sm text-green-600">
        //             A new verification link has been sent to the email address
        //             you provided during registration.
        //         </div>
        //     )} */}

        //     <div className="mb-4 text-sm text-gray-600">
        //         Thanks for signing up! Before getting started, please verify
        //         your email address by clicking on the link we just emailed to
        //         you.
        //     </div>

        //     <form onSubmit={submit}>
        //         <div className="mt-4 flex items-center justify-content-center">
        //             <PrimaryButton disabled={processing}>
        //                 Send Verification Email
        //             </PrimaryButton>

        //             {/* <Link
        //                 href={route('logout')}
        //                 method="post"
        //                 as="button"
        //                 className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        //             >
        //                 Log Out
        //             </Link> */}
        //         </div>
        //     </form>
        // </GuestLayout>
        <div style={{ backgroundColor: "black" }}>
            <div className="mb-4 text-sm text-gray-600 text-center text-white text-white mt-5">
                Thanks for signing up! Before getting started, please verify
                your email address by clicking on the button then we send an
                email to you.
            </div>
            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-content-center">
                    <PrimaryButton disabled={processing}>
                        Send Verification Email
                    </PrimaryButton>

                    {/* <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Log Out
                    </Link> */}
                </div>
            </form>
        </div>
    );
}
