import axios from 'axios';
export default function PinWish({text, id}){
   
   const pin = (e) => {
      if(!id){ 
         return false;
      }
      axios.get(`/pin-item/${id}`).then((resp) => {
         console.log("resp", resp);
      }).catch((_err) => {
         console.error("error", _err);
      });
   };

   return <button onClick={pin} >{text}</button>
}