import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { useAlerts } from "@/Components/Alerts";
import { Head, Link, useForm } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import toast from 'react-hot-toast';
import { useRef } from 'react';
import axios from 'axios';
export default function Register() {
    const CheckCircleIcon = () => {
        return <><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" fill="#000000"></path> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="2"></path> <path d="M9 12L10.6828 13.6828V13.6828C10.858 13.858 11.142 13.858 11.3172 13.6828V13.6828L15 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg></>
    }

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

    const { data, setData, post, get, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        gender: '',
        password_confirmation: '',
        promo: '',
    });

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

    const submit = (e) => {
        e.preventDefault();
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
                // reset("password");
                Object.keys(err).map((key) => {
                    errorAlert(err[key]);
                });
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
            <Head title="Register" />

            <div className='loginPage  blackbg py-14'>
                <div className='containerbox '>

                    <h2 className='headingLg pb-0 pb-md-4 text-center  px-2'>Create Account</h2>
                    <p className='text-center text-white mb-5 font-CeraGRBold'>Already registered? <Link className={'text-pink'} href={route('login')}  > Log In</Link></p>

                    <div className='loginform register mt-4 mt-md-5 mx-auto border-black whbg shadow-mint'>
                        <div className='loginheadbox pinkbg'>
                            <span className='mintbg'></span>
                            <span className='bluebg'></span>
                        </div>
                        <form onSubmit={submit} >
                            <div className='login-step1'>
                                <ul>
                                    <li>
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
                                    </li>
                                    <li>
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
                                        {data.username && usernameValid == 1 ? <p className='text-success text-small username-text'>Username is available.</p> : ''}
                                        {data.username && usernameValid == 0 ? <p className='text-danger text-small username-text' >{validMsg}</p> : ''}
                                    </li>
                                    <li>
                                        <label>Gender</label>
                                        <select onChange={(e) => setData('gender', e.target.value)} >
                                            <option disabled >Choose Gender</option>
                                            <option value={'he'} >He</option>
                                            <option value={'she'} >She</option>
                                            <option value={'they'} >They</option>
                                        </select>
                                        <InputError>{errors?.gender || ''}</InputError>
                                    </li>
                                    <li>
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
                                    </li>
                                    <li>
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
                                    </li>
                                    <li>
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
                                        <div className={`mt-3 ${mypass ? 'd-block' : 'd-none'}`} >

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
                                    </li>
                                </ul>

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
                                            By signing up you agree to our <Link className='text-voilet font-bold' target='_blank' href={route('terms-and-conditions')} >Terms & Conditions</Link>  and <a className='text-voilet font-bold' target='_blank' href={'https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6'} >Privacy Policy,</a>  and confirm that you are at least 18. years old.
                                        </p>
                                    </label>
                                </div>
                                <div className='wishlistbtn  rotate-btn text-center flex justify-center mt-4'>
                                    <LoaderButton disabled={processing} className='btn-pink lg lg2 mb-4 mb-md-0' spinnerClassName='fill-red-600'>{processing ? "Processing" : " Create Account"}</LoaderButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
