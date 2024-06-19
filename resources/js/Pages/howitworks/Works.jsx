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
                        <Tab eventKey="1" title="Supporters">
                            <div className='funboxs mintbg shadow-black border-black mb-10'>
                                <div className='funboximg' data-aos="fade-up" >
                                        <img src={vishitimg01} alt='img' />
                                </div>
                                <div className='funcnt'>
                                    <h5 className='text-voilet mb-2'>STEP 1</h5>
                                    <h3 className='headingSm text-shadow-black mb-3'>Visit a <br></br> Creator’s Page</h3>
                                    <p className='text-CeraGR'>Browse your favorite creator’s page and check out their latest posts, shop
                                    items, wishes, and so much more.</p>
                                </div>
                            </div>
                            
                            <div className='funboxs pinkbg shadow-black border-black mb-10'>
                                <div className='funcnt' data-aos="fade-up">
                                    <h5 className='text-voilet text-black mb-2'>STEP 2</h5>
                                    <h3 className='headingSm text-shadow-black mb-3 text-purple'>Send Some<br/> Support</h3>
                                    <p className='text-CeraGR text-wh'>Join a membership, purchase a wish or shop item, and maybe just send
                                    some love to fill their Piggy Bank.</p>
                                </div>
                                <div className='funboximg'>
                                    <img src={giftbasketimg01} alt='img' />
                                </div>
                            </div>
                            <div className='funboxs bluebg shadow-black border-black mb-10'>
                                <div className='funboximg md:pe-4' >
                                    <img src={fundbasketimg01} className='max-h-[400px]' data-aos="fade-up" alt='img' />
                                </div>
                                <div className='funcnt' data-aos="fade-up" >
                                    <h5 className='text-mint mb-2'>STEP 3</h5>
                                    <h3 className='headingSm text-shadow-black mb-3 text-pink'>Create an <br></br> Account </h3>
                                    <p className='text-CeraGR text-wh'>Sign up for your supporter account. At the end of checkout, you’ll be
                                    prompted to create an account if you haven’t done so already. Here you can
                                    find all your exclusive content purchases or check the status of your custom
                                    orders.</p>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="2" title="Creators">
                        <div className='funboxs mintbg shadow-black border-black mb-10'>
                                <div className='funboximg pe-4'>
                                        <img src={yourwishlist01}  data-aos="fade-up" alt='img' />
                                    </div>
                                    <div className='funcnt' data-aos="fade-up" >
                                    <h5 className='text-voilet mb-2'>STEP 1</h5>
                                    <h3 className='headingSm text-shadow-black mb-3'>Set Up Your Page</h3>
                                    <p className='text-CeraGR'>Craft your unique space to sell exclusive content and custom products.<br></br>
                                        Publish an epic reward-based Wishlist or offer awesome tailored
                                        memberships. Make your page as unique as you are!</p>
                                </div>
                            </div>
                            
                            <div className='funboxs pinkbg shadow-black border-black mb-10'>
                                <div className='funcnt' data-aos="fade-up">
                                    <h5 className='text-voilet text-black mb-2'>STEP 2</h5>
                                    <h3 className='headingSm text-shadow-black mb-3 text-purple'>Set up your <br/> payments</h3>
                                    <p className='text-CeraGR text-wh'>Using our secure third-party payment processor, set up your payments to
                                    quickly and securely receive direct support and start funding your fabulous
                                    lifestyle!</p>
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
                                    <h3 className='headingSm text-shadow-black mb-3 text-pink'> 
                                    Don’t Be Shy…</h3>
                                    <p className='text-CeraGR text-wh'>Update your supporters with your first member-only posts. Share your page
                                    across all your socials, set up auto tweets, and watch the support roll in.</p>
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