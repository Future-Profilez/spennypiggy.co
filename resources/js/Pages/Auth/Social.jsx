import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import Popup from "@/Components/Popup";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";

export default function Social({links, updatedLinks}) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [close, setClose] = useState();
    const [loading, setloading] = useState(false);

    const [data, setData] = useState({
        instagram: links?.instagram ? links.instagram : '',
        discord: links?.discord ? links.discord : '',
        facebook: links?.facebook ? links.facebook : '',
        youtube: links?.youtube ? links.youtube : '',
        twitch: links?.twitch ? links.twitch : '',
        tumblr: links?.tumblr ? links.tumblr : '',
    });

    let nameattr, valueattr;
    const handleInput = (e) => {
        nameattr = e.target.name;
        valueattr = e.target.value;
        setData({ ...data, [nameattr]: valueattr });
    }

    useEffect(()=>{
        setData({
            instagram: links?.instagram ? links.instagram : '',
            discord: links?.discord ? links.discord : '',
            facebook: links?.facebook ? links.facebook : '',
            youtube: links?.youtube ? links.youtube : '',
            twitch: links?.twitch ? links.twitch : '',
            tumblr: links?.tumblr ? links.tumblr : '',
        });
    },[links]);

    const createSocial = (e) => {
        e.preventDefault();
        const response = axios.post('save_social_links', data);
        response.then((res)=>{
            if(res.data.status){
                successAlert(res.data.msg || "Updated successfully.");
                updatedLinks && updatedLinks();
                setClose(false);
                setTimeout(()=>{
                    setClose();
                },1000);
            } else {
                errorAlert(res.data.msg);
            }
        }).catch((err)=>{
            console.log("err", err);
            errorsHandling(err);
        });
    };

    return <>
        <Popup action={close} space='4' modalclass="pinkmodal full" size="md"
            classes='' text="Add Socials" >
            <div className='editprofileModalInner  '> 
                <div className="swishinfo">
                    <h2 className="pb-4 font-GillSans text-xl text-uppercase" >Social Links</h2>
                    <form onSubmit={createSocial}>
                        <ul className=" ps-0  row" >
                           
                            {/* <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Twitter</label>
                                <input id="twitter"
                                    name="twitter"  
                                    type="text" placeholder="Enter username"
                                    defaultValue={links?.twitter||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('twitter', e.target.value)}
                                />
                            </li> */}
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Instagram </label>
                                <input id="instagram"
                                    type="text" placeholder="Enter username"
                                    name="instagram"
                                    defaultValue={links?.instagram||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={handleInput}
                                />
                            </li>
                            {/* <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Reddit</label>
                                <input id="reddit"
                                    name="reddit"
                                    type="text" placeholder="Enter reddit profile url"
                                    defaultValue={links?.reddit||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('reddit', e.target.value)}
                                />
                            </li> */}

                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Facebook</label>
                                <input id="facebook"
                                    name="facebook" 
                                    defaultValue={links?.facebook || ''}
                                    type="text" placeholder={'Enter facebook profile or page url'}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={handleInput}
                                />
                            </li>

                            <li className="mb-4 col-md-12">
                                <label className="mb-2 text-start d-block">Youtube</label>
                                <input id="youtube"
                                    name="youtube" 
                                    defaultValue={links?.youtube || ''}
                                    type="text" placeholder={'Enter channel or video url'}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={handleInput}
                                />
                            </li>

                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Twitch</label>
                                <input id="twitch"
                                    name="twitch" 
                                    defaultValue={links?.twitch || ''}
                                    type="text" placeholder={'Enter url'}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={handleInput}
                                />
                            </li>

                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Tumblr</label>
                                <input id="tumblr"
                                    name="tumblr" 
                                    defaultValue={links?.tumblr || ''}
                                    type="text" placeholder={'Enter username'}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={handleInput}
                                />
                            </li>

                            {/* <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Other</label>
                                <input id="other"
                                    name="other"
                                    type="text" placeholder="Enter URL"
                                    defaultValue={links?.other||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('other', e.target.value)}
                                />
                            </li> */}
                        </ul>

                        <LoaderButton disabled={loading} type='submit'
                            className=' flex button sm w-100 justify-content-center p-3 text-center mx-auto'
                            spinnerClassName='fill-red-600'>
                            {loading ? "Processing" : "Add Social Links"}
                        </LoaderButton>
                        
                    </form>
                </div>
            </div>
        </Popup>
    </>
}
