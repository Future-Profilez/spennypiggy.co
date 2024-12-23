import React, {  useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { useAlerts } from "@/Components/Alerts";
import { Head, Link, useForm } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import { useRef } from 'react';
import axios from 'axios';
import HCaptcha from '@hcaptcha/react-hcaptcha';
const IpRedirection = React.lazy(() => import('@/includes/IpRedirection'));

export default function Register(props) {
    const CheckCircleIcon = () => {
        return <><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" fill="#000000"></path> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="2"></path> <path d="M9 12L10.6828 13.6828V13.6828C10.858 13.858 11.142 13.858 11.3172 13.6828V13.6828L15 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg></>
    }
    const captchaRef = useRef(null);
    const checkRef = useRef();
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

    const [step, setStep] = useState(0);

    const { data, setData, post, get, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        gender: '',
        password_confirmation: '',
        promo: '',
        role: 0,
        creator_category:''
    });

    const [role, setRole] = useState(null);
    const handleBecomeCreator = (e)=> { 
        setData("role", e);
        setRole(e);
        if(e == 1){ 
            setStep(1);
        }else {
            setStep(2);
        }
    }

    const termsaccept = () => {
        errorAlert("Please check accept terms & conditions checkbox");
        checkRef.current.focus();
        return false;
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

    const submit = (e) => {
        e.preventDefault();
        if (!verified) {
            errorAlert("Please verify you are not a robot.")
            return false;
        }
        if (!checkRef.current.checked) {
            termsaccept();
            return false;
        }
        post(route('register'), {
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

                                    <div className='promocode mb-4' >
                                        <div className='d-flex align-items-center justify-content-between' >
                                            <label className='mb-2'>Referral (optional) {codevalid ? <span className='text-success text-small' >Code Applied.</span> : ''}</label>
                                        </div>
                                        <div className='d-flex align-items-center' >
                                            <input ref={promoinput}
                                            placeholder="Enter Referral Code..." className='form-control ' />
                                            {codevalid ? <div  onClick={removecode}  
                                            className={`cursor-pointer ${codevalid ? "mintbg text-dark" : "pinkbg"} promocode-btn ms-2 text-center`}
                                            >Remove</div>
                                                : 
                                            <div  onClick={checkPromo}  
                                            className={`cursor-pointer ${codevalid ? "mintbg text-dark" : "pinkbg"} promocode-btn ms-2 text-center`}
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
                                    </div>

                                    <div className='m-auto hcaptcha-wrap d-table mb-3 mt-0 mt-md-3' >
                                        <HCaptcha  ref={captchaRef}
                                        sitekey={props.hcaptchakey || ''}
                                        data-theme="light" 
                                        data-size="compact" 
                                        onVerify={onVerify}
                                        />
                                    </div>


                                    <div className='wishlistbtn  text-center flex justify-center mt-4'>
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
