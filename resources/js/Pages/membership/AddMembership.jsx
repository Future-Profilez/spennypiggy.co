import { useAlerts } from "@/Components/Alerts";
import React, { useEffect } from "react";
const Popup = React.lazy(() => import('@/Components/Popup'));
import { useState } from "react";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import axios from "axios";
import { useRef } from "react";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";

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

export default function AddMembership({updateState, item}) {
  
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  
  const uploaderRef = useRef();
  const resetUploader = () => {
      if (uploaderRef.current) {
          uploaderRef.current.reset();
      }
  };

  const [close, setClose] = useState();   
  function selectRewards(e){ 
    const checkboxes = document.getElementsByName("rewards");
    let result = [];
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        result.push(checkboxes[i].value);
      }
    };
    setData({ ...data, rewards: result });
  } 

    const [thumb, setThumb] = useState(null);
    const [ data, setData] = useState({
      level: '',
      month_price: '',
      rewards: '',
    }); 


    let nameattr, valueattr;
    const handleInput = (e) => {
        nameattr = e.target.name;
        valueattr = e.target.value;
        setData({ ...data, [nameattr]: valueattr });
    }

    const [isEditable, setIsEditable ] = useState(false);
    async function getFileUID(thumbs){
      setThumb(thumbs.uuid || "");
      setIsEditable(true);
    };

    const imageEdited = async (d,uuid) => {
        const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`
        setIsEditable(false);
        setThumb(url);
    }; 
    
    useEffect(()=>{
      if(item){ 
        setData({
          level: item.level || '',
          month_price: item.price || '',
          rewards: item.rewards || ''
        }); 
      }
    },[item]);


    const [loading, setLoading] = useState(false);
    const AddMembership = (e) => {
        e.preventDefault();
        setLoading(true);
        axios.post(`/membership/save`, {...data, thumbnail: thumb}).then((resp)=>{
          if(resp.data.status) { 
            successAlert(resp.data.msg)
            updateState && updateState(new Date());
            setClose(false);
            setTimeout(() => {
              setClose();
            }, 100);
            reset();
            resetUploader();
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
          console.error("err", err);
          setLoading(false);
        });
    };

    return (
        <Popup
            modalclassName="pinkmodal full sendSurprize-modal shadow-pink ps-0"
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
                                  {/* <button    
                                    onClick={()=>setData('level', m.value)}  >
                                    {m.title}
                                  </button> */}
                                  <input className="cursor-pointer d-none"  
                                  type="checkbox" id={m.value} value={m.value} name="level" 
                                  onChange={handleInput} />
                                  <label className={`cursor-pointer text-capitalize ${data && data.level == m.value ? "active" : ''}`} htmlFor={m.value}>
                                      {m.title}
                                  </label>
                                </li>
                              })}
                          </ul>
                      </div>

                      <div className="col-md-12 form-field mb-4">
                          <label className="d-block text-start mb-2">{data && data.level =='lifetime' ? "Lifetime membership price" : 'Monthly Price'}</label>
                          <div className="position-relative  currency-wrapper" >
                            <span className="currency-tag">{'GBP'}</span>
                            <input className="form-input w-100 rounded"  
                                onChange={handleInput} defaultValue={item && item.price || ''}
                                type="number" name="month_price"
                                placeholder={data && data.level =='lifetime' ? "Enter Lifetime membership price" : 'Enter monthly price.. '}  />
                          </div>
                      </div>

                      <div className="col-md-12 form-field mb-4">
                      <label className="d-block text-start mb-1">Thumbnail</label>
                        <p className="text-muted mb-3" >This is not required, but it can be a nice way to build your brand or make the offering more attractive.</p>

                        <div className={`${!isEditable ? '' : 'd-none'} editable`} >
                          <GlobalUploader type='minimal'
                            ref={uploaderRef}
                            sendFile={getFileUID}
                            options={st.membership}
                          />
                        </div>
                        <div className={`${isEditable ? '' : 'd-none'} editable`} >
                            <UploadcareEditor setIsEditable={setIsEditable} uuid={thumb} updateFile={imageEdited}  />
                        </div>

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
                      
                      <button onClick={AddMembership} disabled={loading}
                          className="flex w-100 btn-pink lg mx-auto"  >
                        {loading ? "Processing" : "Create"}
                      </button>

                    </div> 
             

              </div>  
        </Popup>
    );
}
