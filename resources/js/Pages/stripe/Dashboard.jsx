import { useForm } from "@inertiajs/react";

export default function StripeDashboard({auth}){
    const {data, post, processing} = useForm();

    const handleStripeLogin = (e) => {
        e.preventDefault();
        post(route("stripe.login"),{
            preserveScroll:true,
        });
    }

    return(
        <form onSubmit={handleStripeLogin}>
            <button type="submit" disabled={processing} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700">{processing ? "Connecting" : "Dashboard"}</button>
        </form>
    )
}
