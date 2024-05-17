import { useAlerts } from '@/Components/Alerts';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import React from 'react'
import { useRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import st from "../../../css/uploader.module.css";
import UploadcareEditor from '@/uploadcare/UploadcareEditor';
import GlobalUploader from '@/uploadcare/Uploader';

export default function AddItem({update, title, pre_title, pre_description, pre_price, product_type}) {
 
   const { auth, user } = usePage().props;
   const { successAlert, errorAlert, errorsHandling } = useAlerts();

   const [open, setOpen] = useState(false);
   useEffect(()=>{
      if(open){
         document.documentElement.classList.add('overflow-hidden');
      } else { 
         document.documentElement.classList.remove('overflow-hidden');
      }
   },[open]);

   


   const AddForm = () => { 

      const [categories, setCategories] = useState([]);
      const [fetchingCats, setFetchingCats] = useState(false);
      const fetchAddedCategories = (signal) => {
         if(fetchingCats){
            return false;
         }
         setFetchingCats(true);
         axios.get(`/user_shop_category/${auth.user.username || user.username}`, { signal })
         .then(res => {
            setCategories(res.data.categories);
            setFetchingCats(false);
         })
         .catch(err => {
            console.log(err);
            setFetchingCats(false);
         });
      }

      useEffect(() => {
         const controller = new AbortController();
         const { signal } = controller;
         fetchAddedCategories(signal);
         return () => controller.abort();
      }, []);

      const uploaderRef = useRef();
      const resetUploader = () => {
         if (uploaderRef.current) {
            uploaderRef.current.reset();
         }
      };

      const [thumb, setThumb] = useState(null);
      const [thumbEditable, setIsThumbEditable ] = useState(false);
      async function getFileUID(thumbs){
         setThumb(thumbs.uuid || "");
         setIsThumbEditable(true);
      };
      const imageEdited = async (d,uuid) => {
         const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`
         setIsThumbEditable(false);
         setThumb(url);
      }; 


      const [rewardfile, setrewardfile] = useState(null);
      async function getRewardFile(file){
         setrewardfile(file);
         console.log("file", file)
      };
      

      const [haveQuestion, setHaveQuestion ] = useState(false);
      const [question, setQuestion] = useState('');
      const handleHaveQuestion = () => { 
         setHaveQuestion(!haveQuestion);
         setQuestion('');
      }

      const [haveSlots, setHaveSlots ] = useState(false);
      const [slots, setSlots] = useState('');
      const handleHaveSlots = () => { 
         setHaveSlots(!haveSlots);
         setSlots('');
      }

      const [haveSpPrice, setHaveSpPrice ] = useState(false);
      const [spPrice, setSpPrice] = useState('');
      const handleSpPrice = () => { 
         setHaveSpPrice(!haveSpPrice);
         setSpPrice('');
      }

      const [haveQty, setHaveQty ] = useState(false);
      const handleQty = () => { 
         setHaveQty(!haveQty);
      }
 
      const [pagetype, setPageType] = useState('text');
      const [parsedContent, setParsedContent] = useState('');
      const [pageUrl, setpageUrl] = useState('');
      const handleSuccessPageType = (e) => { 
         setPageType(e.target.value);
         setpageUrl('');
         setParsedContent('');
      }

      const [checkboxes, setCheckboxes] = useState([]);
      const catValue = (event) => {
         const { value, checked } = event.target;
         if (checked) {
            setCheckboxes([...checkboxes, value]);
         } else {
            setCheckboxes(checkboxes.filter((item) => item !== value))
         }
      };


      const [shopItem, setShopItem] = useState({
         type: product_type,
         name: pre_title || '',
         description: pre_description || '',
         price: pre_price ||  '',
         success_page_type :pagetype ,
      });
      
      const handelInputs = (e) => {
         setShopItem({
            ...shopItem,
            [e.target.name]: e.target.value
         });
      }

      const [isChecked, setIsChecked] = useState(false);
      const [adding, setAdding] = useState(false);
      const inputRef = useRef(null);
      const addCategory = () => { 
         const value = inputRef.current.value;
         setAdding(true);
         axios.post(`/shop/save-category`, {category: value}).then((res) => {
            if(res.data.status){
               successAlert(res.data.msg || "Added");
               inputRef.current.value = '';
               fetchAddedCategories();
            } else {
               errorAlert(res.data.msg || "Something went wrong.");
            }
            setAdding(false);
         }).catch((err) => {
               setAdding(false);
               errorsHandling(err);
         });
      };

      const [loading, setLoading ] = useState(false);
      const addShopItem = () => { 
         setLoading(true);
         const data = {
            ...shopItem, 
            success_page_value : pagetype === 'url' ? pageUrl : parsedContent,
            reward_file : rewardfile,
            category : JSON.stringify(checkboxes),
            ask_question : question,
            slot_limitation : slots || 10,
            special_member_price: spPrice || 10,
            quantity_allow: haveQty ? 1 : 0,
            image:thumb,
         };
         axios.post(`/shop/add`, data).then((res) => {
            if(res.data.status){
               successAlert(res.data.msg || "Item Added !!");
               resetUploader();
               setOpen(false);
               update && update();
            } else {
               errorAlert(res.data.msg || "Failed to add a shop item.");
            }
            setLoading(false);
         }).catch((err) => {
            setLoading(false);
            errorsHandling(err);
         });
      };

      
      return (
         <div className='p-3 md:p-8 overflow-auto bg-white md:bg-gray-200 fixed w-full h-full top-0 right-0 z-[9999]' >
            <div className='flex items-center justify-center py-3 bg-white sticky -top-4 w-full mb-6' >
               <h2 className='text-[22px]  ' >What are you offering?</h2>
            </div>
            <button className='fixed top-1 md:top-2 right-8 md:right-10 z-1 text-[35px] md:text-[45px]' onClick={()=>setOpen(false)} >&times;</button>
            <div className='shop-forms-field p-0 md:p-8 max-w-[800px] m-auto rounded-[20px]' >
               <div className='shop-forms-field mb-4' >
                  <label className='w-full mb-2' >Name</label>
                  <input name="name" defaultValue={pre_title} onChange={handelInputs} className='shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5' type='text' placeholder="What's your are offering" />
               </div>

               <div className='shop-forms-field mb-4' >
                  <label className='w-full mb-2' >Description</label>
                  <input name="description" defaultValue={pre_description} onChange={handelInputs} className='shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5' type='text' placeholder="Describe what you’re selling in a few sentence" />
               </div>

               <div className='shop-forms-field mb-4' >
                  <label className='w-full mb-2' >Price</label>
                  <input  name="price" defaultValue={pre_price} onChange={handelInputs} className='shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5' type='number' placeholder="Enter the price of your item" />
               </div>

               <h2 className='text-md font-normal mb-3 mt-3' >Choose shop images</h2>
               <div className={`uploader mb-4 mt-2 overflow-hidden`} >
                  <GlobalUploader type='minimal'
                     ref={uploaderRef}
                     sendFile={getFileUID}
                     options={st.shop}
                  />
                  <div className={`${thumbEditable ? '' : 'd-none'} editable`} >
                     <UploadcareEditor setIsEditable={setIsThumbEditable} uuid={thumb} updateFile={imageEdited}  />
                  </div>
               </div>


               <div className='shop-forms-field mb-4' >
                  <label className='w-full mb-2' >Success page </label>
                     <div className='success-page-types flex items-center flex-wrap' >
                        <div className="flex items-center mb-2 pe-3">
                           <input onChange={handleSuccessPageType} id="success-option-1" type="radio" name="success-types" value="text" className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-300 cursor-pointer" defaultChecked />  
                           <label htmlFor="success-option-1" className=" cursor-pointer text-md font-medium text-gray-900 ml-2 block">
                           Confirmation message
                           </label>
                        </div>
                        <div className="flex items-center mb-2 ">
                           <input onChange={handleSuccessPageType} id="success-option-2" type="radio" name="success-types" value="url" className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-300 cursor-pointer"  />
                           <label htmlFor="success-option-2" className=" cursor-pointer text-md font-medium text-gray-900 ml-2 block">
                           Redirect to a URL after purchase
                           </label>
                        </div>
                     </div>

                     {pagetype == "text" ? <div className=''>
                           <textarea onChange={(e)=>setParsedContent(e.target.value)} className='mt-2 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5' placeholder='Enter confirmation message here !!' ></textarea>
                           <h2 className='text-md font-normal mb-3 mt-2' >Choose reward file </h2>
                           <div className={`uploader mb-4 mt-2 overflow-hidden`} >
                              <GlobalUploader type='minimal'
                                 ref={uploaderRef}
                                 sendFile={getRewardFile}
                                 options={st.shopreward}
                              />
                           </div>
                        </div>
                        :
                        <input onChange={(e)=>setpageUrl(e.target.value)} className='mt-2 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5' type="text" placeholder='https://' />
                     }
               </div>

               <div className='shop-add-categories border-t pt-3 ' >
                  <h2 className='text-lg font-bold mb-2' >Choose Categories</h2>
                  <div className='categories-lists success-page-types' >
                     {categories && categories.map((c, i)=>{
                        return <div className="flex items-center mb-2">
                           <input onChange={catValue} 
                           // checked={isCategory} 
                           id={`category-item-${c.uuid}`} type="checkbox" name="categories-items" 
                           value={c.uuid} className="h-5 w-5 rounded-1 border-gray-300 focus:ring-2 focus:ring-blue-300 cursor-pointer" />  
                           <label htmlFor={`category-item-${c.uuid}`} className=" cursor-pointer text-md font-medium text-gray-900 ml-2 block">
                              {c.category}
                           </label>
                        </div>
                     })}
                  </div>
                  
                  <div className='add-shop-cat-input relative d-flex items-center mt-3' >
                     <input ref={inputRef} className='shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4' type="text" placeholder='Enter new category' />
                     <button onClick={addCategory} className='bg-gray-200 rounded-xl ms-3 p-[13px] px-4 text-nowrap' >+ Add</button>
                  </div> 
               </div>

               <div className='isCheckedRefernce py-4' >
                  <label
                     htmlFor="agreeterm"
                     className="text-start" >
                     <input onChange={(e) => setIsChecked(e.target.checked)}
                        type="checkbox" id="agreeterm"
                        name="agreeterm"
                        className="me-2 rounded-1 cursor-pointer"
                        value="agreeterm" ></input>
                     By adding shop item you agree to our <a className='text-voilet font-bold' target='_blank' href={route('terms-and-conditions')} >Terms & Conditions</a>  and <a className='text-voilet font-bold' target='_blank' href={'https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6'} >Privacy Policy,</a>  and confirm that you are at least 18 years old.
                  </label>
               </div>

               <h2 className='text-lg font-bold mb-2 border-t pt-3 mt-2' >Advanced Settings</h2>

               <div className='ad-setting my-2' >
                  <div className="inline-flex items-centercursor-pointer">
                     <div onClick={handleHaveQuestion}   className={` cursor-pointer relative w-11 h-6  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     ${haveQuestion ? "after:transition-all after:translate-x-full  bg-blue-600" : "bg-gray-200"}
                     `} ></div>
                     <span className="ms-3 text-md font-medium text-gray-900">Ask a question (optional)  
                     <button className='tooltipbtn' >?<p>If you'd like any additional information to fulfil this offering, you can leave a question here.</p></button>
                        </span>
                  </div>
                  {haveQuestion ? <input onChange={(e)=>setQuestion(e.target.value)} className='mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4' type="text" placeholder='e.g What would like to learn next ?' /> : ''}
               </div>

               
               <div className='ad-setting my-2' >
                  <div className="inline-flex items-centercursor-pointer">
                     <div onClick={handleHaveSlots}   className={` cursor-pointer relative w-11 h-6  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     ${haveSlots ? "after:transition-all after:translate-x-full  bg-blue-600" : "bg-gray-200"}
                     `} ></div>
                     <span className="ms-3 text-md font-medium text-gray-900">Limit slots (optional) <button className='tooltipbtn' >?<p>A limited number of slots creates a sense of urgency and also saves you from burn-out.</p></button></span>
                  </div>
                  {haveSlots ? <input onChange={(e)=>setSlots(e.target.value)} className='mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4' type="text" defaultValue={10}  /> : ''}
               </div>


               <div className='ad-setting my-2' >
                  <div className="inline-flex items-centercursor-pointer">
                     <div onClick={handleSpPrice}   className={` cursor-pointer relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5  
                     ${haveSpPrice ? "after:transition-all after:translate-x-full bg-blue-600" : "bg-gray-200 "}
                     `} ></div>
                     <span className="ms-3 text-md font-medium text-gray-900">Special price for members (optional) <button className='tooltipbtn' >?<p>Offer a discounted extra price to attract new members and to keep your current members engaged.</p></button></span>
                  </div>
                  {haveSpPrice ? <input onChange={(e)=>setSpPrice(e.target.value)} className='mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4' type="text" defaultValue={10}  /> : ''}
               </div>
              
               <div className='ad-setting my-2' >
                  <div className="inline-flex items-centercursor-pointer">
                     <div onClick={handleQty} className={` cursor-pointer relative w-11 h-6   peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     ${haveQty ? "after:transition-all after:translate-x-full  bg-blue-600" : "bg-gray-200"} `} ></div>
                     <span className="ms-3 text-md font-medium text-gray-900">Allow buyer to choose a quantity (optional) <button className='tooltipbtn' >?<p>Your supporters will be able to select the desired quantity of this item. You will receive payment based on the quantity they choose multiplied by your set price.</p></button></span>
                  </div>
               </div>

               <button onClick={addShopItem} className='mt-4 mb-4 btn-pink md w-full max-w-[300px] m-auto d-table' >{loading ? "Publishing..." : "Publish"}</button>
            </div>
         </div>
      )
   }

   return (
      <>
         <button onClick={(e)=>setOpen(true)} className='w-full shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[20px]' >
            <h2 className='md:text-[19px]' >{title}</h2>
         </button>
         {open ? <AddForm /> : ''}
      </>
   )
}
