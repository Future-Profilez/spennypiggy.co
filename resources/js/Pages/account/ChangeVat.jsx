import { useAlerts } from "@/Components/Alerts";
import  LoaderButton from "@/Components/LoaderButton";
import { useForm } from "@inertiajs/react";
import Select from 'react-select';
import { useState } from "react";
import { usePage, Link } from '@inertiajs/react';
import axios from 'axios';

export default function ChangeVat({defaultvalue, updatevat}) {

   const { flash } = usePage().props;
   const { successAlert, errorAlert } = useAlerts();
   const { data, setData, get, processing, errors, reset } = useForm({
      percent: defaultvalue,
   });


   const [selectedVat, setselectedVat] = useState(defaultvalue);
   const handleinput = (e) => {
      setselectedVat(e.target.value);
      setData('percent', e.target.value);
   }

   const changeVat = async (e) => {
      axios.get(`/update-vat/${selectedVat}`)
      .then((resp) => {
        successAlert(resp.data.message);
        updatevat && updatevat(selectedVat);
      })
      .catch((_err) => {
          console.error("error", _err);
          errorAlert(resp.data.msg);
      });
   };

   return <>
      <h2 className="uppercase font-GillSans pb-1 font-large"> Add VAT </h2>
      <p className="pb-4 font-normal text-gray-500">Add VAT percetage here eg. 40%</p>
      <div className="form-field mb-4">
          {/* <label className="d-block text-start"></label> */}
          <input defaultValue={defaultvalue} onChange={handleinput} type="number" placeholder="VAT Percent" className="input-field w-full border rounded-[40px]  p-3 py-3" />
      </div>
      <LoaderButton onClick={()=>changeVat(data.currency)}
        disabled={processing}
        type='submit'
        className="p w-full"
        spinnerclass="fill-red-600" >
        {processing ? "Updating.." : "Update"}
      </LoaderButton>
   </>
}
