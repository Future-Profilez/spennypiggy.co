import GuestLayout from "@/Layouts/GuestLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import { Head, Link, useForm } from "@inertiajs/react";

export default function VerifyEmail({ status }) {
    const { get, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        get(route("verification.email"));
    };

    return <div className="blackbg pageheight p-4">
        <div>
            <Head title="Email Verification" />

            <div  >
                <h4 className="headingsm text-center text-mint w-75 m-auto d-table" >Thanks for signing up! Before getting started, please verify
                    your email address by clicking on the button then we send an
                    email to you.</h4>
                <form onSubmit={submit}>
                    <div className="mt-4 flex items-center justify-content-center">
                        <PrimaryButton className="btn-pink md py-3 px-2" disabled={processing}>
                            Send Verification Email
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    </div>
}
