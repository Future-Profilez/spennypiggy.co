
import InputError from '@/Components/InputError';
import LoaderButton from '@/Components/LoaderButton';
import { Link, useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import GlobalUploader from '@/uploadcare/Uploader';
import st from '../../../css/uploader.module.css'
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Accordion from 'react-bootstrap/Accordion';
import defaultuserimg from '../../../assets/img/defaultuserimg.jpg';
import Popup from '@/Components/Popup';


export default function Wishlist() {

    const [clear, setClear] = useState();
    const [close, setClose] = useState();
    const [repeat, setRepeat] = useState(false);
    const [subsperiod, setSubsperiod] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm({
        wishname: '',
        price: 0.00,
        item_url: '',
        thumbnail: '',
        subscription: 0,
        subscription_period: '',
        repeat_purchase: repeat ? 1 : 0,
        category: 'one',
    });

    const setSubs = (e) => {
        setData('subscription', e);
        setRepeat(false);
    }
    const { successAlert, errorAlert } = useAlerts();

    const getFileUID = async (data) => {
        let ss = data?.uuid;
        console.log("ss", ss);
        setThumbnail(ss);
    }

    const rpValue = (e) => {
        console.log('checkbox', e.target.checked);
        setRepeat(e.target.checked)
    }

    const spValue = (e) => {
        console.log('sp', e.target.value);
        setSubsperiod(e.target.value)
    }

    useEffect(() => {
        setData('subscription_period', subsperiod); ''
        setData('thumbnail', thumbnail); ''
    }, [subsperiod, thumbnail]);



    const createWishList = (e) => {
        if (!thumbnail) {
            toast.error("Please select a thumbnail for wish list item");
            return false
        }

        e.preventDefault();
        post(route('save_wish_item'), {
            preserveScroll: true,
            onSuccess: (resp) => {
                reset();
                successAlert(resp.props.flash?.success || "Added");
                setClose(false);
                setClear(new Date);
                setTimeout(() => {
                    setClose();
                }, 100)
            },
            onError: (_err) => {
                console.log(`errors:`);
                console.table(errors);
            }
        });
    };

    return <>

        <Popup action={close}
            classes='btn-pink-lg' text="add wishlist" >
            <div className="wishlistModal">
                <div className="widhlistModalInner shadow-pink">
                    <h2 className="font-GillSans">Add A Wish</h2>

                    <Tabs defaultActiveKey="1" id="uncontrolled-tab-example" className="mb-3">
                        <Tab eventKey="1" title="Custom">
                            <div className="wishinfo">
                                <h3>Wish Information </h3>
                                <form onSubmit={createWishList}>
                                    <ul>
                                        <li className="mb-4">
                                            <label className="mb-2 text-start d-block">Wish Name</label>
                                            <input id="wishname"
                                                name="wishname"
                                                type="text"
                                                value={data.wishname}
                                                className="form-input px-2 py-2 border w-full rounded-md"
                                                autoComplete="name"
                                                onChange={(e) => setData('wishname', e.target.value)}
                                                required
                                            />
                                        </li>
                                        <li className="mb-4">
                                            <label className="mb-2 text-start d-block">Price </label>
                                            <input id="price"
                                                type="number"
                                                name="price"
                                                value={data.price}
                                                step={`0.01`}
                                                className="form-input px-2 py-2 border w-full rounded-md"
                                                autoComplete="price"
                                                onChange={(e) => setData('price', e.target.value)}
                                                required
                                            />
                                            <span className="donot">Don't forget to add to the total to cover shipping and tax.</span>
                                        </li>
                                        <li className="mb-4">
                                            <label className="mb-2 text-start d-block">URL (Optional)</label>
                                            <input id="item_url"
                                                type="text"
                                                name="item_url"
                                                value={data.item_url}
                                                className="form-input px-2 py-2 border w-full rounded-md"
                                                autoComplete="item_url"
                                                onChange={(e) => setData('item_url', e.target.value)}
                                            />
                                        </li>
                                        <li className="mb-4">
                                            <label className="mb-2 text-start d-block">Choose Image or Upload</label>
                                            <GlobalUploader clear={clear} sendFile={getFileUID} options={st.wishitemUploader} />
                                        </li>
                                    </ul>


                                    <div className="wishlistAccordian">
                                        <Accordion defaultActiveKey="0">
                                            <Accordion.Item eventKey="0">
                                                <Accordion.Header onClick={(e) => setSubs(0)} ><span className="activedote"></span> Single Wish</Accordion.Header>
                                                <Accordion.Body>
                                                    <div className="singlewishbox">
                                                        <div className="repeatpurchase text-start">
                                                            <label for="allow"><input checked={repeat} type="checkbox" id="allow" name='repeat_purchase' onChange={rpValue} /> Allow Repeat Purchases</label></div>
                                                        <p className='text-start' >Check if you want repeat purchases of this gift. If unchecked, the item will automatically delete from your wishlist after the first purchase.</p>
                                                    </div>
                                                </Accordion.Body>
                                            </Accordion.Item>
                                            <Accordion.Item eventKey="1">
                                                <Accordion.Header onClick={(e) => setSubs(1)} ><span className="activedote"></span> Subscription</Accordion.Header>
                                                <Accordion.Body>
                                                    <div className="singlewishbox">
                                                        <div className="repeatpurchase text-start">
                                                            <label for="allow"><input checked={repeat} type="checkbox" id="allow" name='repeat_purchase' onChange={rpValue} /> Allow Repeat Purchases</label></div>
                                                        <p className='text-start' >Check if you want repeat purchases of this gift. If unchecked, the item will automatically delete from your wishlist after the first purchase.</p>
                                                    </div>


                                                    <div className="singlewishbox  mt-4  rounded ">
                                                        <strong className='mb-2 text-start d-block '>Allows gifter to purchase this item on a recurring basis.</strong>
                                                        <div className="repeatpurchase text-start">
                                                            <label for="daily"><input type="radio" id="daily" value={'daily'} name='subscription_period' onChange={spValue} /> Daily</label>
                                                        </div>
                                                        <div className="repeatpurchase mt-2 text-start">
                                                            <label for="weekly"><input type="radio" id="weekly" value={'weekly'} name='subscription_period' onChange={spValue} /> Weekly</label>
                                                        </div>
                                                        <div className="repeatpurchase mt-2 text-start">
                                                            <label for="monthly"><input type="radio" id="monthly" value={'monthly'} name='subscription_period' onChange={spValue} /> Monthly</label>
                                                        </div>
                                                    </div>
                                                </Accordion.Body>
                                            </Accordion.Item>

                                            <Accordion.Item eventKey="2">
                                                <Accordion.Header onClick={(e) => setSubs(2)}><span className="activedote"></span> Crowdfund</Accordion.Header>
                                                <Accordion.Body>
                                                    fsdfdsfsdf
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        </Accordion>
                                    </div>

                                    <div className="publish text-start">
                                        <h3>Publish</h3>
                                        <h4>Categorize this wish (Optional)</h4>
                                        <p>Organize your wishes to help gifters find what they're looking for while on your wishlist.</p>
                                        
                                        {/* <button type='submit' className="editProfile flex w-12 max-w-xs mx-auto">{processing ? "Proccessing" : " Add Wish"}</button> */}

                                        <LoaderButton disabled={processing} type='submit'
                                            className=' flex w-12 btn-pink-lg  max-w-xs mx-auto'
                                            spinnerClassName='fill-red-600'>
                                            {processing ? "Proccessing" : "Add Wish"}
                                        </LoaderButton>

                                    </div>

                                </form>
                            </div>
                        </Tab>
                        {/* <Tab eventKey="2" title="Prefill with URL">
                            Tab content for Profile
                        </Tab> */}
                    </Tabs>
                </div>
            </div>
        </Popup>


        {/* <div className='loginPage mintbg py-14'>
            <h2 className='headingLg mb-5 text-center mb-6'>Add Item</h2>
            <div className='loginform mx-auto border-black whbg shadow-black'>
                <div className='loginheadbox pinkbg'>
                    <span className='mintbg'></span>
                    <span className='bluebg'></span>
                </div>
                <form onSubmit={createWishList} >
                    <div className='login-step1'>
                        <ul>
                            <li>
                                <label>Name</label>
                                <input id="wishname"
                                    name="wishname"
                                    type="text"
                                    value={data.wishname}
                                    className="mt-1 block w-full"
                                    autoComplete="name"
                                    onChange={(e) => setData('wishname', e.target.value)}
                                    required
                                />
                                <InputError message={errors.wishname} className='text-xs mt-2' />
                            </li>
                            <li>
                                <label>Price</label>
                                <input id="price"
                                    type="number"
                                    name="price"
                                    value={data.price}
                                    step={`0.01`}
                                    className="mt-1 block w-full"
                                    autoComplete="price"
                                    onChange={(e) => setData('price', e.target.value)}
                                    required
                                />
                                <InputError message={errors.price} className='text-xs mt-2' />
                            </li>
                            <li>
                                <label>Item Url</label>
                                <input id="item_url"
                                    type="text"
                                    name="item_url"
                                    value={data.item_url}
                                    className="mt-1 block w-full"
                                    autoComplete="item_url"
                                    onChange={(e) => setData('item_url', e.target.value)}
                                    required
                                />
                                <InputError message={errors.item_url} className='text-xs mt-2' />
                            </li>
                            <li>
                                <label>Wish Item Thumbnail</label>
                                <InputError message={errors.thumbnail} className='text-xs mt-2' />
                                <GlobalUploader sendFile={getFileUID} options={st.wishitemUploader} />
                            </li>
                            <li>
                                <label>Subscription</label>
                                <select
                                    id="subscription"
                                    name="subscription"
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('subscription', e.target.value)}
                                    defaultValue={data.subscription}
                                >
                                    <option value={0}>Single Item</option>
                                    <option value={1}>Subscription</option>
                                    <option value={2}>Crowd Fund</option>
                                </select>
                                <InputError message={errors.subscription} className='text-xs mt-2' />
                            </li>
                            <li>
                                <label>Subscription Period</label>
                                <select
                                    id="subscription_period"
                                    name="subscription_period"
                                    className="mt-1 block w-full"
                                    defaultValue={data.subscription_period}
                                    onChange={(e) => setData('subscription_period', e.target.value)}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="daily">Daily</option>
                                </select>
                                <InputError message={errors.subscription_period} className='text-xs mt-2' />
                            </li>
                            <li>
                                <label>Repeat Purchase</label>
                                <select
                                    id="repeat_purchase"
                                    name="repeat_purchase"
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('repeat_purchase', e.target.value)}
                                    defaultValue={data.repeat_purchase}>
                                    <option value={1}>Yes</option>
                                    <option value={0}>No</option>
                                </select>
                                <InputError message={errors.repeat_purchase} className='text-xs mt-2' />
                            </li>
                            <li>
                                <label>Category</label>
                                <select
                                    id="category"
                                    name="category"
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('category', e.target.value)}
                                    defaultValue={data.category} >
                                    <option value="one">One</option>
                                    <option value="two">Two</option>
                                </select>
                                <InputError message={errors.category} className='text-xs mt-2' />
                            </li>
                        </ul>
                        <div className='wishlistbtn rotate-btn text-center flex justify-center mt-16'> */}
        {/* <button type='submit' className='btn-pink-lg'>
                                    {processing ? "Proccessing" : " Create your Account"}
                                </button> */}
        {/* <LoaderButton disabled={processing} className='btn-pink-lg' spinnerClassName='fill-red-600'>{processing ? "Proccessing" : "Create Wishlist"}</LoaderButton>
                        </div>
                    </div>
                </form>
            </div>
        </div> */}
    </>
}
