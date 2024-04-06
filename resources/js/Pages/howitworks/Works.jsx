import React from 'react'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import vishitimg01 from '../../../assets/img/vishitimg01.png'; 
import giftbasketimg01 from '../../../assets/img/giftbasketimg01.png'; 
import fundbasketimg01 from '../../../assets/img/fundbasketimg01.png'; 
import yourwishlist01 from '../../../assets/img/yourwishlist01.png'; 
import setuppaymentimg01 from '../../../assets/img/setuppaymentimg01.png'; 
import sharlinkimg from '../../../assets/img/sharlinkimg.png'; 
import { Head, Link } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import JoinUs from '@/Components/JoinUs';

export default function Works(props) {
    const {auth} = props;
  return (
    <Authenticated auth={auth?.user || ''} >
        <Head title={"How it works"} />
        <div className='pt-20 howitmain whbg'>
            <div className='containerbox'>
                <h2 className='headingMd text-shadow-black text-center mb-4'>How it works</h2>
                <p className='text-center'>Setting up your wishlist on Spenny Piggy only takes a few minutes. Add gifts from our <br/> partner brand catalog or any other retailer in the world.</p>
                <div className='howWorkTab mt-12 pb-12 mx-auto'>
                    <Tabs defaultActiveKey="1" id="uncontrolled-tab-example" className="mb-3">
                        <Tab eventKey="1" title="for Gifters">
                            <div className='funboxs mintbg shadow-black border-black mb-10'>
                                <div className='funboximg' data-aos="fade-up" >
                                    <img src={vishitimg01} alt='img' />
                                    </div>
                                    <div className='funcnt'>
                                    <h5 className='text-voilet mb-2'>STEP 1</h5>
                                    <h3 className='headingSm text-shadow-black mb-3'>Visit A <br/> Wishlist</h3>
                                    <p className='text-CeraGR'>Browse your favorite creator's wishes on their wishlist. From items, to outing, to treats, you can see everything your creator wishes for and add them to your gift basket.</p>
                                </div>
                            </div>
                            
                            <div className='funboxs pinkbg shadow-black border-black mb-10'>
                                <div className='funcnt' data-aos="fade-up">
                                    <h5 className='text-voilet text-black mb-2'>STEP 2</h5>
                                    <h3 className='headingSm text-shadow-black mb-3 text-purple'>Create a Gift <br/>  Basket</h3>
                                    <p className='text-CeraGR text-wh'>Pick one or more items to add to your gift basket</p>
                                </div>
                                <div className='funboximg'>
                                    <img src={giftbasketimg01} alt='img' />
                                </div>
                            </div>

                            <div className='funboxs bluebg shadow-black border-black mb-10'>
                                <div className='funboximg' >
                                    <img src={fundbasketimg01} data-aos="fade-up" alt='img' />
                                </div>
                                    
                                <div className='funcnt' data-aos="fade-up" >
                                    <h5 className='text-mint mb-2'>STEP 3</h5>
                                    <h3 className='headingSm text-shadow-black mb-3 text-pink'>Fund Basket <br/> with Message</h3>
                                    <p className='text-CeraGR text-wh'>You can choose to leave a message and a pseudonym. Your email will be kept hidden, but we will relay any picture messages from the creator to this email.</p>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="2" title="for wishers">
                        <div className='funboxs mintbg shadow-black border-black mb-10'>
                                <div className='funboximg'>
                                    <img src={yourwishlist01}  data-aos="fade-up" alt='img' />
                                    </div>
                                    
                                    <div className='funcnt' data-aos="fade-up" >
                                    <h5 className='text-voilet mb-2'>STEP 1</h5>
                                    <h3 className='headingSm text-shadow-black mb-3'>Create Your <br/> Wishlist</h3>
                                    <p className='text-CeraGR'>Add items from any online store or manually add offline wishes. With our custom gift entry, you can get creative. List full outfits, trips to the spa, shopping sprees, and more.</p>
                                </div>
                            </div>
                            
                            <div className='funboxs pinkbg shadow-black border-black mb-10'>
                                <div className='funcnt' data-aos="fade-up">
                                    <h5 className='text-voilet text-black mb-2'>STEP 2</h5>
                                    <h3 className='headingSm text-shadow-black mb-3 text-purple'>Set up your <br/> payments</h3>
                                    <p className='text-CeraGR text-wh'>Using our secure established third party payment processor, set up your payments. This information is never seen by your gifter.</p>
                                </div>
                                <div className='funboximg'>
                                    <img src={setuppaymentimg01} data-aos="fade-up" alt='img' />
                                </div>
                            </div>

                            <div className='funboxs bluebg shadow-black border-black mb-10'>
                                <div className='funboximg'>
                                    <img src={sharlinkimg} alt='img' data-aos="fade-up" />
                                </div>
                                    
                                <div className='funcnt' data-aos="fade-up">
                                    <h5 className='text-mint mb-2'>STEP 3</h5>
                                    <h3 className='headingSm text-shadow-black mb-3 text-pink'>Share links to <br/> different <br/> platforms </h3>
                                    <p className='text-CeraGR text-wh'>Showcase your gift with a shout-out on your socials or thank your fans directly on Spenny Piggy via a personal text or video message.</p>
                                </div>
                            </div>  
                        </Tab>
                    </Tabs>   
                </div>
            </div>  
            <JoinUs />
        </div>
    </Authenticated>
  )
}