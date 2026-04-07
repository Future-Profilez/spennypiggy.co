import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import AllContries from '../../includes/AllCountries';
import { useEffect } from 'react';

export default function CountriesShipping({handleShipping, handlewws}) {
   const { auth, user } = usePage().props;
   const defaultCurrency = user && user.default_currency || "GBP";
   const [shipping, setShippings] = useState([]);

   const addShipping = () => {
         setShippings([...shipping, { country: '', price: '' }]);
         handleShipping([...shipping, { country: '', price: '' }]);
   };
   const handleVariantChange = (index, field, value) => {
         const newVariants = shipping.map((variant, i) =>
         i === index ? { ...variant, [field]: value } : variant
         );
         setShippings(newVariants);
         handleShipping(newVariants);
   };
   const handleRemoveVariant = (index) => {
         const newVariants = shipping.filter((_, i) => i !== index);
         setShippings(newVariants);
         handleShipping(newVariants);
   };

   const [haveQty, setHaveQty] = useState(false);
   const handleQty = () => {
      if(haveQty){
         handlewws()
      }
      setHaveQty(!haveQty);
   };

   const inputww = (e) => {
      handlewws(e.target.value);
   }

  return <>
      <h2 className="font-bold mb-1 pt-4 border-t border-gray-200 mt-4">Shipping</h2>
         <div className="ad-setting mt-3 mb-2">
            <div className="inline-flex items-centercursor-pointer">
               <div
                  onClick={handleQty}
                  className={` cursor-pointer relative w-11 h-6   peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5
                  ${haveQty? "after:transition-all after:translate-x-full  bg-blue-600": "bg-gray-200"
                  } `}
               ></div>
               <span className="ml-3 text-md font-medium text-gray-900">
               Enable worldwide shipping
               </span>
            </div>
         </div>
         {haveQty ? (
            <input onChange={inputww}
            className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-[30px]  p-[13px] px-4"
            type="number" name="price" id="price" placeholder="Shipping Price" />
         ) :  ''}

         <div className="add-form">
            {shipping.map((variant, index) => (
                <div className="flex items-center justify-between my-2">
                  <div className='countries-selections w-full me-2' >
                     <select className="shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-[30px]  p-[12px] px-[20px] "
                     onChange={(e) => handleVariantChange(index, 'country', e.target.value)} >
                        <option value={''} >Choose Country</option>
                        {AllContries && AllContries.map((c, i) => <option key={i} value={c.code}>{c.label}</option>)}
                     </select>
                  </div>
                  <div className="relative  w-full me-2">
                     <span className="currency-tag">{defaultCurrency || 'GBP'}</span>
                     <input
                        type="number" className="shop-forms-input ps-[50px] bg-gray-200 w-full bg-gray-200 border-0 rounded-[30px]  p-[12px] px-[20px] "
                        name={`variantValue${index}`}
                        placeholder="Shipping Price"
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                     />
                  </div>
                  <button type="button" className="text-black shop-forms-input bg-gray-200 w-full bg-gray-300 text-[20px] border-0 rounded-[30px]  p-[8px] px-[20px] max-w-[50px]" onClick={() => handleRemoveVariant(index)}>
                     &times;
                  </button>
               </div>
            ))}
            <button onClick={addShipping} className="button sm pinkbg px-3 py-2 mt-2 mb-3" >Add a Destination</button>
         </div>
  </>
}
