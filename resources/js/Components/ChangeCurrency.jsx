import { useAlerts } from "@/Components/Alerts";
import  LoaderButton from "@/Components/LoaderButton";
import { useForm } from "@inertiajs/react";
import Select from 'react-select';
import { useState } from "react";
import { usePage, Link } from '@inertiajs/react';
import Dropdown from 'react-bootstrap/Dropdown';

export default function ChangeCurrency({defaultvalue, changer, currencyaction}) {

   const { flash } = usePage().props;
   const { successAlert, errorAlert } = useAlerts();
   const { data, setData, get, processing, errors, reset } = useForm({
      currency: defaultvalue,
   });

   const currencies = [
      { value: 'GBP', label: '£ British Pound Sterling', symbolAndCode: '£ GBP' },
      { value: 'USD', label: '$ United States Dollar', symbolAndCode: '$ USD' },
      { value: 'AUD', label: '$ Australian Dollar', symbolAndCode: '$ AUD' },
      { value: 'EUR', label: '€ Euro', symbolAndCode: '€ EUR' },
      { value: 'JPY', label: '¥ Japanese Yen', symbolAndCode: '¥ JPY' },
      { value: 'HKD', label: '$ Hong Kong Dollar', symbolAndCode: '$ HKD' },
      { value: 'CAD', label: '$ Canadian Dollar', symbolAndCode: '$ CAD' },
      { value: 'CHF', label: 'Swiss Franc', symbolAndCode: 'CHF CHF' },
      { value: 'SEK', label: 'Swedish Krona', symbolAndCode: 'SEK SEK' },
      { value: 'NZD', label: '$ New Zealand Dollar', symbolAndCode: '$ NZD' },
    ];


   const [selectedCurrency, setSelectedCurrency] = useState(defaultvalue);
   const handleSelect = (e) => {
      setSelectedCurrency(e.value);
      setData('currency', e.value);
   }

   const changeCurrency = (e) => {
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
              if(currencyaction){
               currencyaction('close')
              }
            },
            onError: (_err) => {
               console.error(_err);
               errorAlert("Failed to change display currency.")
            }
      });
   };

   const changec = (value, name) => {
      setData('currency',value);
      changeCurrency(value);
      setSelectedCurrency(name);
   }
   const customStyles = {
    menuList: (base) => ({
        ...base,
        maxHeight: '130px', // Set fixed height
        overflowY: 'auto',  // Enable scrolling
    }),
    };

   return <>
      {changer ?
         <>
         <Dropdown>
            <Dropdown.Toggle variant="info" id="pricebasic">
               <span className="mb-0 px-2 text-white display-inline" > {selectedCurrency ? selectedCurrency : "N/A"}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
               {currencies && currencies.map((c, i)=>{
                  return <Link className="dropdown-item" href={route('change.currency', {c:c.value})} key={`currency-selector-${c.value}`}>{c.label}</Link>
               })}
            </Dropdown.Menu>
            </Dropdown>
         </>
         :
         <div className=" ">
            <h2 className="text-uppercase font-GillSans pb-4 font-large"> Display Currency </h2>
            <div className="form-field mb-4">
                  <Select  classNamePrefix="react-select" className="max-h-[100px] react-select mb-4 mt-2 "
                     options={currencies} styles={customStyles}
                     placeholder={data.currency|| 'Select..'}
                     defaultValue={data.currency}
                     onChange={(e) => handleSelect(e)}
                  />
                  <label className="d-block text-start">Please choose as your default display currency.</label>
            </div>
            <LoaderButton onClick={()=>changeCurrency(data.currency)}
               disabled={processing}
               type='submit'
                  className="flex w-100 btn-pink lg mx-auto"
                  spinnerClassName="fill-red-600" >
                  {processing ? "Updating.." : "Update"}
            </LoaderButton>
         </div>
      }
   </>
}
