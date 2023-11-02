
import InputError from '@/Components/InputError';
import LoaderButton from '@/Components/LoaderButton';
import { Link, useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';

export default function Wishlist() {
    const {successAlert, errorAlert} = useAlerts();
    const { data, setData, post, processing, errors, reset } = useForm({
        wishname: '',
        price: 0.00,
        item_url: '',
        thumbnail: '',
        subscription: 0,
        subscription_period: 'daily',
        repeat_purchase: 1,
        category: 'one',
    });

    const createWishList = (e) => {
        e.preventDefault();
        post(route('save_wish_item'),{
            preserveScroll:true,
            onSuccess: (resp) => {
                reset();
                successAlert(resp.props.flash?.success || "Added")
            },
            onError: (_err) => {
                console.log(`errors:`);
                console.table(errors);
            }
        });
    };

    return <>

        <div className='loginPage mintbg py-14'>
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
                                <InputError message={errors.wishname} className='text-xs mt-2'/>
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
                                <InputError message={errors.price} className='text-xs mt-2'/>
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
                                <InputError message={errors.item_url} className='text-xs mt-2'/>
                            </li>
                            <li>
                                <label>Image</label>
                                <input
                                    id="thumbnail"
                                    type="file"
                                    name="thumbnail"
                                    value={data.thumbnail}
                                    className="mt-1 block w-full"
                                    autoComplete="thumbnail"
                                    onChange={(e) => setData('thumbnail', e.target.value)}
                                />
                                <InputError message={errors.thumbnail} className='text-xs mt-2'/>
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
                                <InputError message={errors.subscription} className='text-xs mt-2'/>
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
                                <InputError message={errors.subscription_period} className='text-xs mt-2'/>
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
                                <InputError message={errors.repeat_purchase} className='text-xs mt-2'/>
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
                                <InputError message={errors.category} className='text-xs mt-2'/>
                            </li>
                        </ul>
                        <div className='wishlistbtn rotate-btn text-center flex justify-center mt-16'>
                            {/* <button type='submit' className='btn-pink-lg'>
                                    {processing ? "Proccessing" : " Create your Account"}
                                </button> */}
                            <LoaderButton disabled={processing} className='btn-pink-lg' spinnerClassName='fill-red-600'>{processing ? "Proccessing" : "Create Wishlist"}</LoaderButton>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </>
}
