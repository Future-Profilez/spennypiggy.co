import { useState } from "react";
import CartItem from "./CartItem";
import { Link } from "@inertiajs/react";
import { useEffect } from "react";

export default function UserCarts({data}){

  const [isChecked, setIsChecked] = useState(false);
  const [message , setMessage] = useState(null);
  const [name , setName] = useState(null);
  const [email , setemail] = useState(null);

  return <>
    <div className="cartPage bg-white p-4 border-pink shadow-pink border-pink rounded-3xl">
        <div className="cartMain">
            <h2 className="pb-1 wishtitle">
                Wish Basket for {data.user?.name || ''} <Link className="text-voilet" href={`/${data.user?.username || ''}`}> @{data.user?.username || ''}</Link>
            </h2>
            <p className="pb-4"> You are about to send a payout to <strong>{data.user?.name || ''}</strong> to fund their wishes. </p>

            <div className="CartItemBox">
                {data.items && data.items.map((c, i)=> { 
                  return <CartItem data={c} key={i}  />
                })}
            </div>

            <div className="cartTotal px-0 py-3">
                <div className="cartSubTotal text-right mt-1">
                    <span>Platform Fee :</span> <strong className="text-end">£ {data.fee || ''}</strong>
                </div>
                <div className="cartSubTotal text-right mt-1">
                    <span>Subtotal :</span> <strong className="text-end">£ {data.total || ''}</strong>
                </div>
                <div className="cartSubTotal text-right mt-1">
                    <strong className="text-dark" >Total :</strong> <strong className="text-end">£ {data.total+data.fee || ''}</strong>
                </div>
                {/* <div className="cartTotalPrice text-right mt-5 px-3 py-6">
                    <strong className="font-CeraGRBold text-graydark">
                        Total
                    </strong>
                    <span className="font-CeraGRBold text-graydark">
                        £ 7700.00
                    </span>
                </div> */}
            </div>
            <div className="addMessage">
                <form>
                    <ul className="row">
                        <li>
                            <label>Add Message </label>
                            <textarea onChange={(e)=>setMessage(e.target.value)} placeholder="Write message in under 800 Words..."></textarea>
                        </li>

                        <li className="w-100 row">
                            <div className="col-md-6">
                                <label className="d-block text-start" >From</label>
                                <input className="form-input w-100 rounded" onChange={(e)=>setName(e.target.value)} type="text" placeholder="Enter Your Name..." />
                            </div>

                            <div className="col-md-6">
                                <label className="d-block text-start" >Email(Private)</label>
                                <input className="form-input w-100 rounded" onChange={(e)=>setemail(e.target.value)} type="email" placeholder="Enter Your email..." />
                            </div>
                        </li>

                        {/* <li className="cheklistbox">
                            <label for="dndpublish">
                                <input type="checkbox" id="dndpublish" name="dndpublish" value="dndpublish" /> 
                                Don't Publish
                            </label>

                            <span className="cheklistnot">
                                If checked, your wisher will not be able to
                                publish your message and pseudonym you
                                provided above to their wishlist. Regardless
                                of whether you check this or not, your email
                                and personal information will always be
                                private.
                            </span>
                        </li> */}

                        <li className="cheklistbox">
                            <label for="agreeterm">
                                <input onChange={(e)=>setIsChecked(e.target.checked)}
                                    type="checkbox"
                                    id="agreeterm"
                                    name="agreeterm" className="me-2"
                                    value="agreeterm"
                                ></input> 
                                I agree to the Terms of Service and Privacy
                                Policy and the following statements:
                            </label>

                            <div className="tearmlist">
                                <ul>
                                    <li>
                                        I am making a non-refundable cash
                                        gift donation.
                                    </li>
                                    <li>
                                        I expect no product or service in
                                        return from the gift recipient.
                                    </li>
                                    <li>
                                        This payment is a donation intended
                                        for the gift recipient.
                                    </li>
                                    <li>
                                        I have taken the necessary steps to
                                        confirm the wishlist owner is
                                        authentic and I understand that
                                        WishTender will not be held
                                        responsible for any issues arising
                                        from a catfishing situation.
                                    </li>
                                    <li>
                                        I understand that by violating these
                                        terms I may be subject to legal
                                        action or can fall a victim of
                                        scams.
                                    </li>
                                    <li>
                                        I understand that by checking the
                                        box above and then clicking
                                        "CHECKOUT", I will have created a
                                        legally binding e-signature to this
                                        agreement.
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                    <button  className={`${isChecked ? "" : 'disabled'}  btn-pink md w-1/2 text-center m-auto`}>
                        Checkout 
                    </button>
                </form>
            </div>
        </div>
    </div>
  </>
}