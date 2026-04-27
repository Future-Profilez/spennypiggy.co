import LoaderButton from "@/Components/LoaderButton";
import { useForm, usePage } from "@inertiajs/react";

export default function PaymentDashboard({auth, classes, text, trigger}){
    const { auth: pageAuth } = usePage().props;
    const {data, post, processing} = useForm();

    const handleStripeLogin = (e) => {
        e.preventDefault();
        
        // Pass user's country if available to ensure correct account creation if needed
        const country = auth?.user?.country || pageAuth?.user?.country || "";
        
        post(route("stripe.login", { country: country }),{
            preserveScroll:true,
        });
    }

    if (trigger) {
        return (
            <div onClick={handleStripeLogin} className={classes}>
                {trigger}
            </div>
        )
    }

    return(

        <LoaderButton onClick={handleStripeLogin}
            disabled={processing}
            className={classes}
            spinnerclass="fill-red-600" >
            {processing
                ? "Connecting"
                : text}
        </LoaderButton>
    )
}
