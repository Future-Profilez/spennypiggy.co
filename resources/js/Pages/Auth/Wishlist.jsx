import InputError from "@/Components/InputError";
import LoaderButton from "@/Components/LoaderButton";
import { Link, useForm } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Accordion from "react-bootstrap/Accordion";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import Popup from "@/Components/Popup";
import { router } from "@inertiajs/react";

export default function Wishlist(props) {
    const { categories, auth } = props;
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const inputRef = useRef(null);
    const [cats, setCats] = useState([]);


    const [adding, setAdding] = useState(false);
    const AddCategory = async () => {
        const value = inputRef.current.value;
        setAdding(true);
        router.post(
            "save-category",
            { category: value },
            {
                preserveScroll: true,
                onSuccess: (resp) => {
                    console.table("resp", resp);
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
                }
            }
        );
    };

    const [clear, setClear] = useState();
    const [close, setClose] = useState();
    const [repeat, setRepeat] = useState(false);
    const [thumbnail, setThumbnail] = useState("");

    const { data, setData, post, processing, errors, reset } = useForm({
        wishname: "",
        price: "",
        item_url: null,
        thumbnail: "",
        subscription: 0,
        subscription_period: "daily",
        repeat_purchase: 0,
        category: [],
    });

    const setSubs = (e) => {
        setData("subscription", e);
        setRepeat(false);
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
    };

    useEffect(() => {
        setData("category", checkboxes);
    }, [checkboxes]);

    useEffect(() => {
        setData("thumbnail", thumbnail);
        ("");
    }, [thumbnail]);

    const createWishList = (e) => {
        // if (!thumbnail) {
        //     toast.error("Please select a thumbnail for wish list item");
        //     return false;
        // }
        e.preventDefault();
        post(route("save_wish_item"), {
            preserveScroll: true,
            onSuccess: (resp) => {
                reset();
                successAlert(resp.props.flash?.success || "Added");
                setClose(false);
                setClear(new Date());
                setTimeout(() => {
                    setClose();
                }, 100);
            },
            onError: (_err) => {
                console.error(_err);
                errorsHandling(_err);
                errorAlert(resp.props.flash?.success || "Added");
            },
        });
    };

    return (
        <div>
            <Popup
                action={close}
                classes="btn-pink lg px-4"
                text="add wishlist" >
                <div className="editprofileModal  wishlistModal ">
                    <div className="editprofileModalInner innermodel shadow-pink">
                        <h2 className="font-GillSans pt-4 px-3">Add A Wish</h2>
                        <Tabs
                            defaultActiveKey="1"
                            id="uncontrolled-tab-example"
                            className="mb-3" >
                            <Tab eventKey="1" title="Custom">
                                <div className="wishinfo">
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
                                                    placeholder="eg. 50"
                                                    value={data.price}
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
                                                    value={data.item_url}
                                                    className="form-input px-2 py-2 border w-full rounded-md"
                                                    autoComplete="item_url"
                                                    onChange={(e) =>
                                                        setData(
                                                            "item_url",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </li>
                                            <li className="mb-4">
                                                <label className="mb-2 text-start d-block">
                                                    Choose Image or Upload
                                                </label>

                                                <div className="default-wish-img mb-1">
                                                    <img
                                                        src={uploadedimg}
                                                        className="img-fluid"
                                                    />
                                                </div>

                                                <GlobalUploader
                                                    clear={clear}
                                                    sendFile={getFileUID}
                                                    options={
                                                        st.wishitemUploader
                                                    }
                                                />
                                            </li>
                                        </ul>

                                        <div className="wishlistAccordian mt-3">
                                            <Accordion defaultActiveKey="0">
                                                <Accordion.Item eventKey="0">
                                                    <Accordion.Header
                                                        onClick={(e) =>setSubs(0)}>
                                                        <span className="activedote"></span>{" "}
                                                        Single Wish
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        <div className="singlewishbox">
                                                            <div className="repeatpurchase text-start">
                                                                <label for="allow">
                                                                    <input
                                                                        checked={
                                                                            repeat
                                                                        }
                                                                        type="checkbox"
                                                                        id="allow"
                                                                        name="repeat_purchase"
                                                                        onChange={
                                                                            rpValue
                                                                        }
                                                                    />{" "}
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
                                                <Accordion.Item eventKey="1">
                                                    <Accordion.Header
                                                        onClick={(e) =>
                                                            setSubs(1)
                                                        }
                                                    >
                                                        <span className="activedote"></span>{" "}
                                                        Subscription
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        <div className="singlewishbox">
                                                            <div className="repeatpurchase text-start">
                                                                <label for="allow">
                                                                    <input
                                                                        checked={
                                                                            repeat
                                                                        }
                                                                        type="checkbox"
                                                                        id="allow"
                                                                        name="repeat_purchase"
                                                                        onChange={
                                                                            rpValue
                                                                        }
                                                                    />{" "}
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

                                                        <div className="singlewishbox  mt-4  rounded ">
                                                            <strong className="mb-2 text-start d-block ">
                                                                Allows gifter to
                                                                purchase this
                                                                item on a
                                                                recurring basis.
                                                            </strong>
                                                            <div className="repeatpurchase text-start">
                                                                <label for="daily">
                                                                    <input
                                                                        checked={
                                                                            data.subscription_period ==
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
                                                                <label for="weekly">
                                                                    <input
                                                                        checked={
                                                                            data.subscription_period ==
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
                                                                <label for="monthly">
                                                                    <input
                                                                        checked={
                                                                            data.subscription_period ==
                                                                            "monthly"
                                                                        }
                                                                        type="radio"
                                                                        id="monthly"
                                                                        value={
                                                                            "monthly"
                                                                        }
                                                                        name="subscription_period"
                                                                        onChange={
                                                                            spValue
                                                                        }
                                                                    />{" "}
                                                                    Monthly
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                                <Accordion.Item eventKey="2">
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
                                                                        for={"categories" + i}>
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

                                            {/* <button type='submit' className="editProfile flex w-12 max-w-xs mx-auto">{processing ? "Proccessing" : " Add Wish"}</button> */}

                                            <LoaderButton
                                                disabled={processing}
                                                type="submit"
                                                className="flex w-100 btn-pink lg mx-auto"
                                                spinnerClassName="fill-red-600"
                                            >
                                                {processing
                                                    ? "Proccessing"
                                                    : "Add Wish"}
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
        </div>
    );
}
