import { useAlerts } from "@/Components/Alerts";
import  LoaderButton from "@/Components/LoaderButton";
import { useForm } from "@inertiajs/react";
import Select from 'react-select';
import { useState } from "react";
import { usePage, Link } from '@inertiajs/react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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
         <Menu as="div" className="relative inline-block text-left">
            <div>
               <Menu.Button className="inline-flex justify-center w-full rounded-[30px]  border border-transparent px-2 md:px-4 py-2 bg-cyan-500 text-sm font-medium text-white hover:bg-cyan-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                  {selectedCurrency ? selectedCurrency : "N/A"}
               </Menu.Button>
            </div>
            <Transition
               as={Fragment}
               enter="transition ease-out duration-100"
               enterFrom="transform opacity-0 scale-95"
               enterTo="transform opacity-100 scale-100"
               leave="transition ease-in duration-75"
               leaveFrom="transform opacity-100 scale-100"
               leaveTo="transform opacity-0 scale-95"
            >
               <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-[20px]  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-[300px] overflow-y-auto">
                  <div className="px-1 py-1 ">
                     {currencies && currencies.map((c, i)=>{
                        return (
                           <Menu.Item key={`currency-selector-${c.value}`}>
                              {({ active }) => (
                                 <Link
                                    href={route('change.currency', {c:c.value})}
                                    className={`${
                                       active ? 'bg-violet-500 text-white' : 'text-gray-900'
                                    } group flex w-full items-center rounded-[15px]  p-3 text-normal`}
                                 >
                                    {c.label}
                                 </Link>
                              )}
                           </Menu.Item>
                        )
                     })}
                  </div>
               </Menu.Items>
            </Transition>
         </Menu>
         </>
         :
         <div className=" ">
            <h2 className="uppercase font-GillSans pb-4 font-large"> Display Currency </h2>
            <div className="form-field mb-4">
                  <Select  classNamePrefix="react-select" className="max-h-[100px] react-select mb-4 mt-2 "
                     options={currencies} styles={customStyles}
                     placeholder={data.currency|| 'Select..'}
                     defaultValue={data.currency}
                     onChange={(e) => handleSelect(e)}
                  />
                  <label className="block text-left">Please choose as your default display currency.</label>
            </div>
            <LoaderButton onClick={()=>changeCurrency(data.currency)}
               disabled={processing}
               type='submit'
                  className="p w-full"
                  spinnerclass="fill-red-600" >
                  {processing ? "Updating.." : "Update"}
            </LoaderButton>
         </div>
      }
   </>
}
