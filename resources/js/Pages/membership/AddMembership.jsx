import { useAlerts } from "@/Components/Alerts";
import React, { useEffect } from "react";
import  LoaderButton from "@/Components/LoaderButton";
import { useForm, usePage } from "@inertiajs/react";
const Popup = React.lazy(() => import('@/Components/Popup'));
import PriceFormat from "@/includes/PriceFormat";
import { useState } from "react";
import ProgressBar from 'react-bootstrap/ProgressBar';
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import axios from "axios";

const memberships = [
  {
    'title': "Bronze Level",
    'value': "bronze"
  },
  {
    'title': "Silver Level",
    'value': "silver"
  },
  {
    'title': "Gold Level",
    'value': "gold"
  },
  {
    'title': "Platinum Level",
    'value': "platinum"
  },
  {
    'title': "Lifetime",
    'value': "lifetime"
  }
];

const membershipBenifits = [
  {
    'title':'Green Circle Insta',
    'value':'green_circle_insta'
  },
  {
    'title':'Insta Broadcast ',
    'value':'insta_broadcast'
  },
  {
    'title':'⁠Telegram Group',
    'value':'telegram_group'
  },
  {
    'title':' ⁠X Community ',
    'value':'x_community '
  },
  {
    'title':'⁠Monthly Content Bundle',
    'value':'monthly_content_bundle'
  },
  {
    'title':'Weekly Content Bundle',
    'value':'weekly_content_bundle'
  },
  {
    'title':'⁠Weekly DM chat',
    'value':'weekly_DM_chat'
  },
  {
    'title':'Monthly DM chat',
    'value':'monthly_DM_chat'
  },
  {
    'title':'Monthly Video call',
    'value':'monthly_video_call'
  },
  {
    'title':'Weekly Video call',
    'value':'weekly_video_call'
  },
];

export default function AddMembership(props) {

    const {flash} = usePage().props;

   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const [clear, setClear] = useState();
   const [close, setClose] = useState();   
   const { formatMultiPrice } = PriceFormat();

    const { data, setData, post,get, processing, errors, reset } = useForm({
      level: '',
      month_price: '',
      thumbnail: '',
      rewards: '',
    }); 
   
    const getFileUID = async (thumb) => {
      setData("thumbnail", thumb);
    };

    function selectRewards(e){ 
        const checkboxes = document.getElementsByName("rewards");
        let result = [];
        for (var i = 0; i < checkboxes.length; i++) {
          if (checkboxes[i].checked) {
            result.push(checkboxes[i].value);
          }
        };
        setData("rewards", result);
    }

    const [loading, setLoading] = useState(false);
   const AddMembership = (e) => {
      e.preventDefault();
      setLoading(true);
      axios.post(`/membership/save`, data).then((resp)=>{
        if(resp.data.status) { 
          successAlert(resp.data.msg)
          setClose(false);
          setTimeout(() => {
            setClose();
          }, 100);
        } else { 
          if(resp.data.errors){
            Object.entries(resp.data.errors).forEach(([key, value]) => {
                errorAlert(value);
              });
            } else { 
              errorAlert(resp.data.msg);
          }
           
        }
        setLoading(false);
      }).catch(err => { 
        console.log("err", err);
        setLoading(false);
      });
   };

   
    return (
        <Popup
            modalclass="pinkmodal full sendSurprize-modal shadow-pink ps-0"
            space="4" size="md"
            action={close} classes={`dropdown-item w-100`}
            text={`Add Membership`} >
              <div className="addgoal" >
                <h2 className="text-uppercase font-GillSans pb-4 font-large">Add Membership</h2>
             
                    <div className="row" >

                      <div className="col-md-12 form-field mb-4">
                          <label className="d-block text-start mb-2">Choose Membership Level</label>
                          <ul className="ps-0 d-flex flex-wrap tiers" >
                              {memberships && memberships.map((m, i)=>{
                                return <li key={`membership-${i}`} className="mb-2 me-2" >
                                  <button  className={data && data.level === m.value ? "active" : ''}  
                                    onClick={()=>setData('level', m.value)}  >
                                    {m.title}
                                  </button>
                                </li>
                              })}
                          </ul>
                      </div>

                      <div className="col-md-12 form-field mb-4">
                          <label className="d-block text-start mb-2">{data && data.level =='lifetime' ? "Lifetime membership price" : 'Monthly Price'}</label>
                          <div className="position-relative  currency-wrapper" >
                            <span className="currency-tag">{'GBP'}</span>
                            <input className="form-input w-100 rounded"
                                onChange={(e) => setData('month_price', e.target.value)}
                                type="number" placeholder={data && data.level =='lifetime' ? "Enter Lifetime membership price" : 'Enter monthly price.. '}  />
                          </div>
                      </div>

                      <div className="col-md-12 form-field mb-4">
                      <label className="d-block text-start mb-1">Thumbnail</label>
                        <p className="text-muted mb-3" >This is not required, but it can be a nice way to build your brand or make the offering more attractive.</p>
                        <GlobalUploader type='minimal'
                          clear={clear}
                          sendFile={getFileUID}
                          options={st.membership}
                        />
                      </div>
                    
                      <p className="font-bold mb-3 " >Choose membership Rewards</p>
                      <div className="d-flex memberships-lists flex-wrap mb-4 ">
                        {membershipBenifits && membershipBenifits.map((m, i)=>{
                          return <div className="member-reward me-2 mb-2 text-start">
                              <input className="cursor-pointer d-none" 
                              type="checkbox" id={m.value} value={m.value} name="rewards" 
                              onChange={selectRewards} />
                              <label className="cursor-pointer text-capitalize" htmlFor={m.value}>
                                  {m.title}
                              </label>
                            </div>
                        })}
                      </div>
                      
                      <LoaderButton onClick={AddMembership} disabled={loading}
                          className="flex w-100 btn-pink lg mx-auto"
                        spinnerClassName="fill-red-600" >
                        {loading ? "Processing" : "Create"}
                      </LoaderButton>

                    </div> 
             

              </div>
        </Popup>
    );
}
