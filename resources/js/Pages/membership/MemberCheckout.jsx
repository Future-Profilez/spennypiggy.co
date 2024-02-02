import { useEffect, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import Membership from "./Membership";
import { useAlerts } from "@/Components/Alerts";
 
export default function SubCheckout(props) {

    const { auth, membership} = props;
    const [name, setName] = useState(auth && auth.user && auth.user.name || '');
    const [email, setEmail] = useState(auth && auth.user && auth.user.email || '');
    const { successAlert, errorAlert, warningAlert, infoAlert } = useAlerts();
    const {data, setData, post, processing, errors} = useForm({
        name: name,
        email: email,
        message: '',
        agree: false,
        anonymous: 0,
    }); 

    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    function checkanonymous(e){ 
        setKeepAnonmyous(e.target.checked);
        if(e.target.checked){
            setData("anonymous", 1);
        } else {
            setData("anonymous", 0);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route(`membership.checkout`,{
            uuid:membership.uuid
          }),
        {
            preserveScroll:true
        });
    }

    const {flash}   = usePage().props;
    useEffect(() => {
        if(flash?.error){
            errorAlert(flash.error);
        }
        if(flash?.success){
            successAlert(flash.success);
        }
        if(flash?.warning){
            warningAlert(flash.warning);
        }
        if(flash?.info){
            infoAlert(flash.info);
        }
    },[flash]);

    return (
        <>
            <Head title={`Join - ${membership?.level} membership`}/>
            <div className={`px-0 px-lg-2`}>
                <div className="my-4 cartsub cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                    <div className="cartMain">
                        <h2 className="pb-1 wishtitle">
                            Membership Basket for {membership?.user?.name || " "} 
                            <Link className="text-voilet" target="_blank"
                                href={`/${membership?.user?.username || ""}`} >
                                @{membership?.user?.username || ""}
                            </Link>
                        </h2>
                        <p className="pb-4">
                            You are about to join {membership.level} membership.
                        </p>

                        <Membership hidebtn={true} item={membership} />
                       
                       
                        <div className="addMessage mt-5">
                            <form onSubmit={handleSubmit}>
                                <ul className="row">
                                    <li>
                                        <label>Add Message </label>
                                        <textarea
                                            onKeyUp={(e) =>
                                                setData('message',e.target.value)
                                            }
                                            placeholder="Write message in under 800 Words..."
                                            defaultValue={data.message}
                                        ></textarea>
                                        <span className="text-xs text-red-600">{errors.message}</span>
                                    </li>
                                    <li className="w-100 mt-3">
                                        <div className="row">
                                            <div className="col-md-12 mb-4">
                                                <label className="d-block text-start">
                                                    From
                                                </label>
                                                <input
                                                    className="form-input w-100 rounded"
                                                    onChange={(e) =>
                                                        setData('name',e.target.value)
                                                    } value={data.name}
                                                    type="text"
                                                    placeholder="Enter Your Name..."
                                                />
                                                <span className="text-xs text-red-600">{errors.name}</span>
                                            </div>
                                            <div className="col-md-12 mb-4">
                                                <label className="d-block text-start">Email </label>
                                                <p className="text-small text-muted mb-1">Your e-mail remains private. It is used for the creator to reply to your gift with a message via Spenny Piggy</p>
                                                <input className={`${auth && auth.user && auth.user.email ? 'disabled' : ''} form-input w-100 rounded`}
                                                    value={data.email}
                                                    disabled={auth && auth.user && auth.user.email ? true : false}
                                                    onChange={(e) => setData('email',e.target.value)}
                                                    type="email" placeholder="Enter Your Email..."
                                                />
                                                <span className="text-xs text-red-600">{errors.email}</span>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="cheklistbox">

                                    <label
                                        htmlFor="anonymous"
                                        className="text-start" >
                                        <input onChange={checkanonymous} type="checkbox" id="anonymous" name="anonymous" className="me-2" value="anonymous" ></input>
                                        Keep anonymous
                                    </label>
                                    <p className="text-muted text-small mb-3" >Your personal email and name will be private.</p>
                                        <label
                                            htmlFor="agreeterm"
                                            className="text-start" >
                                            <input
                                                onChange={(e) => setData('agree', e.target.checked)}
                                                type="checkbox"
                                                id="agreeterm"
                                                name="agreeterm"
                                                className="me-2"
                                                value="agreeterm" ></input>
                                            I agree to the <Link target='_blank' className="text-voilet" href={route("terms-and-conditions")} >Terms of Service</Link> and <a className="text-voilet" target='_blank' href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6" > Privacy Policy </a>  and the following statements:
                                        </label>
                                        <div className="tearmlist ps-3">
                                            <ul className="ps-0">
                                                <li> I am making a non-refundable cash gift donation. </li>
                                                <li> I expect no product or service in return from the gift recipient. </li>
                                                <li> This payment is a donation intended for the gift recipient. </li>
                                                <li> I have taken the necessary steps to confirm the membershiplist owner is authentic and I understand that Spenny Piggy will not be held responsible for any issues arising from a catfishing situation. </li>
                                                <li> I understand that by violating these terms I may be subject to legal action or can fall a victim of scams. </li>
                                                <li> I understand that by checking the box above and then clicking "CHECKOUT",I will have created a legally binding e-signature to this agreement. </li>
                                                <li> By providing an e-mail,you confirm that you are happy to receive marketing updates. You can opt out at anytime. </li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                                <div className="mt-4 d-flex align-items-center justify-content-center" >
                                    <button type="submit"
                                        className={`${!data.agree || processing ? "disabled" : ""} btn-pink md px-4 mt-3 text-center`}
                                        disabled={!data.agree || processing}>
                                        {processing ? 'Processing...' : 'Join Now'}
                                    </button> 
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    );
}
