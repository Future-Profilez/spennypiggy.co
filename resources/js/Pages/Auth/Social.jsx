import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import Popup from "@/Components/Popup";
import { useForm } from "@inertiajs/react";
import { useEffect } from "react";
import { useState } from "react";

export default function Social({links, updatedLinks}) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [close, setClose] = useState();

    const { data, setData, post, processing, reset } = useForm({
        twitter: links?.twitter ? links.twitter : '',
        whoyouinto: links?.whoyouinto ? links.whoyouinto : '',
        reddit: links?.reddit ? links.reddit : '',
        instagram: links?.instagram ? links.instagram : '',
        discord: links?.discord ? links.discord : '',
        onlyfans: links?.onlyfans ? links.onlyfans : '',
        loyalfans: links?.loyalfans ? links.loyalfans : '',
        fansly: links?.fansly ? links.fansly : '',
        manyvids: links?.manyvids ? links.manyvids : '',
        other: links?.other ? links.other : '',
    });

    useEffect(() => {
        setData('twitter', links?.twitter || '');
        setData('whoyouinto', links?.whoyouinto || '');
        setData('reddit', links?.reddit || '');
        setData('instagram', links?.instagram || '');
        setData('discord', links?.discord || '');
        setData('onlyfans', links?.onlyfans || '');
        setData('loyalfans', links?.loyalfans || '');
        setData('fansly', links?.fansly || '');
        setData('manyvids', links?.manyvids || '');
        setData('other', links?.other || '');
    }, [links]);

    const createSocial = (e) => {
        e.preventDefault();
        post(route('save_social_links'), {
            preserveScroll: true,
            onSuccess: (resp) => {
                reset();
                if(resp.props.flash?.success){
                    successAlert(resp.props.flash?.success || "Updated successfully.");
                    updatedLinks && updatedLinks(new Date());
                }
                if(resp.props.flash?.error){
                    errorAlert(resp.props.flash?.error || "Something went wrong.")
                } 
                setClose(false);
                setTimeout(() => {
                    setClose();
                }, 100)
            },
            onError: (_err) => {
                console.error(_err);
                errorsHandling(_err);
                errorAlert(resp.props.flash?.success || "Added");
            }
        });
    };

    console.log("data",data)
    console.log("links",links)

    return <>
        <Popup action={close} space='4' modalclassName="pinkmodal" size="md"
            classes='' text="Add Socials" >
            <div className='editprofileModalInner  '> 
                <div className="swishinfo">
                    <h2 className="pb-4 font-GillSans text-center text-uppercase" >Social Links</h2>
                    <form onSubmit={createSocial}>
                        <ul className=" ps-0  row" >
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Whoyouinto</label>
                                <input id="whoyouinto"
                                    name="whoyouinto" defaultValue={links?.whoyouinto || ''}
                                    type="text" placeholder={'URL'}
                                    value={data?.whoyouinto||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('whoyouinto', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Twitter</label>
                                <input id="twitter"
                                    name="twitter"
                                    type="text" placeholder="URL"
                                    value={data?.twitter||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('twitter', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Instagram </label>
                                <input id="instagram"
                                    type="text" placeholder="URL"
                                    name="instagram"
                                    value={data?.instagram||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('instagram', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Reddit</label>
                                <input id="reddit"
                                    name="reddit"
                                    type="text" placeholder="URL"
                                    value={data?.reddit||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('reddit', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Discord</label>
                                <input id="discord"
                                    name="discord"
                                    type="text" placeholder="URL"
                                    value={data?.discord||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('discord', e.target.value)}
                                />
                            </li>

                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">OnlyFans</label>
                                <input id="onlyfans"
                                    name="onlyfans"
                                    type="text" placeholder="URL"
                                    value={data?.onlyfans||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('onlyfans', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">LoyalFans</label>
                                <input id="loyalfans"
                                    name="loyalfans"
                                    type="text" placeholder="URL"
                                    value={data?.loyalfans||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('loyalfans', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Fansly</label>
                                <input id="fansly"
                                    name="fansly"
                                    type="text" placeholder="URL"
                                    value={data?.fansly||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('fansly', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">ManyVids</label>
                                <input id="manyvids"
                                    name="manyvids"
                                    type="text" placeholder="URL"
                                    value={data?.manyvids||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('manyvids', e.target.value)}
                                />
                            </li>
                            <li className="mb-4 col-md-6">
                                <label className="mb-2 text-start d-block">Other</label>
                                <input id="other"
                                    name="other"
                                    type="text" placeholder="URL"
                                    value={data?.other||''}
                                    className="form-input px-2 py-2 border w-full rounded-md"
                                    onChange={(e) => setData('other', e.target.value)}
                                />
                            </li>
                        </ul>

                        <LoaderButton disabled={processing} type='submit'
                            className=' flex btn-pink sm w-100 mx-auto'
                            spinnerClassName='fill-red-600'>
                            {processing ? "Processing" : "Add Links"}
                        </LoaderButton>
                    </form>
                </div>
            </div>
        </Popup>
    </>
}
