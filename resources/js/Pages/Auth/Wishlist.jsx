import LoaderButton from "@/Components/LoaderButton";
import {  useForm } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import { useEffect, useRef, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Accordion from "react-bootstrap/Accordion";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import Popup from "@/Components/Popup";
import { router } from "@inertiajs/react";
import {  Pagination, Navigation  } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import PinWish from "@/includes/PinWish";


export default function Wishlist(props) {
    const { categories, auth, fetchingcats, item, editpop, openPop } = props;
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const inputRef = useRef(null);
    const [defaultKey, setDefaultKey] = useState(item && item.subscription !== null ? +(item.subscription) : null);
    const [clear, setClear] = useState();
    const [close, setClose] = useState();

    useEffect(()=>{
        setClose(openPop);
    },[openPop]);

    const [repeat, setRepeat] = useState(true);
    const [thumbnail, setThumbnail] = useState("");
    const [adding, setAdding] = useState(false);

    const AddCategory = async () => {
        const value = inputRef.current.value;
        setAdding(true);
        router.post("save-category",
            { category: value },{
                preserveScroll: true,
                onSuccess: (resp) => {
                    inputRef.current.value = "";
                    if (resp.props.flash?.success) {
                        successAlert(resp.props.flash?.success || "Added");
                    }
                    if (resp.props.flash?.error) {
                        errorAlert(resp.props.flash?.error);
                    }
                    setAdding(false);
                },
                onError: (_err) => {
                    console.table("error", _err);
                    setAdding(false);
                    errorAlert(_err?.category);
                }
            }
        );
    };

    const imageLinks = [
        'be9060ab-1a76-452f-b805-1c71d9af4fb7',
        '01bbc3bd-7e79-4dc0-817c-2c260da43c20',
        'f0c45dc9-cc56-4955-a406-7527004a1373',
        '4c42426a-1396-49e2-8b46-2381a2ae5d7b'
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        wishname: item && item.wishname ? item.wishname : "",
        price: item && item.price ? item.price : "",
        item_url: item && item.item_url ? item.item_url : "",
        thumbnail: item && item.thumbnail ? item.thumbnail : imageLinks[0] ,
        subscription: item && item.subscription ? item.subscription : "",
        subscription_period: item && item.subscription_period ? item.subscription_period : "" ,
        repeat_purchase: item && item.repeat_purchase ? item.repeat_purchase : 0,
        category: item && item.category ? item.category : 0,
    });
    const [period, setPeriod] = useState(data.subscription_period || item && item.subscription_period );

    const onSlideChange = (swiper) => {
        setData("thumbnail", imageLinks[swiper && swiper.activeIndex]);
    };

    // useEffect(()=>{
    //     setData("thumbnail", imageLinks[0]);
    // }, [item && item.uuid]);

    const setSubs = (e) => {
        setData("subscription", e);
        setRepeat(true);
    };

    const [checkboxes, setCheckboxes] = useState([]);
    const catValue = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setCheckboxes([...checkboxes, value]);
        } else {
            setCheckboxes(checkboxes.filter((item) => item !== value));
        }
    };

    const getFileUID = async (data) => {
        let ss = data?.uuid;
        setThumbnail(ss);
    };
    const rpValue = (e) => {
        setRepeat(e.target.checked);
        setData("repeat_purchase", e.target.checked ? 1 : 0);
    };
    const spValue = (e) => {
        setData("subscription_period", e.target.value);
        setPeriod( e.target.value);
    };

    useEffect(() => {
        setData("category", checkboxes);
    }, [checkboxes]);

    useEffect(() => {
        setData("thumbnail", thumbnail);
    }, [thumbnail]);

    const createWishList = (e) => {
        e.preventDefault();
        if(editpop ){
            post(route(`update_wish_item`, [item && item.uuid]), {
                preserveScroll: true,
                onSuccess: (resp) => {
                    if(resp.props.flash?.success){
                        successAlert(resp.props.flash?.success || "Updated successfully.");
                    }
                    if(resp.props.flash?.error){
                        errorAlert(resp.props.flash?.error || "Something went wrong.")
                    }
                    reset();
                    setClose(false);
                    setClear(new Date());
                    setTimeout(() => {
                        setClose();
                    }, 100);
                    fetchingcats('all');
                },
                onError: (_err) => {
                    console.error(_err);
                    errorsHandling(_err);
                    errorAlert(resp.props.flash?.success || "Added");
                },
            });
        } else {
            post(route("save_wish_item"), {
                preserveScroll: true,
                onSuccess: (resp) => {
                    reset();
                    if(resp.props.flash?.success){
                        successAlert(resp.props.flash?.success || "Wish added successfully.");
                    }
                    if(resp.props.flash?.error){
                        errorAlert(resp.props.flash?.error || "Something went wrong.")
                    }
                    setClose(false);
                    setClear(new Date());
                    setTimeout(() => {
                        setClose();
                    }, 100);
                    fetchingcats('all');
                },
                onError: (_err) => {
                    console.error(_err);
                    errorsHandling(_err);
                    errorAlert(resp.props.flash?.success || "Added");
                },
            });
        }
    };



    return (
            <Popup modalclass='pinkmodal' size='md' action={close}
                classes={`${editpop ? "editpop"  : 'btn-pink lg px-4'}`}
                text={`${editpop ? ""  : '+ Add wish'}`} >
                <div className="editprofileModal  wishlistModal ">
                    <div className="editprofileModalInner  ">
                        <h2 className="font-GillSans pt-4 px-3">Add A Wish </h2>
                        <Tabs
                            defaultActiveKey="1"
                            id="uncontrolled-tab-example"
                            className="mb-3" >
                            <Tab eventKey="1" title="Custom">
                                <div className="wishinfo">
                                    {/* <PinWish /> */}
                                    <form onSubmit={createWishList}>
                                        <ul className="ps-0" >
                                            <li className="mb-4">
                                                <label className="mb-2 text-start d-block">
                                                    Wish Name
                                                </label>
                                                <input
                                                    id="wishname"
                                                    name="wishname"
                                                    type="text"
                                                    placeholder="Eg. Buy me a coffee"
                                                    value={data.wishname}
                                                    className="form-input px-2 py-2 border w-full rounded-md"
                                                    autoComplete="name"
                                                    onChange={(e) => setData( "wishname",e.target.value )}
                                                    required
                                                />
                                            </li>
                                            <li className="mb-4">
                                                <label className="mb-2 text-start d-block">Price </label>
                                                <input
                                                    id="price"
                                                    type="number"
                                                    name="price"
                                                    placeholder="Eg. 50"
                                                    value={data.price || item && item.price }
                                                    step={`0.01`}
                                                    className="form-input px-2 py-2 border w-full rounded-md"
                                                    autoComplete="price"
                                                    onChange={(e) =>
                                                        setData(
                                                            "price",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </li>
                                            <li className="mb-4">
                                                <label className="mb-2 text-start d-block">
                                                    URL (Optional)
                                                </label>
                                                <input
                                                    id="item_url"
                                                    type="text"
                                                    placeholder="URL"
                                                    name="item_url"
                                                    value={data.item_url || item && item.item_url}
                                                    className="form-input px-2 py-2 border w-full rounded-md"
                                                    autoComplete="item_url"
                                                    onChange={(e) =>setData( "item_url",e.target.value )}
                                                />
                                            </li>
                                            <li className="mb-4">
                                                <label className="mb-2 text-start d-block">
                                                    Choose Image or Upload
                                                </label>

                                                {item && item.perma_link ? <div className="default-wish-img mb-1">
                                                    <img src={item && item.perma_link || uploadedimg}
                                                        className="img-fluid"
                                                    />
                                                </div> :
                                                    <Swiper spaceBetween={0}
                                                        pagination={{ clickable: true }}
                                                        navigation={true}  onSlideChange={onSlideChange}
                                                        modules={[Pagination, Navigation]}
                                                        slidesPerView={1} >
                                                        {imageLinks && imageLinks.map((image)=>{
                                                            return <SwiperSlide key={`swiper-item-${image}`} >
                                                                <div className="default-wish-img mb-1">
                                                                    <img src={`https://ucarecdn.com/${image}/`} className="img-fluid" />
                                                                </div>
                                                            </SwiperSlide>
                                                        })}
                                                    </Swiper>
                                                 }

                                                <h4 className="mt-2 mb-2 w-100 text-center"  >OR</h4>
                                                <GlobalUploader
                                                    clear={clear}
                                                    sendFile={getFileUID}
                                                    options={st.wishitemUploader}
                                                />
                                            </li>
                                        </ul>

                                        <div className="wishlistAccordian mt-3">
                                            <Accordion defaultActiveKey={defaultKey}>
                                                <Accordion.Item eventKey={0}>
                                                    <Accordion.Header
                                                        onClick={(e) =>setSubs(0)}>
                                                        <span className="activedote"></span>{" "}
                                                        Single Wish
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        <div className="singlewishbox">
                                                            <div className="repeatpurchase text-start">
                                                                <label htmlFor="allow">
                                                                    <input
                                                                        checked={repeat}
                                                                        type="checkbox"
                                                                        id="allow"
                                                                        name="repeat_purchase"
                                                                        onChange={rpValue}
                                                                    />
                                                                    Allow Repeat
                                                                    Purchases
                                                                </label>
                                                            </div>
                                                            <p className="text-start">
                                                                Check if you
                                                                want repeat
                                                                purchases of
                                                                this gift. If
                                                                unchecked, the
                                                                item will
                                                                automatically
                                                                delete from your
                                                                wishlist after
                                                                the first
                                                                purchase.
                                                            </p>
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                                <Accordion.Item eventKey={1}>
                                                    <Accordion.Header
                                                        onClick={(e) =>
                                                            setSubs(1)
                                                        }>
                                                        <span className="activedote"></span>{" "}
                                                        Subscription
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        <div className="singlewishbox rounded ">
                                                            <strong className="mb-2 text-start d-block ">
                                                                Allows gifter to
                                                                purchase this
                                                                item on a
                                                                recurring basis.
                                                            </strong>
                                                            <div className="repeatpurchase text-start">
                                                                <label htmlFor="daily">
                                                                    <input
                                                                        checked={
                                                                            period ==
                                                                            "daily"
                                                                        }
                                                                        type="radio"
                                                                        id="daily"
                                                                        value={
                                                                            "daily"
                                                                        }
                                                                        name="subscription_period"
                                                                        onChange={
                                                                            spValue
                                                                        }
                                                                    />{" "}
                                                                    Daily
                                                                </label>
                                                            </div>
                                                            <div className="repeatpurchase mt-2 text-start">
                                                                <label htmlFor="weekly">
                                                                    <input
                                                                        checked={
                                                                            period ==
                                                                            "weekly"
                                                                        }
                                                                        type="radio"
                                                                        id="weekly"
                                                                        value={
                                                                            "weekly"
                                                                        }
                                                                        name="subscription_period"
                                                                        onChange={
                                                                            spValue
                                                                        }
                                                                    />{" "}
                                                                    Weekly
                                                                </label>
                                                            </div>
                                                            <div className="repeatpurchase mt-2 text-start">
                                                                <label htmlFor="monthly">
                                                                    <input
                                                                        checked={period == "monthly"}
                                                                        type="radio"
                                                                        id="monthly"
                                                                        value={"monthly"}
                                                                        name="subscription_period"
                                                                        onChange={spValue}
                                                                    />
                                                                    Monthly
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                                <Accordion.Item eventKey={2}>
                                                    <Accordion.Header
                                                        onClick={(e) =>
                                                            setSubs(2)
                                                        }
                                                    >
                                                        <span className="activedote"></span>{" "}
                                                        Crowdfund
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        <p className="text-start d-block">
                                                            Allows multiple
                                                            gifters to
                                                            contribute to your
                                                            wish item.
                                                        </p>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>
                                        </div>

                                        <div className="publish text-start">
                                        {editpop ?
                                        <LoaderButton
                                            disabled={processing}
                                            type="submit"
                                            className="flex w-100 btn-pink lg mx-auto"
                                            spinnerClassName="fill-red-600" >
                                            {processing ? "Updating.." : "Update Wish"}
                                        </LoaderButton>
                                     :
                                        <>
                                            <strong>
                                                Categorize this wish ( Optional
                                                )
                                            </strong>
                                            <p>
                                                Organize your wishes to help
                                                gifters find what they're
                                                looking for while on your
                                                wishlist.
                                            </p>

                                            <div className="catslists">
                                                {categories &&
                                                    categories.map((c, i) => {
                                                        return (
                                                            <>
                                                                <div className="repeatpurchase mb-2 text-start">
                                                                    <label
                                                                        className="text-capitalize"
                                                                        htmlFor={"categories" + i}>
                                                                        <input
                                                                            type="checkbox"
                                                                            id={"categories" + i}
                                                                            value={c.id}
                                                                            name="category"
                                                                            onChange={catValue}
                                                                        />
                                                                        {c.category}
                                                                    </label>
                                                                </div>
                                                            </>
                                                        );
                                                    })}
                                            </div>

                                            <div className="cate-items mb-3 mt-4 d-flex ">
                                                <input
                                                    id="cats"
                                                    type="text"
                                                    ref={inputRef}
                                                    className="form-input px-2 py-2 border w-full rounded-md"
                                                />
                                                <div
                                                    className="p-2 border cursor-pointer"
                                                    onClick={AddCategory}>
                                                    {adding ? "Adding..":"Add"}
                                                </div>
                                            </div>
                                            <LoaderButton
                                                disabled={processing}
                                                type="submit"
                                                className="flex w-100 btn-pink lg mx-auto"
                                                spinnerClassName="fill-red-600" >
                                                {processing ? "Processing" : "Add Wish"}
                                            </LoaderButton>
                                            </> }

                                        </div>

                                    </form>
                                </div>
                            </Tab>
                            {/* <Tab eventKey="2" title="Prefill with URL">
                                    Tab content for Profile
                                </Tab>
                            */}
                        </Tabs>
                    </div>
                </div>
            </Popup>
    );
}
