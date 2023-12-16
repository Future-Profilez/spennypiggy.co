import { useAlerts } from "@/Components/Alerts";
import React from "react";
import  LoaderButton from "@/Components/LoaderButton";
import { useForm } from "@inertiajs/react";
import Select from 'react-select';
import { useState } from "react";
import { usePage } from '@inertiajs/react';
import Dropdown from 'react-bootstrap/Dropdown';

export default function ChangeCurrency({defaultvalue, changer}) {
   
   const { flash } = usePage().props;
   const { successAlert, errorAlert } = useAlerts();
   const { data, setData, get, processing, errors, reset } = useForm({
      currency: defaultvalue,
   });

   const currencies = [
      { value: 'GBP', label: '£ British Pound Sterling' },
      { value: 'USD', label: '$ United States Dollar' },
      { value: 'AUD', label: '$ Australian Dollar' },
      { value: 'EUR', label: '€ Euro' },
      { value: 'JPY', label: '¥ Japanese Yen' },
      { value: 'HKD', label: '$ Hong Kong Dollar' },
      { value: 'CAD', label: '$ Canadian Dollar' },
      { value: 'CHF', label: 'Swiss Franc' },
      { value: 'SEK', label: 'Swedish Krona' },
      { value: 'NZD', label: '$ New Zealand Dollar' },
   ];

   const [selectedCurrency, setSelectedCurrency] = useState(null);
   const handleSelect = (e) => {
      setSelectedCurrency(e.value);
      setData('currency', e.value);
   }

   const changeCurrency = (e) => {
      // e.preventDefault();
      console.log(e)
      get(route(`change.currency`, { c: e } ),{
            preserveScroll: true,
            onSuccess: (resp) => {
               if (flash?.error) {
                  errorAlert(flash.error);
              }
              if (flash?.success) {
                  successAlert(flash.success);
              }
              if (flash?.warning) {
                  warningAlert(flash.warning);
              }
              if (flash?.info) {
                  successAlert(flash.info);
              }
            },
            onError: (_err) => {
               console.error(_err);
               errorAlert("Failed to change display currency.")
            }
      });
   };

   const changec = (value) => {
      setData('currency',value);
      changeCurrency(value);
      setSelectedCurrency(value);
   }

   return <>
      {changer ? 
         <>
         <Dropdown>
            <Dropdown.Toggle variant="info" id="pricebasic">
               <span className="mb-0 text-white display-inline" > {defaultvalue}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
               {currencies && currencies.map((c, i)=>{
                  return <Dropdown.Item key={`c-${i}`} onClick={()=>changec(c.value)}>
                     {c.label}
                  </Dropdown.Item>
               })}
            </Dropdown.Menu>
            </Dropdown>
         </>
         : 
         <>
            <h2 className="text-uppercase font-GillSans pb-4 font-large"> Display Currency </h2>
            <div className="form-field mb-4">
                  <label className="d-block text-start mb-2">Display Currency</label>
                  <Select  classNamePrefix="react-select" className="react-select my-4 " 
                     options={currencies}
                     placeholder={data.currency|| 'Select..'}
                     defaultValue={data.currency}
                     onChange={(e) => handleSelect(e)}
                  />
            </div>
            <LoaderButton onClick={()=>changeCurrency(data.currency)}
               disabled={processing}
               type='submit'
                  className="flex w-100 btn-pink lg mx-auto"
                  spinnerClassName="fill-red-600" >
                  {processing ? "Updating.." : "Update"}
            </LoaderButton>
         </>
      }
   </>
}
