import LoaderButton from "@/Components/LoaderButton";
import { useForm } from "@inertiajs/react";

export default function PaymentDashboard({auth, classes, text}){
    const {data, post, processing} = useForm();

    const handleStripeLogin = (e) => {
        e.preventDefault();
        post(route("stripe.login"),{
            preserveScroll:true,
        });
    }

    return(

        <LoaderButton onClick={handleStripeLogin}
            disabled={processing}
            className={classes}
            spinnerClassName="fill-red-600" >
            {processing
                ? "Connecting"
                : text}
        </LoaderButton>
    )
}
