import React from 'react'
import CartItem from '../cart/CartItem';
import Authenticated from "@/Layouts/AuthenticatedLayout";

export default function Cart() {
  return <>
        <Authenticated>
        <div  className='container' >
            <h2 className='text-bl font-GillSans pt-5 py-3   text-center text-2xl uppercase'>Cart</h2>
                
            {/* Creator Cart */}
            <div className='cartPage p-4 border-pink shadow-pink border-pink rounded-3xl'>

                <div className='cartMain'>
                    <h2 className='pb-1' >Wish Basket for asiansolequeen @asiansolequeen</h2>
                    <p className='pb-4'>You are about to send a payout to asiansolequeen to fund their wishes.</p>


                <div className='CartItemBox'>
                
                <CartItem />
                <CartItem />

                </div>

                <div className='cartTotal px-0 py-6'>
                    <div className='cartSubTotal text-right mt-1'><span>Subtotal :</span> <strong>£ 4500.00</strong></div>
                    <div className='cartSubTotal text-right mt-1'><span>Platform Fee :</span> <strong>£ 700.00</strong></div>
                    <div className='cartTotalPrice text-right mt-5 px-3 py-6'>
                        <strong className='font-CeraGRBold text-graydark'>Total</strong>
                        <span className='font-CeraGRBold text-graydark'>£ 7700.00</span>
                    </div>
                </div>
                <div className='addMessage'>
                    <form>
                        <ul className='row'>
                            <li>
                                <label>Add Message </label>
                                <textarea placeholder='Write message in under 800 Words...'></textarea>
                            </li>
                            <li className='halfbox'>
                                <label>From</label>
                                <input type='text' placeholder='Enter Your Name...' />
                            </li>
                            <li className='halfbox'>
                                <label>Email(Private)</label>
                                <input type='text' placeholder='Enter Your email...' />
                            </li>

                            <li className='cheklistbox'>
                                <label for="dndpublish"><input type="checkbox" id="dndpublish" name="dndpublish" value="dndpublish"></input> Don't Publish</label>
                                
                                <span className='cheklistnot'>If checked, your wisher will not be able to publish your message and pseudonym you provided above to their wishlist. Regardless of whether you check this or not, your email and personal information will always be private.</span>
                            </li>
                            <li className='cheklistbox'>
                                <label for="agreeterm"><input type="checkbox" id="agreeterm" name="agreeterm" value="agreeterm"></input> I agree to the Terms of Service and Privacy Policy and the following statements:</label>
                            
                                <div className='tearmlist'>
                                    <ul>
                                        <li>I am making a non-refundable cash gift donation.</li>
                                        <li>I expect no product or service in return from the gift recipient.</li>
                                        <li>This payment is a donation intended for the gift recipient.</li>
                                        <li>I have taken the necessary steps to confirm the wishlist owner is authentic and I understand that WishTender will not be held responsible for any issues arising from a catfishing situation.</li>
                                        <li>I understand that by violating these terms I may be subject to legal action or can fall a victim of scams.</li>
                                        <li>I understand that by checking the box above and then clicking "CHECKOUT", I will have created a legally binding e-signature to this agreement.</li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                        <button className='btn-pink md w-1/2 text-center m-auto'>Checkout</button>
                    </form>
                </div>
                </div>
            </div> 
                
            {/* Creator Cart */}
            <div className='cartPage p-4 border-pink shadow-pink border-pink rounded-3xl'>

                <div className='cartMain'>
                    <h2 className='pb-1' >Wish Basket for asiansolequeen @asiansolequeen</h2>
                    <p className='pb-4'>You are about to send a payout to asiansolequeen to fund their wishes.</p>


                <div className='CartItemBox'>
                
                <CartItem />
                <CartItem />

                </div>

                <div className='cartTotal px-0 py-6'>
                    <div className='cartSubTotal text-right mt-1'><span>Subtotal :</span> <strong>£ 4500.00</strong></div>
                    <div className='cartSubTotal text-right mt-1'><span>Platform Fee :</span> <strong>£ 700.00</strong></div>
                    <div className='cartTotalPrice text-right mt-5 px-3 py-6'>
                        <strong className='font-CeraGRBold text-graydark'>Total</strong>
                        <span className='font-CeraGRBold text-graydark'>£ 7700.00</span>
                    </div>
                </div>
                <div className='addMessage'>
                    <form>
                        <ul className='row'>
                            <li>
                                <label>Add Message </label>
                                <textarea placeholder='Write message in under 800 Words...'></textarea>
                            </li>
                            <li className='halfbox'>
                                <label>From</label>
                                <input type='text' placeholder='Enter Your Name...' />
                            </li>
                            <li className='halfbox'>
                                <label>Email(Private)</label>
                                <input type='text' placeholder='Enter Your email...' />
                            </li>

                            <li className='cheklistbox'>
                                <label for="dndpublish"><input type="checkbox" id="dndpublish" name="dndpublish" value="dndpublish"></input> Don't Publish</label>
                                
                                <span className='cheklistnot'>If checked, your wisher will not be able to publish your message and pseudonym you provided above to their wishlist. Regardless of whether you check this or not, your email and personal information will always be private.</span>
                            </li>
                            <li className='cheklistbox'>
                                <label for="agreeterm"><input type="checkbox" id="agreeterm" name="agreeterm" value="agreeterm"></input> I agree to the Terms of Service and Privacy Policy and the following statements:</label>
                            
                                <div className='tearmlist'>
                                    <ul>
                                        <li>I am making a non-refundable cash gift donation.</li>
                                        <li>I expect no product or service in return from the gift recipient.</li>
                                        <li>This payment is a donation intended for the gift recipient.</li>
                                        <li>I have taken the necessary steps to confirm the wishlist owner is authentic and I understand that WishTender will not be held responsible for any issues arising from a catfishing situation.</li>
                                        <li>I understand that by violating these terms I may be subject to legal action or can fall a victim of scams.</li>
                                        <li>I understand that by checking the box above and then clicking "CHECKOUT", I will have created a legally binding e-signature to this agreement.</li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                        <button className='btn-pink md w-1/2 text-center m-auto'>Checkout</button>
                    </form>
                </div>
                </div>
            </div> 
        </div>
        </Authenticated>
    </>
}
