import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Collapse from "react-bootstrap/Collapse";
import PriceFormat from '@/includes/PriceFormat';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Nocontent from '@/includes/Nocontent';
import Avatar from '@/includes/Avatar';
import userphoto from "../../../assets/img/userphoto.png";
import TweetNow from './TweetNow';
import { TimeFormat } from '@/includes/TimeFormat';
const defaultsec = "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/";

export default function MembershipTracker({auth}) {

   const { formatMultiPrice } = PriceFormat();
   const [membership, serMembership] = useState([]);

   const fetchMembership = () => {
      axios.get(`membership-tracker`).then(resp => {
         serMembership(resp.data.membership_payments);
      }).catch(_err => {
         console.error("error", _err);
      });
   }

   useEffect(()=>{
      fetchMembership();
   },[]);

   const getPercentage = (actual, paid) => {
      const r = (paid/actual)*100;
      return r.toFixed(2);
   }

   const GoalItem = ({n}) => {
      const [open, setOpen] = useState(false);
      const openState = () => { setOpen(!open) }
      return <>
          <div className="trackItem cursor-pointer shadow-pink box mb-4">
                    <div
                        onClick={openState}
                        aria-controls="example-collapse-text"
                        aria-expanded={open}
                        className=" cursor-pointer trackbar "
                    >


                        <div className="d-flex align-items-center justify-content-between">
                            <div className="text-dark">
                                {n.anonymous == 1 && n && n.sender == false ? (
                                    <Avatar name={`From : Anonymous`} subhead={(n.membership && n.membership.level) || "Membership Payment"} src={userphoto || ""}/>
                                ) : (
                                    <>
                                    <Avatar name={`From : ${ (n && n.user && n.user.name) || "Anonymous" }`} link={ (n.user && n.user.username) || null } subhead={(n.membership && n.membership.level) ||"Membership Payment"} username={(n.user && n.user.username) || ""} src={(n && n.user && n.user.avatar_url) ||userphoto} />
                                    </>
                                )}
                            </div>
                            <div className="text-muted rightbar d-flex align-items-center ">
                                <div>
                                    {n && n.sender ? (
                                        <div className="identity text-danger text-nowrap">
                                            -{formatMultiPrice(
                                                n.amount,
                                                n.currency
                                            )}
                                        </div>
                                    ) : (
                                        <div className="identity text-success text-nowrap">
                                            +
                                            {formatMultiPrice(
                                                n.final_amount,
                                                n.currency
                                            )}
                                        </div>
                                    )}
                                    <p className='text-[13px] text-right'><TimeFormat dateString={n &&n &&n.created_at}  /></p>
                                </div>

                                <div className="angle-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {" "}
                                        <g
                                            id="SVGRepo_bgCarrier"
                                            stroke-width="0"
                                        ></g>{" "}
                                        <g
                                            id="SVGRepo_tracerCarrier"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        ></g>{" "}
                                        <g id="SVGRepo_iconCarrier">
                                            {" "}
                                            <path
                                                d="M12 14.5C11.9015 14.5005 11.8038 14.4813 11.7128 14.4435C11.6218 14.4057 11.5392 14.3501 11.47 14.28L8 10.78C7.90861 10.6391 7.86719 10.4715 7.88238 10.3042C7.89756 10.1369 7.96848 9.97954 8.08376 9.85735C8.19904 9.73515 8.352 9.65519 8.51814 9.63029C8.68428 9.6054 8.85396 9.63699 9 9.72003L12 12.72L15 9.72003C15.146 9.63699 15.3157 9.6054 15.4819 9.63029C15.648 9.65519 15.801 9.73515 15.9162 9.85735C16.0315 9.97954 16.1024 10.1369 16.1176 10.3042C16.1328 10.4715 16.0914 10.6391 16 10.78L12.5 14.28C12.3675 14.4144 12.1886 14.4931 12 14.5Z"
                                                fill="#000000"
                                            ></path>{" "}
                                        </g>{" "}
                                    </svg>
                                </div>

                            </div>
                        </div>
                    </div>
                    <Collapse in={open}>
                        <div id="example-collapse-text">
                            <div className="track-summary mt-4">
                                <div className="wishitem-des box border rounded-lg">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="wish-item">
                                            <img
                                                src={
                                                    (n.membership && n.membership.perma_link) ||
                                                    defaultsec
                                                }
                                                alt="image"
                                                className="img-fluid"
                                            />
                                        </div>
                                        <div className="item-dd ps-3">
                                            <p className="mb-0 pe-2">
                                                {(n.membership && n.membership.level) ||
                                                    "Surprise Gift"}
                                            </p>
                                            <p className="text-muted text-small">
                                                QTY : {n.quantity || 1} x{" "}
                                                {formatMultiPrice(
                                                    n.amount,
                                                    n?.currency ||
                                                        "gbp"
                                                )}
                                                 {n && n.sender == false ? ' + VAT' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {n && n.message ? (
                                        <div className="border-top pt-3 mt-3 d-flex justify-content-between align-items-center">
                                            <p className="mb-0 pe-2">
                                                Message :
                                            </p>
                                            <p className="text-muted text-small">
                                                {n && n.message}
                                            </p>
                                        </div>
                                    ) : (
                                        ""
                                    )}

                                    <div className="border-top pt-3 mt-3  d-flex justify-content-between align-items-center">
                                        <p className="mb-0 pe-2">Paid in </p>
                                        <p className="text-muted text-small">
                                            {n &&
                                                n &&
                                                n.currency}
                                        </p>
                                    </div>
                                    <div className="border-top pt-3 mt-3  d-flex justify-content-between align-items-center">
                                        <p className="mb-0 pe-2">Guest Email </p>
                                        <p className="text-muted text-small">
                                            {n && n.guest_email}
                                        </p>
                                    </div>
                                    <div className="border-top pt-3 mt-3  d-flex justify-content-between align-items-center">
                                        <p className="mb-0 pe-2">Guest Name </p>
                                        <p className="text-muted text-small capitalize">
                                            {n && n.guest_name}
                                        </p>
                                    </div>

                                </div>

                                {/* {n && n.sender == false ? ( */}
                                    {/* <TweetNow
                                        type="purchase"
                                        id={n && n.uuid}
                                    /> */}
                                {/* // ) : (
                                //     ""
                                // )} */}
                                {/* <p className="mt-3 mb-2">Exclusive Rewards </p>
                                {n && n.message_url ? (
                                    <div className="message-media my-2">
                                        <LazyLoadImage
                                            src={n.message_url}
                                            alt="image"
                                            height={"100%"}
                                            useIntersectionObserver={true}
                                            effect="blur"
                                            width={"100%"}
                                        />
                                    </div>
                                ) : (
                                    ""
                                )} */}
                            </div>
                        </div>
                    </Collapse>
                </div>
      </>
   }
   return (
      <div className='tips mt-4'>
         {membership && membership.map((g, i)=>{
            return <GoalItem n={g} />
         })}
          {membership && membership.length < 1 ?<Nocontent text="nothing to see" /> : ''}
      </div>
  )
}
