import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Avatar from "@/includes/Avatar";
import PriceFormat from "@/includes/PriceFormat";
import SayThanks from "./SayThanks";
import Collapse from "react-bootstrap/Collapse";
import { useState } from "react";
import axios from "axios";
import Confetti from "@/includes/Confetti";
import Nocontent from "@/includes/Nocontent";
import userphoto from "../../../assets/img/userphoto.png";
const defaultsec = 'https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/';
export default function Wishtracker(props) {

    const { format } = PriceFormat();
    const { auth, user, tracks } = props;

    console.log("props", props);
    console.log("tracks", tracks);

    const Wish = ({ n }) => {
        const [open, setOpen] = useState(false);
        const [isUserRead, setIsUserRead] = useState(n && n.is_read_user);
        const [isOwnerRead, setIsOwnerRead] = useState(n && n.is_read_owner);
        
        const [msgSent, setMsgSent] = useState(false);
        const getMessageStatus = (e) => { 
            setMsgSent(e);
        }
    
        const openState = () => { setOpen(!open) }
        function controlStatus(e) {
            openState();
            setIsOwnerRead(1);
            axios.get(`/read-status/${n.id}/${n.sender ? 'user' : 'owner'}`).then(resp => {
                console.error("resp", resp);
            }).catch(_err => {
                console.error("error", _err);
            });
        }

        return (
            <Confetti sender={n && n.sender}
                is_read_owner={isOwnerRead}
                onclick={controlStatus} classes="w-100" >
                    <div className="trackItem cursor-pointer shadow-pink box mb-4">
                        <div onClick={openState}
                            aria-controls="example-collapse-text" aria-expanded={open}
                            className=" cursor-pointer trackbar " >
                            {n && !n.sender && isOwnerRead !== 1 ? <div className="newwish justify-content-between py-2 d-flex align-items-center">
                                <h2 className="granted-wish  font-GillSans " >New Wish Granted. Tap to see</h2>
                            </div> : ''}
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="text-dark">
                                    <Avatar name={n && n.user && n.user.name || 'Anonymous'}
                                        username={n && n.user && n.user.username || 'anonymous'}
                                        src={
                                            (n && n.user && n.user.avatar_url) ||
                                            userphoto
                                        }
                                    />
                                </div>
                                <div className="text-muted rightbar d-flex align-items-center ">
                                    {n && n.sender ?
                                        <div className="identity redbg" >Paid</div>
                                        :
                                        <div className="identity mintbg" >Recieved</div>
                                    }
                                    <div className="angle-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" > <g id="SVGRepo_bgCarrier" stroke-width="0"></g> <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" ></g> <g id="SVGRepo_iconCarrier">{" "}
                                        <path d="M12 14.5C11.9015 14.5005 11.8038 14.4813 11.7128 14.4435C11.6218 14.4057 11.5392 14.3501 11.47 14.28L8 10.78C7.90861 10.6391 7.86719 10.4715 7.88238 10.3042C7.89756 10.1369 7.96848 9.97954 8.08376 9.85735C8.19904 9.73515 8.352 9.65519 8.51814 9.63029C8.68428 9.6054 8.85396 9.63699 9 9.72003L12 12.72L15 9.72003C15.146 9.63699 15.3157 9.6054 15.4819 9.63029C15.648 9.65519 15.801 9.73515 15.9162 9.85735C16.0315 9.97954 16.1024 10.1369 16.1176 10.3042C16.1328 10.4715 16.0914 10.6391 16 10.78L12.5 14.28C12.3675 14.4144 12.1886 14.4931 12 14.5Z" fill="#000000" ></path>{" "}
                                        </g> </svg>
                                    </div>
                                </div>
                            </div>
                        </div> 

                        
                       

                        <Collapse in={open}>
                            <div id="example-collapse-text">
                                <div className="track-summary mt-4">

                                    <div className="table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <td>Item</td>
                                                    <td>Name</td>
                                                    <td>Price</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <div className="wish-item" >
                                                            <img src={n.wish && n.wish.perma_link || "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/"} alt="image" className="img-fluid" />
                                                        </div>
                                                    </td>
                                                    <td>{n.wish && n.wish.wishname || 'Surprise Gift'} </td>
                                                    <td>{n.quantity || 1} x {format(n.amount)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <p className="mt-2" >Sender Note : </p>
                                    <p>You are awesome !!</p>

                                    {msgSent ? <div className="msgSent my-2" >
                                        <p className="mt-2" >Thankyou Note : </p>
                                        <p>{msgSent}</p>
                                    </div> : ''}

                                    {n && n.sender == false && !msgSent ? 
                                        <SayThanks 
                                        getMessageStatus={getMessageStatus} 
                                        name={n && n.user && n.user.name} 
                                        payment_id={n.id} />
                                    : ''}

                                </div>
                            </div>
                        </Collapse>
                    </div>
            </Confetti>
        );
    };

    return (
        <Authenticated auth={auth.user} user={user}>
            <Head title={"Wish Tracker"} />
            <div className="wishtracker blackbg min-h-screen pb-5">
                <div className="containerbox blackbg">
                    <Tabs
                        defaultActiveKey="1"
                        id="tracker-tab"
                        className="mb-3" >
                        <Tab eventKey="1" title="Wish Tracker">
                            <div className="tracks mt-4">
                                {tracks &&
                                    tracks.map((n, i) => {
                                        return (
                                            <Wish n={n} key={`track-${i}`} />
                                        );
                                    })}
                                {tracks && tracks.length < 1 ?
                                    <Nocontent text="nothing to see" /> : ''}
                            </div>
                        </Tab>
                        {/* <Tab eventKey="2" title="Subscriptions">
                            Change Items
                        </Tab> */}
                    </Tabs>
                </div>
            </div>
        </Authenticated>
    );
}
