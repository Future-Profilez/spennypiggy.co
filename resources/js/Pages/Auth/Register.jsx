import React, {  useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { useAlerts } from "@/Components/Alerts";
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import { useRef } from 'react';
import axios from 'axios';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { handleIpRedirection } from '../../includes/useIpRedirection';
import Countries from '../../includes/Countries';
import Popup from '@/Components/Popup';
import toast from 'react-hot-toast';

export default function Register(props) {
    const CheckCircleIcon = () => {
        return <><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" fill="#000000"></path> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="2"></path> <path d="M9 12L10.6828 13.6828V13.6828C10.858 13.858 11.142 13.858 11.3172 13.6828V13.6828L15 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg></>
    }
    const captchaRef = useRef(null);
    const checkRef = useRef();
    const gifterref = useRef();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const lowerLetter = /[a-z]/g;
    const capitalLetter = /[A-Z]/g;
    const numberLetter = /[0-9]/g;
    const specialLetter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/g;

    const inputField = (typeof window !== 'undefined') && document.getElementById('password');
    const letter = (typeof window !== 'undefined') && document.getElementById('letter');
    const capital = (typeof window !== 'undefined') && document.getElementById('capital');
    const number = (typeof window !== 'undefined') && document.getElementById('number');
    const special = (typeof window !== 'undefined') && document.getElementById('special');
    const length = (typeof window !== 'undefined') && document.getElementById('length');
    const [mypass, setmypass] = useState();

    const creatortypes = [
        { "label": "Artist", "value": "Artist" },
        { "label": "Activist", "value": "Activist" },
        { "label": "DJ", "value": "DJ" },
        { "label": "Beauty Creator", "value": "Beauty Creator" },
        { "label": "Dancer", "value": "Dancer" },
        { "label": "Developer", "value": "Developer" },
        { "label": "Cosplay Creator", "value": "Cosplay Creator" },
        { "label": "Education Creator", "value": "Education Creator" },
        { "label": "Fashionista", "value": "Fashionista" },
        { "label": "Gamer", "value": "Gamer" },
        { "label": "Gym Bunny", "value": "Gym Bunny" },
        { "label": "Musician", "value": "Musician" },
        { "label": "Model", "value": "Model" },
        { "label": "Podcaster", "value": "Podcaster" },
        { "label": "Streamer", "value": "Streamer" },
        { "label": "Video Creator", "value": "Video Creator" },
        { "label": "Writer", "value": "Writer" }
    ]

    const { ziggy } = usePage().props;
    const { url } = usePage(); // Access the current URL

    // Extract query parameters from the URL
    const params = new URLSearchParams(url.split('?')[1]); // Extract the query string
    const type = params.get('type'); // Get the 'type' parameter
    const { data, setData, post, get, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        gender: 'he',
        password_confirmation: '',
        promo: '',
        role: type && type === "creator" ? 1 : 0,
        creator_category:''
    });

    const [step, setStep] = useState(type && type === "creator" ? 1 : 0);
    const [role, setRole] = useState(null);
    const handleBecomeCreator = async(e)=> {
        setData("role", e);
        setRole(e);
        if(e == 1){
            await handleIpRedirection(ziggy);
            setStep(1);
        }else {
            setStep(2);
        }
    }

    const [address, setAddressData] = useState({
        country_code : '',
        country : '',
        state : '',
        city : '',
        postal_code : '',
        street_address : '',
    });
    const getCountry = (e) => {
        const c = JSON.parse(e);
        setAddressData({
            ...address,
            country : c.label,
            country_code : c.code
        });
    }
 
    const handleAddressInput = (e) => {
        setAddressData({
            ...address,
            [e.target.name]: e.target.value
        });
    }


    const [validMsg, setValidMsg] = useState('');
    const [usernameValid, setUsernameValid] = useState(null);
    const checkUsername = (e) => {
        axios.get(`/check-username/${e.target.value}`).then(resp => {
            if (resp.data.status == false) {
                setUsernameValid(0);
                setValidMsg(resp.data.msg);
            } else {
                setUsernameValid(1);
                setValidMsg(resp.data.msg);
            }
        }).catch(_err => {
            console.error("error", _err);
        });
    }

    const [verified, setVerified] = useState(false);
    const onVerify = (token) => {
        if(token){
            setVerified(true);
        } else {
            setVerified(false);
        }
    };

    const resetCaptcha = () => {
        captchaRef.current && captchaRef.current.resetCaptcha();
        setVerified(false);
    }

    const [profileTags, setProfileTags] = useState([]);
    const handleProfileTags = (e) => {
        const tags = e.target.value.split(",");
        const tagsArray = [...profileTags]; // Make a copy of the current state
        for (let i = 0; i < tags.length; i++) {
            const trimmedTag = tags[i].trim();
            const tagIndex = tagsArray.indexOf(trimmedTag);
            if (tagIndex !== -1) {
                tagsArray.splice(tagIndex, 1);
            } else {
                tagsArray.push(trimmedTag);
            }
        }
        setData("creator_category", JSON.stringify(tagsArray));
        setProfileTags(tagsArray);
    }

    const handleNext = () => {
        if(profileTags && profileTags.length <1){
            errorAlert("Please select at least one tag");
            return false;
        } else {
            setStep(step + 1);
        }
    }

    const [hasPop, setHasPop] = useState(false);
    const hasNotifiedRef = useRef();
    const accepted = () => {
        if(hasNotifiedRef && !hasNotifiedRef.current?.checked){
            errorAlert("Please check and accept the terms and conditions.");
            hasNotifiedRef.current.focus();
            return false;
        } else {
            setHasPop(false)
            submit();
        }
    }

    const submit = (e) => {
        e && e.preventDefault();
        if (!verified) {
            errorAlert("Please verify you are not a robot.")
            return false;
        }
        if (role !==1 && (address.country === '') ) {
            errorAlert("Country is required.");
            return false;
        }

        if (!checkRef.current.checked) {
            errorAlert("Please check accept terms & conditions checkbox");
            checkRef.current.focus();
            return false;
        }

        
        if (role == 0 && !gifterref.current.checked) {
            errorAlert("Please accept all terms and conditions.");
            gifterref.current.focus();
            return false;
        }

        if( role == 0 && hasNotifiedRef && !hasNotifiedRef?.current?.checked){
            setHasPop(true);
            setTimeout(()=>{
                setHasPop();
            },[]);
            return false;
        }
        // if (role == 0 && !hasNotifiedRef.current.checked) {
        //     errorAlert("Please check and accept the terms and conditions.");
        //     hasNotifiedRef.current.focus();
        //     return false;
        // }

        post(route('register', {...data, ...address}), {
            preserveScroll: true,
            onSuccess: (resp) => {
                if (resp.props.flash?.success) {
                    successAlert(resp.props.flash?.success || "Signup successfully.");
                }
                if (resp.props.flash?.error) {
                    errorAlert(resp.props.flash?.error || "Something went wrong.")
                }
            },
            onError: (err) => {
                Object.keys(err).map((key) => {
                    errorAlert(err[key]);
                });
                resetCaptcha();
            }
        });
    };

    const promoinput = useRef();
    const [codevalid, setCodeValid] = useState(false);
    const checkPromo = (e) => {
        const p = promoinput.current && promoinput.current.value;
        axios.get(`/check-coupon-code/${p}`).then(resp => {
            if (resp.data.status) {
                setCodeValid(true);
                setData("promo", p);
            } else {
                setCodeValid(false);
                errorAlert(resp.data.msg);
            }
        }).catch(_err => {
            console.error("error", _err);
            setCodeValid(false);
        });
    };

    const removecode = () => {
        setCodeValid(false);
        promoinput.current.value = '';
        setData("promo", '');
    }

    const handlePassHints = (e) => {
        setmypass(e.target.value);
        if (inputField.value.match(lowerLetter)) {
            letter.classList.remove('text-grey');
            letter.classList.add('valid');
        } else {
            letter.classList.remove('valid');
            letter.classList.add('text-grey');
        }

        if (inputField.value.match(capitalLetter)) {
            capital.classList.remove('text-grey');
            capital.classList.add('valid');
        } else {
            capital.classList.remove('valid');
            capital.classList.add('text-grey');
        }

        if (inputField.value.match(numberLetter)) {
            number.classList.remove('text-grey');
            number.classList.add('valid');
        } else {
            number.classList.remove('valid');
            number.classList.add('text-grey');
        }

        if (inputField.value.match(specialLetter)) {
            special.classList.remove('text-grey');
            special.classList.add('valid');
        } else {
            special.classList.remove('valid');
            special.classList.add('text-grey');
        }

        if (inputField.value.length > 7) {
            length.classList.remove('text-grey');
            length.classList.add('valid');
        } else {
            length.classList.add('text-grey');
            length.classList.remove('valid');
        }
    }

    
    return (
        <GuestLayout>
            {/* <IpRedirection />/ */}
            <Head title="Create Wishlist" />
            <div className='loginPage  blackbg pb-4 pb-md-5'>
                <div className='containerbox '>
                    <div className='loginform mt-3 mt-md-5 mx-auto border-black whbg shadow-mint'>

                        <div className='loginheadbox pinkbg p-4'>
                            <span className='mintbg '></span>
                            <span className='bluebg '></span>
                        </div>

                        <h1 className='text-[30px] font-GillSans text-uppercase d-none pt-8 text-center px-2'>Create Wishlist</h1>
                        <h2 className='text-[30px] font-GillSans text-uppercase pt-8 text-center px-2'>Create Account</h2>
                        <p className='text-center text-[18px] text-dark mb-4 '>Already registered? <Link className={'text-pink'} href={route('login')}  > Log In</Link></p>

                        <div className={`${step === 0 ? '' : 'd-none'}  what-are-you px-3 py-3 pb-5`} >
                            <div className='p-2 w-full max-w-[400px] m-auto'>
                                <div  onClick={()=>handleBecomeCreator(1)}  className={`${role==1 ? 'active' : '' }  cursor-pointer create-select border p-4 border-gray-300 rounded-4 text-center`}>
                                    <h2 className='text-[22px] font-GillSans text-uppercase' >I'm a Creator</h2>
                                    <p className='text-muted text-[16px] mt-1 mb-0' >I'd like to create a wishlist</p>
                                </div>
                            </div>
                            <div className='p-2 w-full max-w-[400px] m-auto'>
                                <div  onClick={()=>handleBecomeCreator(0)}  className={`${role==0 ? 'active' : '' }  cursor-pointer create-select border p-4 border-gray-300 rounded-4 text-center`}>
                                    <h2 className='text-[22px] font-GillSans text-uppercase' >I'm a Fan</h2>
                                    <p className='text-muted text-[16px] mt-1 mb-0' >I'm here to follow and support creators</p>
                                </div>
                            </div>

                            <p className='text-muted text-base text-center max-w-[450px] m-auto mt-4' >You can support other creators with either of the account types and can change your account type anytime.</p>
                        </div>

                        <div className={`${step === 1 ? '' : 'd-none'}  what-are-you px-3`} >
                            <div className='px-0 px-md-4 px-lg-5 pb-4'>
                                <p className='text-center text-[17px] text-muted ' >Choose from the following categories. This helps people find your profile. You can change these at any time.</p>

                                <div className='d-flex creator-tags justify-content-center flex-wrap mt-4' >
                                    {creatortypes.map((s, index) => (
                                        <div key={index} className="flex items-center">
                                            <input
                                                id={`tyeps-${index}`}
                                                name={s.value}
                                                type="checkbox"
                                                value={s.value}
                                                className="mr-2  text-indigo-500  hidden"
                                                onChange={handleProfileTags}
                                            />
                                            <label
                                                htmlFor={`tyeps-${index}`}
                                                className="me-1 mb-1 bg-gray-200 px-4 py-[10px] rounded-[40px] text-[15px] text-gray-600 cursor-pointer" >
                                                {s.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleNext} className='btn-pink md m-auto mt-3 w-full' >  Next</button>
                            </div>
                        </div>

                        <div className={`${step === 2 ? '' : 'd-none'}`} >
                            <form onSubmit={submit} >
                                <div className='login-step1 '>
                                    
                                    <div className='row'>
                                        <div className='col-md-6 mb-4 formfield'>
                                            <label>Display Name</label>
                                            <input id="name"
                                                name="name"
                                                value={data.name}
                                                className="mt-1 block w-full"
                                                autoComplete="name"
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                            <InputError>{errors?.name || ''}</InputError>
                                        </div>
                                        <div className='col-md-6 mb-4 formfield'>
                                            <label>Username</label>
                                            <input id="username"
                                                name="username" onBlur={checkUsername}
                                                value={data.username}
                                                className="mt-1 block w-full"
                                                autoComplete="username"
                                                isFocused={true}
                                                onChange={(e) => setData('username', e.target.value)}
                                                required
                                            />
                                            {/* {data.username && usernameValid == 1 ? <p className='text-success text-small username-text'>Username is available.</p> : ''} */}
                                            {data.username && usernameValid == 0 ? <p className='text-danger text-small username-text' >{validMsg}</p> : ''}
                                        </div>
                                        <div className='col-md-6 mb-4 formfield'>
                                            <label>Gender</label>
                                            <select onChange={(e) => setData('gender', e.target.value)} >
                                                <option disabled >Choose Gender</option>
                                                <option value={'he'} >He</option>
                                                <option value={'she'} >She</option>
                                                <option value={'they'} >They</option>
                                            </select>
                                            <InputError>{errors?.gender || ''}</InputError>
                                        </div>
                                        <div className='col-md-6 mb-4 formfield'>
                                            <label>Email</label>
                                            <input id="email"
                                                type="email"
                                                name="email"
                                                value={data.email}
                                                className="mt-1 block w-full"
                                                autoComplete="username"
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />
                                            <InputError>{errors?.email || ''}</InputError>
                                        </div>
                                        <div className='col-md-6 mb-4 formfield'>
                                            <label>Password</label>
                                            <input id="password"
                                                type="password"
                                                name="password"
                                                value={mypass}
                                                className="mt-1 block w-full"
                                                autoComplete="off"
                                                onKeyUp={(e)=>setData('password', e.target.value)}
                                                onChange={handlePassHints} required
                                            />
                                            <InputError>{errors?.password || ''}</InputError>
                                        </div>
                                        <div className='col-md-6 formfield'>
                                            <div>
                                                <label>Confirm Password</label>
                                                <input
                                                    id="password_confirmation"
                                                    type="password"
                                                    name="password_confirmation"
                                                    value={data.password_confirmation}
                                                    className="mt-1 block w-full"
                                                    autoComplete="off"
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    required
                                                />
                                                <InputError>{errors?.password_confirmation || ''}</InputError>
                                            </div>
                                        </div>
                                        <div className={`mb-3  ${mypass ? 'd-block' : 'd-none'}`} >
                                            <div className="pass greybox border-0 p-3" >
                                                <div id="msgText">
                                                    <h3>Password must contain the following:</h3>
                                                    <p id="letter" className="text-grey"><CheckCircleIcon /> &nbsp;A <b> lowercase</b> letter</p>
                                                    <p id="capital" className="text-grey"><CheckCircleIcon /> &nbsp;A <b> capital (uppercase)</b> letter</p>
                                                    <p id="number" className="text-grey"><CheckCircleIcon /> &nbsp;A <b> number</b></p>
                                                    <p id="special" className="text-grey"><CheckCircleIcon /> &nbsp;Special characters</p>
                                                    <p id="length" className="text-grey mb-0"><CheckCircleIcon /> &nbsp;Password should minimum 8 characters.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {role == 0 && role !== 1 ? 
                                        <>  
                                        <p className='border-t mt-3 pt-4 text-grey uppercase text-normal mb-2'>Address Information</p>
                                            <div className='row'>
                                                <div className='col-md-12 mb-4 formfield'>
                                                    <label>street_address</label>
                                                    <input id="street_address"
                                                        name="street_address"
                                                        className="mt-1 block w-full"
                                                        autoComplete="street_address"
                                                        onChange={handleAddressInput}
                                                        required
                                                    />
                                                </div>
                                                <div className='col-md-6 mb-4 formfield'>
                                                    <label>Choose Country</label>
                                                    <Countries send={getCountry} />
                                                </div>
                                                <div className='col-md-6 mb-4 formfield'>
                                                    <label>State</label>
                                                    <input id="state" 
                                                        name="state"
                                                        className="mt-1 block w-full"
                                                        autoComplete="state"
                                                        onChange={handleAddressInput}
                                                        required
                                                    />
                                                </div>
                                                <div className='col-md-6 mb-4 formfield'>
                                                    <label>City</label>
                                                    <input id="city"
                                                        name="city"
                                                        className="mt-1 block w-full"
                                                        autoComplete="city"
                                                        onChange={handleAddressInput}
                                                        required
                                                    />
                                                </div>
                                                <div className='col-md-6 mb-4 formfield'>
                                                    <label>Postal Code</label>
                                                    <input id="postal_code"
                                                        name="postal_code"
                                                        onChange={handleAddressInput}
                                                        className="mt-1 block w-full"
                                                        autoComplete="postal_code"
                                                        required
                                                    />
                                                </div>
                                                
                                            </div>
                                        </> 
                                        : 
                                        <>
                                        </>
                                    }
                                    
                                    <div className='promocode mb-4' >
                                        <div className='d-flex align-items-center justify-content-between' >
                                            <label className='mb-2'>Referral (optional) {codevalid ? <span className='text-success text-small' >Code Applied.</span> : ''}</label>
                                        </div>
                                        <div className='d-flex align-items-center relative' >
                                            <input ref={promoinput}
                                            placeholder="Enter Referral Code..." className='form-control ' />
                                            {codevalid ? <div  onClick={removecode}
                                            className={`cursor-pointer ${codevalid ? "mintbg text-dark" : "pinkbg"} promocode-btn ms-2 text-center`}
                                            >Remove</div>
                                                :
                                            <div className='absolute top-2 right-2 cursor-pointer mintbg text-dark promocode-btn ms-2 !py-2 text-center' onClick={checkPromo}
                                            >{ codevalid ? "Applied" : "Apply" }</div>}
                                        </div>
                                    </div>

                                    <div className='termselect'>
                                        <label htmlFor="termaccept">
                                            <p className='tersms-accept' >
                                                <input type="checkbox" ref={checkRef} id="termaccept" name="termaccept" value="termaccept"
                                                required onChange={(e) => setData("termaccept", e.target.value)}></input>
                                                By signing up you agree to our <a className='text-voilet font-bold' target='_blank' href={route('terms-and-conditions')} >Terms & Conditions</a>  and <a className='text-voilet font-bold' target='_blank' href={'https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6'} >Privacy Policy,</a>  and confirm that you are at least 18. years old. Pages that break our terms will be unpublished.
                                            </p>
                                        </label>
                                        {role == 0 ?
                                            <>
                                                <label htmlFor="gifterCheck">
                                                    <p className='tersms-accept mt-3' >
                                                        <input type="checkbox" ref={gifterref} id="gifterCheck" name="gifterCheck" value="gifterCheck"
                                                        required ></input>
                                                        The above matches the details on the bank card they will use. If it doesn’t their account will be suspended.
                                                    </p>
                                                </label>
                                            </>
                                            : ''
                                        }
                                    </div>

                                    <div className='m-auto hcaptcha-wrap d-table mb-2 mt-4  mt-md-3' >
                                        <HCaptcha  ref={captchaRef}
                                        sitekey={props.hcaptchakey || ''}
                                        data-theme="light"
                                        data-size="compact"
                                        onVerify={onVerify}
                                        />
                                    </div>
                                     
                                    <div className='wishlistbtn text-center flex justify-center mt-2'>
                                        <Popup action={hasPop} modalclass=" full stripe-terms shadow-pink ps-0"
                                            space="4" size="md"
                                            classes={`hidden`}
                                            text={`Create Account`} >
                                                <div className="addgoal" >
                                                    <h2 className="text-uppercase font-GillSans pb-4 font-large">Important notice !</h2>
                                                    <p className='mb-2' > You must not use any other individual’s information. Only a single account can be used with the information you confirm to us.  </p>
                                                    <ol className='d-block py-3' >
                                                        <li className='font-bold  text-[16px] mb-2 w-full' >1. First and Last name </li>
                                                        <li className='font-bold  text-[16px] mb-2 w-full' >2. Address registered for the bank card that will be used during checkouts </li>
                                                        <li className='font-bold  text-[16px] mb-2 w-full' >3. The e-mail used during checkouts. </li>
                                                    </ol>
                                                    <div className='termselect mt-4 mb-4'>
                                                        <label htmlFor="hasNotified">
                                                            <p className='text-[15px]' >
                                                                <input type="checkbox" ref={hasNotifiedRef} id="hasNotified" name="hasNotified" value="hasNotified"
                                                                required ></input>
                                                                I confirm that the above details are correct and the only details I will use. If I use other information than the above. My account will be suspended. If I need to update any details, I will contact support via live chat who can update my account.  
                                                            </p>
                                                        </label>
                                                    </div>
                                                    <LoaderButton onClick={accepted} disabled={processing} className='btn-pink w-full lg lg2 mb-4 mb-md-0' spinnerClassName='fill-red-600'>{processing ? "Processing" : " Accept Terms"}</LoaderButton>
                                                </div>
                                        </Popup>  
                                        <LoaderButton disabled={processing} className='btn-pink w-full lg lg2 mb-4 mb-md-0' spinnerClassName='fill-red-600'>{processing ? "Processing" : " Create Account"}</LoaderButton>
                                    </div>

                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
