import LoaderButton from "@/Components/LoaderButton";

export default function PaymentDashboard({ classes, text }) {
    return (
        <form
            action={route("stripe.login")}
            method="POST"
            target="_blank"
        >
            {/* CSRF token for Laravel */}
            <input
                type="hidden"
                name="_token"
                value={
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content")
                }
            />

            <LoaderButton className={classes}>
                {text}
            </LoaderButton>
        </form>
    );
}
