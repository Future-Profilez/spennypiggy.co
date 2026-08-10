import st from "../../../css/uploader.module.css";
import { router, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import { useCallback, useEffect, useRef, useState } from "react";
import GlobalUploader from "@/uploadcare/Uploader";
import { Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import PriceFormat from "@/includes/PriceFormat";
import axios from "axios";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { SlCalender } from "react-icons/sl";
import ItemFormShell from "@/Components/ItemFormShell";
import RewardEditor, {
    emptyReward,
    rewardFromItem,
    rewardToPayload,
    validateReward,
} from "@/Components/Reward/RewardEditor";
import RewardPreview from "@/Components/Reward/RewardPreview";

const FIELD =
    "w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white px-4 py-3 text-base font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_0px_rgba(255,0,127,1)]";
const FIELD_LABEL = "mb-2 block text-left text-[11px] font-black uppercase tracking-[0.14em]";

const PERIODS = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
];

const BillsImages = [
    "901c0a0e-e5de-4d7a-8ac3-de11a4632542",
    "6d5506b2-7361-4c58-8f1b-dfe1e196885a",
    "467f7ad0-e397-45fe-be22-a6e8e8afe9fa",
    "897b3ec3-63f8-42c0-83b3-a3a9a1b90b7c",
    "55965522-e075-4ef3-8afc-195dacbf267b",
    "bcd5dc1e-a97f-4f76-aa93-511c997ff2f0",
    "7490cf45-09a0-427d-abb7-568d98edf344",
    "59cf9a4a-6a4d-4297-915d-513847681f29",
];

export default function AddBills(props) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { global_currency, auth } = usePage().props;
    const subscriberOnlyPostsCount = auth?.subscriber_only_posts_count || 0;
    const { item, isEdit, editpop, text, classes, fetchBills, hidetrigger, openPop } =
        props;
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const defaultCurrency = auth?.user?.default_currency || "USD";

    const [open, setOpen] = useState(false);

    /* `openPop` lets a caller drive the sheet without rendering the trigger
       button (see `hidetrigger`). Only a literal true opens it — the caller
       clears the flag back to undefined so the NEXT click opens it again. */
    useEffect(() => {
        if (openPop === true) setOpen(true);
    }, [openPop]);

    const [loading, setLoading] = useState(false);
    // The form posts via axios, so Inertia's `errors` bag never fills — server
    // field errors are kept locally to render inline.
    const [fieldErrors, setFieldErrors] = useState({});
    const [thumbnail, setThumbnail] = useState("");
    const [isEditable, setIsEditable] = useState(false);
    const uploaderRef = useRef();

    const [data, setDataState] = useState(() => ({
        name: item?.name || "",
        goal_label: item?.goal_label || "",
        price: item?.price || "",
        thumbnail: item?.thumbnail || BillsImages[0],
        period: item?.period || "weekly",
        reward: rewardFromItem(item),
    }));

    const setData = useCallback(
        (key, value) => setDataState((current) => ({ ...current, [key]: value })),
        [],
    );

    const setReward = useCallback((next) => setData("reward", next), [setData]);

    useEffect(() => {
        if (thumbnail) setData("thumbnail", thumbnail);
    }, [setData, thumbnail]);

    const fieldError = (field) => {
        const error = fieldErrors[field];
        return Array.isArray(error) ? error[0] : error;
    };

    const resetForm = () => {
        setDataState({
            name: item?.name || "",
            goal_label: item?.goal_label || "",
            price: item?.price || "",
            thumbnail: item?.thumbnail || BillsImages[0],
            period: item?.period || "weekly",
            reward: rewardFromItem(item),
        });
        setFieldErrors({});
        uploaderRef.current?.reset?.();
    };

    const closeSheet = () => {
        setOpen(false);
        resetForm();
    };

    const submit = () => {
        if (loading) return;

        const rewardProblem = validateReward(data.reward);
        if (rewardProblem) {
            errorAlert(rewardProblem);
            return;
        }

        setLoading(true);
        setFieldErrors({});

        const { reward, ...rest } = data;
        const payload = { ...rest, ...rewardToPayload(reward) };

        axios
            .post(isEdit ? `/bill/edit/${item.uuid}` : `/bill/save`, payload)
            .then((resp) => {
                fetchBills && fetchBills();
                if (resp.data.status) {
                    router.visit(
                        route("user.show", {
                            username: auth.user.username,
                            page: "bills",
                        }),
                        { preserveState: true, preserveScroll: true },
                    );
                    successAlert(resp.data.msg);
                    setOpen(false);
                    window.dispatchEvent(new Event("closeAddOptions"));
                    resetForm();
                } else {
                    setFieldErrors(resp.data.errors || {});
                    errorAlert(resp.data.msg);
                }
                setLoading(false);
            })
            .catch((err) => {
                setFieldErrors(err?.response?.data?.errors || {});
                setLoading(false);
                errorsHandling(err);
            });
    };

    const steps = [
        {
            key: "content",
            title: "Your subscription",
            hint: "Name the content supporters unlock every period, and give it an image.",
            validate: () => (data.name.trim() ? null : "Name your recurring content."),
            render: () => (
                <div className="space-y-6">
                    {item?.is_suspended == 1 && (
                        <div className="rounded-box-sm border-[3px] border-black bg-[#FFE0EC] p-4 text-left">
                            <p className="text-sm font-black uppercase tracking-wide">Item suspended</p>
                            {item.suspend_reason && (
                                <p className="mt-1 text-sm font-medium">{item.suspend_reason}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="bill-name" className={FIELD_LABEL}>
                            Subscription / content name <span className="text-[#FF007F]">*</span>
                        </label>
                        <input
                            id="bill-name"
                            type="text"
                            className={FIELD}
                            placeholder="Eg. Weekly behind-the-scenes"
                            value={data.name}
                            onChange={(event) => setData("name", event.target.value)}
                        />
                        {fieldError("name") && (
                            <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                                {fieldError("name")}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="bill-goal" className={FIELD_LABEL}>
                            Goal <span className="text-neutral-400">(optional)</span>
                        </label>
                        <input
                            id="bill-goal"
                            type="text"
                            maxLength={60}
                            className={FIELD}
                            placeholder="Eg. Studio upgrade"
                            value={data.goal_label}
                            onChange={(event) => setData("goal_label", event.target.value)}
                        />
                        <p className="mt-2 text-left text-xs font-medium text-neutral-500">
                            Context only — never what the supporter buys. Don't name a bill, debt or
                            expense.
                        </p>
                        {fieldError("goal_label") && (
                            <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                                {fieldError("goal_label")}
                            </p>
                        )}
                    </div>

                    <div>
                        <span className={FIELD_LABEL}>Cover image</span>
                        {item?.perma_link ? (
                            <div className="overflow-hidden rounded-box-sm border-[3px] border-black">
                                <img
                                    src={item.perma_link}
                                    alt={item?.name || "Subscription image"}
                                    className="h-auto w-full"
                                />
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-box-sm border-[3px] border-black">
                                <Swiper
                                    spaceBetween={0}
                                    pagination={{ clickable: true }}
                                    navigation={true}
                                    onSlideChange={(swiper) =>
                                        setData("thumbnail", BillsImages[swiper?.activeIndex || 0])
                                    }
                                    modules={[Pagination, Navigation]}
                                    slidesPerView={1}
                                >
                                    {BillsImages.map((image) => (
                                        <SwiperSlide key={`swiper-item-${image}`}>
                                            <img
                                                src={`https://ucarecdn.com/${image}/`}
                                                alt=""
                                                className="h-auto w-full"
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        )}

                        <p className="my-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-neutral-400">
                            or upload your own
                        </p>

                        <div className={isEditable ? "d-none" : "editable"}>
                            <GlobalUploader
                                ctxName="add-bills-context"
                                type="minimal"
                                ref={uploaderRef}
                                sendFile={(file) => {
                                    setThumbnail(file?.uuid);
                                    setIsEditable(true);
                                }}
                                options={st.wishitemUploader}
                            />
                        </div>

                        <div className={isEditable ? "editable" : "d-none"}>
                            <UploadcareEditor
                                uuid={thumbnail}
                                updateFile={(edited, uuid) => {
                                    setThumbnail(`${uuid}/${edited.cdnUrlModifiers}-/preview/`);
                                    setIsEditable(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "reward",
            title: "What they get",
            hint: "One recurring content stream: something the moment they subscribe, then your subscriber-only posts.",
            validate: () => validateReward(data.reward),
            render: () => (
                <RewardEditor
                    value={data.reward}
                    onChange={setReward}
                    recurring
                    // A Bill is not a tier — it sells one content stream, so it
                    // has no perks bundle. That is the whole difference from a
                    // Membership; giving it perks made the two products
                    // indistinguishable.
                    showPerks={false}
                    postAccessLabel="Subscriber-only posts"
                    memberPostsCount={subscriberOnlyPostsCount}
                    ctxName="bill-reward"
                    errors={{
                        reward_title: fieldError("reward_title"),
                        reward_body: fieldError("reward_body"),
                    }}
                />
            ),
        },
        {
            key: "price",
            title: "Price & billing",
            hint: "Supporters see one total price; every fee is already inside it.",
            validate: () => {
                const price = Number(data.price);
                if (!price) return "Set a price.";
                if (price < 4.99) return `Minimum is ${defaultCurrency} 4.99 per period.`;
                if (price > 100) return `Maximum is ${defaultCurrency} 100 per period.`;
                return null;
            },
            render: () => (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="bill-price" className={FIELD_LABEL}>
                            Price ({defaultCurrency}) <span className="text-[#FF007F]">*</span>
                        </label>
                        <input
                            id="bill-price"
                            type="number"
                            inputMode="decimal"
                            min="4.99"
                            max="100"
                            step="0.01"
                            className={FIELD}
                            placeholder="Eg. 50"
                            value={data.price}
                            onChange={(event) => setData("price", event.target.value)}
                        />
                        <p className="mt-2 text-left text-xs font-medium text-neutral-500">
                            Between {defaultCurrency} 4.99 and {defaultCurrency} 100 per period.
                        </p>
                        {fieldError("price") && (
                            <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                                {fieldError("price")}
                            </p>
                        )}

                        {data.price > 0 && (
                            <div className="mt-4 rounded-box-sm border-[3px] border-black bg-[#F7F7F7] p-4">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-neutral-600">
                                        Supporters pay
                                    </span>
                                    <span className="font-black">
                                        {new Intl.NumberFormat("en-GB", {
                                            style: "currency",
                                            currency: defaultCurrency,
                                        }).format(
                                            calculateTotalSupporterPays(data.price, defaultCurrency, 0, auth?.user?.id)
                                                .total_supporter_pays,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-neutral-600">
                                        You receive
                                    </span>
                                    <span className="font-black text-green-600">
                                        {new Intl.NumberFormat("en-GB", {
                                            style: "currency",
                                            currency: defaultCurrency,
                                        }).format(data.price)}
                                    </span>
                                </div>
                                <p className="mt-3 text-left text-xs font-medium text-neutral-500">
                                    All platform and processing fees are inside the supporter price, so
                                    you always receive your listed amount.
                                </p>
                            </div>
                        )}

                        {defaultCurrency !== global_currency && data.price > 0 && (
                            <p className="mt-2 text-left text-sm font-medium text-neutral-500">
                                ≈ {formatMultiPrice(data.price, defaultCurrency)} ({global_currency})
                            </p>
                        )}
                    </div>

                    <div>
                        <span className={FIELD_LABEL}>Billed every</span>
                        <div className="grid grid-cols-3 gap-2">
                            {PERIODS.map((period) => {
                                const active = data.period === period.value;
                                return (
                                    <button
                                        key={period.value}
                                        type="button"
                                        onClick={() => setData("period", period.value)}
                                        aria-pressed={active}
                                        className={`min-h-[48px] rounded-box-sm border-[3px] border-black text-sm font-black uppercase tracking-wide transition-all ${
                                            active
                                                ? "translate-x-[2px] translate-y-[2px] bg-[#A2E4B8] shadow-none"
                                                : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        }`}
                                    >
                                        {period.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <p className="rounded-box-sm border-[3px] border-black bg-[#FFF6D6] p-4 text-left text-xs font-medium">
                        Describe the recurring content supporters receive. Do not list bills, personal
                        expenses, or brand names — these are rejected. Adult content is blocked
                        automatically and overly suggestive images are removed.
                    </p>

                    {!isEdit && subscriberOnlyPostsCount === 0 && (
                        <p className="rounded-box-sm border-[3px] border-black bg-[#FFE0EC] p-4 text-left text-sm font-bold">
                            You haven't added any subscriber-only posts yet. Create at least one before
                            selling a subscription.
                        </p>
                    )}
                </div>
            ),
        },
    ];

    const canSubmit = isEdit || subscriberOnlyPostsCount > 0;

    return (
        <>
            {!hidetrigger && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={
                        classes ||
                        (editpop
                            ? "editpop"
                            : "addop w-full font-bold bg-white rounded-box p-3 mb-2 text-center")
                    }
                >
                    {text || <AddItemTrigger />}
                </button>
            )}

            <ItemFormShell
                open={open}
                onClose={closeSheet}
                title={isEdit ? "Manage subscription" : "Add recurring content"}
                steps={steps}
                onSubmit={canSubmit ? submit : undefined}
                processing={loading}
                submitLabel={isEdit ? "Save changes" : "Publish subscription"}
                error={
                    canSubmit
                        ? null
                        : "Add at least one subscriber-only post before selling a subscription."
                }
                preview={() => (
                    <RewardPreview
                        value={data.reward}
                        recurring
                        showPerks={false}
                        postAccessLabel="Subscriber-only posts"
                    />
                )}
            />
        </>
    );
}

function AddItemTrigger() {
    return (
        <span className="flex items-center">
            <span className="flex h-[44px] min-h-[44px] w-[44px] min-w-[44px] items-center justify-center rounded-box-sm border-2 border-black bg-pink-100 p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:h-[52px] md:min-h-[52px] md:w-[52px] md:min-w-[52px]">
                <SlCalender color="var(--pink)" size="1.5rem" />
            </span>
            <span className="pl-3 text-left">
                <span className="block font-GillSans text-sm font-normal uppercase leading-tight md:text-lg">
                    Recurring content
                </span>
                <span className="block font-poppins text-sm">
                    Sell content your supporters unlock every week or month.
                </span>
            </span>
        </span>
    );
}
