import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useEffect, useRef, useState } from "react";
import LoaderButton from "@/Components/LoaderButton";
import { router, useForm, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import Accordion from "react-bootstrap/Accordion";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import Popup from "@/Components/Popup";
import { Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import PriceFormat from "@/includes/PriceFormat";
import axios from "axios";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { FaRegHeart } from "react-icons/fa";
const imageLinks = [
    "901c0a0e-e5de-4d7a-8ac3-de11a4632542",
    "6d5506b2-7361-4c58-8f1b-dfe1e196885a",
    "467f7ad0-e397-45fe-be22-a6e8e8afe9fa",
    "897b3ec3-63f8-42c0-83b3-a3a9a1b90b7c",
    "55965522-e075-4ef3-8afc-195dacbf267b", // first
    "bcd5dc1e-a97f-4f76-aa93-511c997ff2f0",
    "7490cf45-09a0-427d-abb7-568d98edf344",
    "59cf9a4a-6a4d-4297-915d-513847681f29",
];

export default function Wishlist(props) {
    const { global_currency, auth, wish_categories } = usePage().props;
    const {
        currency,
        item, text,
        editpop,
        openPop,
        setuped,
        customtext,
    } = props;
    const defaultCurrency =
        (auth && auth.user && auth.user.default_currency) || "GBP";
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const inputRef = useRef(null);
    const [defaultKey, setDefaultKey] = useState(
        item && item.subscription !== null ? +item.subscription : null
    );

    const [close, setClose] = useState();
    const { formatMultiPrice } = PriceFormat();
    const [repeat, setRepeat] = useState(true);
    const [thumbnail, setThumbnail] = useState(item?.thumbnail || "");
    const [adding, setAdding] = useState(false);
    const [rewardImage, setRewardImage] = useState("");
    const [isAiImage, setIsAiImage] = useState();

    useEffect(() => {
        setClose(openPop);
    }, [openPop]);

    const uploaderRef = useRef();
    const uploaderRef1 = useRef();
    const resetUploader = () => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
        if (uploaderRef1.current) {
            uploaderRef1.current.reset();
        }
        if (contentUploaderRef.current) {
            contentUploaderRef.current.reset();
        }
    };

    const [categories, setcategories] = useState(wish_categories || []);
    const fetch_categories = async () => {
        const controller = new AbortController();
        const { signal } = controller;
        axios
            .get(`/user/category/${auth && auth.user && auth.user.username}`, {
                signal,
            })
            .then((resp) => {
                setcategories(resp.data.categories);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const AddCategory = async () => {
        const value = inputRef.current.value;
        setAdding(true);
        axios
            .post("/user/save-category", { category: value })
            .then((res) => {
                setAdding(false);
                if (res.data.status) {
                    successAlert(res.data.msg || "Added");
                    inputRef.current.value = "";
                     fetch_categories();
                } else {
                    errorAlert(res.data.msg || "Something went wrong.");
                }
            })
            .catch((err) => {
                setAdding(false);
                errorsHandling(err);
            });
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        wishname: item && item.wishname ? item.wishname : "",
        price: item && item.price ? item.price : "",
        item_url: item && item.item_url ? item.item_url : "",
        thumbnail: item && item.thumbnail ? item.thumbnail : (editpop ? "" : imageLinks[0]),
        reward_file: item && item.reward_file ? item.reward_file : "",
        content_file: item?.content_file || "",
        subscription: item && item.subscription ? item.subscription : "",
        subscription_period:
            item && item.subscription_period ? item.subscription_period : "",
        repeat_purchase:
            item && item.repeat_purchase ? item.repeat_purchase : 1,
        category: item && item.category ? item.category : 0,
        ai_generated: isAiImage ? 1 : 0,
    });

    const [period, setPeriod] = useState(
        data.subscription_period || (item && item.subscription_period)
    );

    const onSlideChange = (swiper) => {
        setData("thumbnail", imageLinks[swiper && swiper.activeIndex]);
    };

    const setSubs = (e) => {
        setData("subscription", e);
        setRepeat(true);
    };

    const [checkboxes, setCheckboxes] = useState([]);
    const [real_category, setreal_category] = useState(
        item && item.real_category
    );
    const catValue = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setCheckboxes([...checkboxes, value]);
        } else {
            setreal_category(checkboxes.filter((item) => item !== value));
            setCheckboxes(checkboxes.filter((item) => item !== value));
        }
    };

    const [contentFile, setContentFile] = useState(item?.content_file || "");
    const contentUploaderRef = useRef();

    const getContentFileUID = async (data) => {
        let uuid = data?.uuid;
        setContentFile(uuid);
        setData("content_file", uuid);
        console.log("getContentFileUID",data)
    };

    useEffect(() => {
        setData("content_file", contentFile);
    }, [contentFile]);


    const [isEditable, setIsEditable] = useState(false);
    const getFileUID = async (data) => {
        let ss = data?.uuid;
        setThumbnail(ss);
        // setIsEditable(true);
    };


    // const wishImageEdited = async (d, uuid) => {
    //     const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`;
    //     setThumbnail(url);
    //     setIsEditable(false);
    // };

    const getAIImage = (e) => {
        setRewardImage(
            e.uuid +
                "/-/text_align/left/center/-/font/10/fff/-/text/80px8p/8p,100p/Made%20with%20AI%20/-/format/jpeg/-/preview/"
        );
        setIsAiImage(e.url);
        setData("ai_generated", 1);
    };

    const getrewardFile = async (data) => {
        let ss = data?.uuid;
        setRewardImage(ss);
        setIsAiImage(false);
        setData("ai_generated", 0);
    };


    const rpValue = (e) => {
        setRepeat(e.target.checked);
        setData("repeat_purchase", e.target.checked ? 1 : 0);
    };

    const spValue = (e) => {
        setData("subscription_period", e.target.value);
        setPeriod(e.target.value);
    };

    useEffect(() => {
        setData("category", checkboxes);
    }, [checkboxes]);

    useEffect(() => {
        setData("thumbnail", thumbnail);
        console.log("thumbnail",thumbnail);
    }, [thumbnail]);

    useEffect(() => {
        setData("content_file", contentFile);
    }, [contentFile]);

    // Initialize thumbnail state when editing an item
    useEffect(() => {
        if (editpop && item?.thumbnail) {
            setThumbnail(item.thumbnail);
        }
    }, [editpop, item]);

    // Initialize contentFile state when editing an item
    useEffect(() => {
        if (editpop && item?.content_file) {
            setContentFile(item.content_file);
        }
    }, [editpop, item]);

    const createWishList = async (e) => {
        e.preventDefault();
        if (currency == null || undefined) {
            errorAlert("Please choose a default currency.");
            return false;
        }
        if (!setuped) {
            errorAlert("You need to connect your stripe account first.");
            return false;
        }
        if (data && !data.category && !editpop) {
            errorAlert("Please choose a category for this item.");
            return false;
        }
        if ((!editpop && data && data.content_file == "") || null || undefined) {
            errorAlert("Please choose a exclusive reward content for this wish item.");
            return false;
        }
        if (editpop) {
            post(route(`update_wish_item`, [item && item.uuid]), {
                preserveScroll: true,
                onSuccess: (resp) => {
                    if (resp.props.flash?.success !== null) {
                        router.visit(
                            route("user.show", {
                            username: auth?.user?.username,
                            page : 'wishes'
                        }));
                        reset();
                        setClose(false);
                        setTimeout(() => {
                            setClose();
                        }, 100);
                        resetUploader();
                    }
                    if (resp.props.flash?.error) {
                        errorAlert(
                            resp.props.flash?.error || "Something went wrong."
                        );
                    }
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
                    if (resp.props.flash?.success !== null) {
                        router.visit(
                            route("user.show", {
                            username: auth?.user?.username,
                            page : 'wishes'
                        }));
                        reset();
                        setClose(false);
                        resetUploader();
                        setTimeout(() => {
                            setClose();
                        }, 100);
                    }
                    if (resp.props.flash?.error) {
                        errorAlert(
                            resp.props.flash?.error || "Something went wrong."
                        );
                    }
                },
                onError: (_err) => {
                    console.error(_err);
                    errorsHandling(_err);
                    // errorAlert(resp.props.flash?.success || "Added");
                },
            });
        }
    };

    const AddItem = () => {
        return (
            <div className=" flex items-center">
                <div className="p-1 rounded-lg bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                    <FaRegHeart color="var(--pink)" size="1.5rem" />
                </div>
                <div className="ps-3 text-start">
                    <h2 className="text-md font-normal font-GillSans uppercase">{text ?text :"Add Wish Item"}</h2>
                    <p className="text-sm font-poppins">
                        For products you will buy directly
                    </p>
                </div>
            </div>
        );
    };

    return (
        <Popup
            modalclassName="pinkmodal full"
            action={close}
            classes={`${ editpop ? "editpop" : "w-full font-bold addop bg-white rounded-xl p-3 mb-2 text-center" }`}
            text={customtext || <AddItem />}
        >
            <div className="editprofileModal  wishlistModal  ">
                <div className="editprofileModalInner ">
                    <div className="wishinfo border-top p-4  ">
                        <h2 className="mb-4 text-pink text-start font-GillSans uppercase text-large black-stroke font-semibold mb-1 pe-5">
                            {editpop ? " Edit Wish" : "Add A Wish"}
                        </h2>
                        <p className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300">
                            When adding items please ensure they are specific
                            i.e Holiday Clothes or New Gym Equipment. Items that
                            are non specific will be rejected and removed. Our
                            AI blocks adult content but any overly suggestive
                            images will also be rejected. Please reach out to
                            support for further clarification.
                        </p>
                        <form onSubmit={createWishList}>
                            <ul className="ps-0">
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
                                        onChange={(e) =>
                                            setData("wishname", e.target.value)
                                        }
                                        required
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">
                                        Price
                                    </label>
                                    <div className="currency-wrapper position-relative">
                                        <span className="currency-tag">
                                            {defaultCurrency}
                                        </span>
                                        <input
                                            id="price"
                                            type="number"
                                            name="price"
                                            placeholder="Eg. 50"
                                            value={data.price}
                                            step={`0.01`}
                                            className="form-input px-2 py-2 border w-full rounded-md"
                                            autoComplete="price"
                                            onChange={(e) =>
                                                setData("price", e.target.value)
                                            }
                                        />
                                    </div>
                                    {defaultCurrency !== "USD" && <p className="mt-1">
                                        The wish item amount is set to{" "}
                                        {formatMultiPrice(
                                            data.price,
                                            defaultCurrency
                                        )}
                                        .
                                    </p>}
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
                                        value={
                                            data.item_url ||
                                            (item && item.item_url)
                                        }
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        autoComplete="item_url"
                                        onChange={(e) =>
                                            setData("item_url", e.target.value)
                                        }
                                    />
                                </li>

                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">
                                        Choose Image or Upload
                                    </label>

                                    {item && item.perma_link ? (
                                        <div className="default-wish-img mb-1">
                                            <img
                                                src={
                                                    (item && item.perma_link) ||
                                                    uploadedimg
                                                }
                                                className="img-fluid"
                                            />
                                        </div>
                                    ) : (
                                        <Swiper
                                            spaceBetween={0}
                                            pagination={{
                                                clickable: true,
                                            }}
                                            navigation={true}
                                            onSlideChange={onSlideChange}
                                            modules={[Pagination, Navigation]}
                                            slidesPerView={1}
                                        >
                                            {imageLinks &&
                                                imageLinks.map((image) => {
                                                    return (
                                                        <SwiperSlide
                                                            key={`swiper-item-${image}`}
                                                        >
                                                            <div className="default-wish-img mb-1">
                                                                <img
                                                                    src={`https://ucarecdn.com/${image}/`}
                                                                    className="img-fluid"
                                                                />
                                                            </div>
                                                        </SwiperSlide>
                                                    );
                                                })}
                                        </Swiper>
                                    )}
                                    <h4 className="mt-2 mb-2 w-100 text-center">
                                        {" "}
                                        OR{" "}
                                    </h4>

                                    <div className={`${ !isEditable ? "" : "d-none" } editable`} >
                                        <GlobalUploader
                                            type="minimal" ctxName="wishlist"
                                            ref={uploaderRef}
                                            sendFile={getFileUID}
                                            options={st.wishitemUploader}
                                        />
                                    </div>
                                </li>
                            </ul>

                            <p className="mt-8 pt-6  !border-t ">Choose Wish Type</p>
                            <div className="wishlistAccordian  mt-3 mb-6">
                                <Accordion defaultActiveKey={defaultKey}>
                                    <Accordion.Item eventKey={0}>
                                        <Accordion.Header
                                            onClick={(e) => setSubs(0)}
                                        >
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
                                                        Allow Repeat Purchases
                                                    </label>
                                                </div>
                                                <p className="text-start">
                                                    Check if you want repeat
                                                    purchases of this gift. If
                                                    unchecked, the item will
                                                    automatically delete from
                                                    your wishlist after the
                                                    first purchase.
                                                </p>
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey={1}>
                                        <Accordion.Header
                                            onClick={(e) => setSubs(1)}
                                        >
                                            <span className="activedote"></span>{" "}
                                            Subscription
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="singlewishbox rounded ">
                                                <strong className="mb-2 text-start d-block ">
                                                    {" "}
                                                    Allows gifter to purchase
                                                    this item on a recurring
                                                    basis.{" "}
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
                                                            value={"daily"}
                                                            name="subscription_period"
                                                            onChange={spValue}
                                                        />
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
                                                            value={"weekly"}
                                                            name="subscription_period"
                                                            onChange={spValue}
                                                        />{" "}
                                                        Weekly
                                                    </label>
                                                </div>
                                                <div className="repeatpurchase mt-2 text-start">
                                                    <label htmlFor="monthly">
                                                        <input
                                                            checked={
                                                                period ==
                                                                "monthly"
                                                            }
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
                                    {/* <Accordion.Item eventKey={2}>
                                                <Accordion.Header
                                                    onClick={(e) => setSubs(2)}
                                                >
                                                    <span className="activedote"></span>{" "}
                                                    Crowdfund
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    <p className="text-start d-block">
                                                        Allows multiple gifters
                                                        to contribute to your
                                                        wish item.
                                                    </p>
                                                </Accordion.Body>
                                            </Accordion.Item> */}
                                </Accordion>
                            </div>

                            <div className="pt-4 pb-3">
                                <strong className="text-start d-block pt-4 !border-t ">
                                    Content File 
                                </strong>
                                <p className="text-small mb-3">
                                    Upload a single file that buyers will receive after purchase. 
                                    This can be an image, video, audio, PDF, or document file.
                                </p>
                                <p className="text-small mb-3">
                                    Supported formats: JPEG, PNG, GIF, MP4, MOV, AVI, MP3, WAV, PDF, DOC, DOCX (Max: 50MB)
                                </p>

                                {/* {contentFile && (
                                    <div className="mb-3 p-3 border rounded">
                                        <div className="default-wish-img mb-2">
                                            <img
                                                src={`https://ucarecdn.com/${contentFile}/`}
                                                className="img-fluid"
                                                style={{ maxHeight: '200px', objectFit: 'contain' }}
                                                alt="Content file preview"
                                            />
                                        </div>
                                    </div>
                                )} */}
                                
                                {contentFile ? 
                                    <div className="mb-3 bg-green-50 p-3 border !border-green-600 rounded-xl flex items-center justify-between">
                                         <p className="font-bold text-green-600 text-normal">Content Added</p>
                                         <button onClick={()=>setContentFile(null)} >Remove</button>
                                    </div>
                                    :
                                    <GlobalUploader
                                        type="minimal"
                                        ctxName="wishlistcontent"
                                        ref={contentUploaderRef}
                                        sendFile={getContentFileUID}
                                        options={st.wishlistcontent}
                                    />
                                }
                                
                                {errors.content_file && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {errors.content_file}
                                    </div>
                                )}
                            </div>

                            {/* <div className="pt-4 pb-3">
                                <strong className="text-start d-block">
                                    Exclusive Reward or Art commission *
                                </strong>
                                <p className="text-small mb-3">
                                    Create an exclusive image as a reward “think
                                    a custom photoshoot” or add an exclusive art
                                    commission “Unique drawing or painting
                                </p>
                                <p className="text-small mb-3">
                                    Rewards must be your own content, not stock
                                    imagery or content that you don’t have the
                                    ownership rights to. Wishes will be rejected
                                    if the reward is not sufficiently classed as
                                    unique content
                                </p>
                                {item && item.reward_url ? (
                                    <div className="default-wish-img border mb-2">
                                        <img
                                            src={item && item.reward_url}
                                            className="img-fluid"
                                        />
                                    </div>
                                ) : (
                                    ""
                                )}
                                {isAiImage ? (
                                    <div className="default-wish-img border mb-2">
                                        <img
                                            src={isAiImage}
                                            className="img-fluid"
                                        />
                                    </div>
                                ) : (
                                    ""
                                )}
                                <GlobalUploader
                                    type="minimal"
                                    ref={uploaderRef1}
                                    sendFile={getrewardFile}
                                    options={st.rewards}
                                />
                                <div className="flex justify-center">
                                    <div>
                                        <h5 className="text-center text-gray-400 text-lg py-3">
                                            Or
                                        </h5>
                                        <ImageGenerationWithAI
                                            update={getAIImage}
                                        />
                                    </div>
                                </div>
                            </div> */}

                            {/* <div className="twitter-an mt-3 pt-2">
                                            <div className="repeatpurchase mt-1 mb-2 text-start">
                                                <label
                                                    className="text-capitalize" htmlFor={"twitter-announcement"}>
                                                    <input type="checkbox"
                                                        checked={atweet}
                                                        id={'twitter-announcement'}
                                                        name="category"
                                                        onChange={autoTweet}
                                                    />
                                                    Auto Tweet
                                                </label>
                                            </div>
                                                <p className="text-small text-muted" >
                                                Enable auto tweet for this item.
                                            </p>
                                        </div> */}

                            <div className="publish text-start pt-6  !border-t ">
                                <>
                                    <strong >Categorize this wish *</strong>
                                    <p>
                                        {" "}
                                        Organize your wishes to help gifters
                                        find what they're looking for while on
                                        your wishlist.
                                    </p>

                                    <div className="catslists">
                                        {categories && categories.length
                                            ? categories.map((c, i) => {
                                                  const filteritem =
                                                      real_category &&
                                                      real_category.filter(
                                                          (item) =>
                                                              item?.category ==
                                                              c?.category
                                                      );
                                                  const isCategory =
                                                      filteritem &&
                                                      filteritem[0]
                                                          ? true
                                                          : null;
                                                  return (
                                                      <>
                                                          <div className="repeatpurchase mb-2 text-start">
                                                              <label
                                                                  className="text-capitalize"
                                                                  htmlFor={
                                                                      "categories" +
                                                                      i
                                                                  }
                                                              >
                                                                  <input
                                                                      type="checkbox"
                                                                      id={
                                                                          "categories" +
                                                                          i
                                                                      }
                                                                      value={
                                                                          c.id
                                                                      }
                                                                      name="category"
                                                                      onChange={
                                                                          catValue
                                                                      }
                                                                      checked={
                                                                          isCategory
                                                                      }
                                                                  />
                                                                  {c.category}
                                                              </label>
                                                          </div>
                                                      </>
                                                  );
                                              })
                                            : ""}
                                    </div>

                                    <div className="cate-items mb-3 mt-4 flex ">
                                        <input
                                            id="cats"
                                            type="text"
                                            ref={inputRef}
                                            className="form-input px-2 py-2 border w-full rounded-md"
                                        />
                                        <div
                                            className="p-2 border cursor-pointer"
                                            onClick={AddCategory}
                                        >
                                            {adding ? "Adding.." : "Add"}
                                        </div>
                                    </div>

                                    {editpop ? (
                                        <LoaderButton
                                            disabled={processing}
                                            type="submit"
                                            className="flex w-100 btn-pink lg mx-auto"
                                            spinnerClassName="fill-red-600"
                                        >
                                            {processing
                                                ? "Updating.."
                                                : "Update Wish"}
                                        </LoaderButton>
                                    ) : (
                                        <LoaderButton
                                            disabled={processing}
                                            type="submit"
                                            className="flex w-100 btn-pink lg mx-auto"
                                            spinnerClassName="fill-red-600"
                                        >
                                            {processing
                                                ? "Processing"
                                                : "Add Wish"}
                                        </LoaderButton>
                                    )}
                                </>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Popup>
    );
}
