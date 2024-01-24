import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import axios from "axios";
import { useState } from "react";

export default function DirectCheckout({ item, amount, classes }) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [quantity, setquantity] = useState(1);
    const checkout = (e) => {
        if(amount < 1){
            errorAlert("Amount can not be empty.")
            return false;
        }
        setLoading(true);
        window.location.href = `/anonymous-create-checkout-session/${
            item.id || ""
        }/${amount || ""}`;
    };

    return (
        <button className={`btn-pink lg w-100 ${classes}`} onClick={checkout}> Pay Now</button>
    );
}
