import { useEffect, useState, lazy } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
const Popup = lazy(() => import('@/Components/Popup'));
export default function EditCategories({username, fetch_categories}) {

   const [data, setData] = useState(null);
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const [isLoading, setIsLoading] = useState(true);
   const fetchCategoriesLists = () => { 
      if(username){
         axios.get(`/user_category/${username}`).then((res)=>{
            setIsLoading(false);
            setData(res.data.categories);
         }).catch(err => {
            setIsLoading(false);
         });
      }
   }

   useEffect(()=>{
      fetchCategoriesLists()
   },[]);

   const Item = ({item}) => { 

      const [chnagedValue, setChangeValue] = useState(item?.category || "");
      const [isRename, setIsRename] = useState(false);
      const renameCategory = () => { 
         axios.post(`/edit-category/${item.id}`, {name: chnagedValue }).then((res)=>{
            fetchCategoriesLists();
            successAlert(res.data.msg);
            fetch_categories && fetch_categories();
         }).catch(err => {
            errorsHandling(err);
         });
      }
      const RemoveCategoty = () => { 
         axios.get(`/delete-category/${item.id}`).then((res)=>{
            fetchCategoriesLists();
            successAlert(res.data.msg);
            fetch_categories && fetch_categories();

         }).catch(err => {
            errorsHandling(err);
         });
      }

       return <>
         <div className="cats_edit box mt-3" >

            <div className="flex justify-between items-center" >
               <p>{item?.category || ""}</p>
               <div>
                  <button className="ms-2 button esm" onClick={()=>setIsRename(true)} >Edit</button>       
                  <button className="ms-2 button esm" onClick={RemoveCategoty} >Remove</button>       
               </div>
            </div>

            {isRename ? 
               <div className=" border-top pt-3 flex justify-between items-center mt-2" >
                  <input className="w-full" onChange={(e)=>setChangeValue(e.target.value)} defaultValue={item?.category || ""} disabled={!isRename} />
                  <button className="button esm ms-3" onClick={renameCategory} >Save</button>       
               </div>
               : ''
            }
         </div>
      </>
   }

   return (
      <>
      {data && data.length ? 
         <Popup size="md" text="Edit Categories" space={4}
            action={close}
            modalclassName="pinkmodal"
            classes="me-2 mb-2 wish-tags cursor-pointer edit text-nowrap " >
               <h2 className="font-GillSans text-bl  uppercase text-lg relative z-1 "> Edit Categories </h2>
               {data && data.map((s, i)=>{
                  return <Item item={s} />
               })}
         </Popup> : '' }
      </>
   );
}
