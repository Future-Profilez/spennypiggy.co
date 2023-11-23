import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import Popup from "@/Components/Popup";
import PriceFormat from "@/includes/PriceFormat";
import { useState } from "react";

export default function SendSurprise({owner}) {

   const { format } = PriceFormat();

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [close, setClose] = useState();

    const [amount, setAmount] = useState();
    const [message, setMessage] = useState();

    const sendSurprise = (e) => {
        setLoading(true);
        window.location.href = `/send-surprize/${owner}?amount=${amount}&message=${message}`;
   };

    return (
      <Popup modalclass='pinkmodal sendSurprize-modal' space='4' size='md' action={close}
            classes={`btn-pink lg px-4 w-100`}
            text={`Send Surprise`} >
            <h2 className="text-uppercase font-GillSans pb-4 font-large">Send a Surprise Gift</h2>


            <div className="form-field mb-4">
                  <label className="d-block text-start mb-2" >Amount</label>
                  <input className="form-input w-100 rounded" onChange={(e) => setAmount(e.target.value)} type="text" placeholder="Enter" />
                  <p className="mt-1" >The amount is set to {format(amount)} GBP in the wisher's currency</p>
            </div>

            <div className="form-field mb-4">
                  <label className="d-block text-start mb-2" >Suggested use (optional)</label>
                  <textarea placeholder='Message...' className="form-input w-100 rounded"
                  onChange={(e) => setMessage(e.target.value)} type="text" />
            </div>

            <LoaderButton
               disabled={loading} onClick={sendSurprise}
               className="flex w-100 btn-pink lg mx-auto"
               spinnerClassName="fill-red-600" > {loading ? "Proccessing" : "Send Surprize Gift"}
            </LoaderButton>

      </Popup>
    );
}
