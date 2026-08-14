import { useCallback, useEffect, useRef, useState } from "react";
import { useAlerts } from "@/Components/Alerts";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import axios from "axios";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { FaHouseChimneyUser } from "react-icons/fa6";
import PriceFormat from "@/includes/PriceFormat";
import { router, usePage } from "@inertiajs/react";
import ItemFormShell from "@/Components/ItemFormShell";
import RewardEditor, {
    emptyReward,
    rewardFromItem,
    rewardToPayload,
    validateReward,
} from "@/Components/Reward/RewardEditor";
import RewardPreview from "@/Components/Reward/RewardPreview";

const FIELD =
 "w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white px-4 py-3 text-base font-bold placeholder:font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-0 ";
const FIELD_LABEL = "mb-2 block text-left text-[12px] font-black uppercase tracking-[0.14em]";

const TIERS = [
    { value: "bronze", title: "Bronze Level", icon: "🥉", bg: "bg-[#FFE4B5]", blurb: "A great starting point for your casual fans." },
    { value: "silver", title: "Silver Level", icon: "🥈", bg: "bg-[#E2E8F0]", blurb: "Step it up with more exclusive perks." },
    { value: "gold", title: "Gold Level", icon: "🥇", bg: "bg-[#FEF08A]", blurb: "Premium access for your loyal supporters." },
    { value: "platinum", title: "Platinum Level", icon: "💎", bg: "bg-[#E9D5FF]", blurb: "The ultimate VIP experience." },
    { value: "lifetime", title: "Lifetime", icon: "👑", bg: "bg-[#FBCFE8]", blurb: "One-time payment for endless access." },
];

export default function AddMembership({ item, text, classes }) {
    const { auth, global_currency } = usePage().props;
    const memberOnlyPostsCount = auth?.member_only_posts_count || 0;
    const { successAlert, errorAlert } = useAlerts();
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const defaultCurrency = auth?.user?.default_currency || "USD";

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [thumb, setThumb] = useState(null);
    const [isEditable, setIsEditable] = useState(false);
    const uploaderRef = useRef();

    const [data, setDataState] = useState(() => ({
        level: item?.level || "",
        month_price: item?.price || "",
        reward: item ? rewardFromItem(item) : emptyReward(),
    }));

    const setData = useCallback(
        (key, value) => setDataState((current) => ({ ...current, [key]: value })),
        [],
    );

    const setReward = useCallback((next) => setData("reward", next), [setData]);

    useEffect(() => {
        if (!item) return;
        setDataState({
            level: item.level || "",
            month_price: item.price || "",
            reward: rewardFromItem(item),
        });
    }, [item]);

    const isLifetime = data.level === "lifetime";

    const submit = () => {
        if (loading) return;

        const rewardProblem = validateReward(data.reward, { recurring: true });
        if (rewardProblem) {
            errorAlert(rewardProblem);
            return;
        }

        setLoading(true);
        const { reward, ...rest } = data;

        axios
            .post(`/membership/save`, {
                ...rest,
                ...rewardToPayload(reward),
                rewards: reward.perks,
                thumbnail: thumb,
            })
            .then((resp) => {
                if (resp.data.status) {
                    successAlert(resp.data.msg);
                    setOpen(false);
                    window.dispatchEvent(new Event("closeAddOptions"));
                    uploaderRef.current?.reset?.();
                    router.visit(
                        route("user.show", {
                            username: auth?.user?.username,
                            page: "memberships",
                        }),
                        { preserveState: true, preserveScroll: true },
                    );
                } else if (resp.data.errors) {
                    errorAlert(Object.values(resp.data.errors).flat()[0]);
                } else {
                    errorAlert(resp.data.msg);
                }
                setLoading(false);
            })
            .catch((err) => {
                errorAlert(err?.response?.data?.msg || "Something went wrong.");
                setLoading(false);
            });
    };

    const steps = [
        {
            key: "tier",
            title: "Choose a tier",
            hint: "Pick the tier that fits this offering. You can run several side by side.",
            validate: () => (data.level ? null : "Choose a membership level."),
            render: () => (
                <div className="flex flex-col gap-3">
                    {TIERS.map((tier) => {
                        const selected = data.level === tier.value;
                        return (
                            <button
                                key={tier.value}
                                type="button"
                                onClick={() => setData("level", tier.value)}
                                aria-pressed={selected}
                                className={`flex items-center gap-4 rounded-box border-[3px] p-3 text-left transition-all ${
                                    selected
 ? `translate-y-[2px] border-[#FF007F] ${tier.bg}`
 : "border-black bg-white "
                                }`}
                            >
                                <span
 className={`grid h-[50px] w-[50px] shrink-0 place-items-center rounded-box-sm border-2 border-black text-2xl ${
                                        selected ? "bg-white" : tier.bg
                                    }`}
                                >
                                    {tier.icon}
                                </span>
                                <span className="flex flex-col">
                                    <span
                                        className={`text-lg font-black uppercase leading-tight ${
                                            selected ? "text-[#FF007F]" : "text-black"
                                        }`}
                                    >
                                        {tier.title}
                                    </span>
                                    <span className="text-sm font-medium text-neutral-600">
                                        {tier.blurb}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            ),
        },
        {
            key: "reward",
            title: "What they get",
            hint: "A membership has to deliver: something the moment they join, and something every month after.",
            validate: () => validateReward(data.reward, { recurring: true }),
            render: () => (
                <RewardEditor
                    value={data.reward}
                    onChange={setReward}
                    recurring
                    memberPostsCount={memberOnlyPostsCount}
                    ctxName="membership-reward"
                />
            ),
        },
        {
            key: "price",
            title: "Price & thumbnail",
            hint: "Supporters see one total price; every fee is already inside it.",
            validate: () => {
                const price = Number(data.month_price);
                if (!price) return "Set a price.";
                if (price < 4.99) return `Minimum is ${defaultCurrency} 4.99.`;
                if (price > 100) return `Maximum is ${defaultCurrency} 100 per month.`;
                return null;
            },
            render: () => (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="membership-price" className={FIELD_LABEL}>
                            {isLifetime ? "Lifetime price" : "Monthly price"} ({defaultCurrency}){" "}
                            <span className="text-[#FF007F]">*</span>
                        </label>
                        <input
                            id="membership-price"
                            type="number"
                            inputMode="decimal"
                            min="4.99"
                            max="100"
                            step="0.01"
                            className={FIELD}
                            placeholder={isLifetime ? "Lifetime price" : "Monthly price"}
                            value={data.month_price}
                            onChange={(event) => setData("month_price", event.target.value)}
                        />

                        {data.month_price > 0 && (
 <div className="mt-4 rounded-box-sm border-[3px] border-black bg-[#BAE6FD] p-4 ">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-neutral-700">
                                        Supporters pay
                                    </span>
                                    <span className="font-black">
                                        {new Intl.NumberFormat("en-GB", {
                                            style: "currency",
                                            currency: defaultCurrency,
                                        }).format(
                                            calculateTotalSupporterPays(
                                                data.month_price,
                                                defaultCurrency,
                                                0,
                                                auth?.user?.id,
                                            ).total_supporter_pays,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-neutral-700">
                                        You receive
                                    </span>
                                    <span className="font-black text-green-700">
                                        {new Intl.NumberFormat("en-GB", {
                                            style: "currency",
                                            currency: defaultCurrency,
                                        }).format(data.month_price)}
                                    </span>
                                </div>
                                <p className="mt-3 text-left text-xs font-medium text-neutral-600">
                                    All fees are inside the supporter price, so you always receive your
                                    listed amount.
                                </p>
                            </div>
                        )}

                        {defaultCurrency !== global_currency && data.month_price > 0 && (
                            <p className="mt-2 text-left text-sm font-medium text-neutral-500">
                                ≈ {formatMultiPrice(data.month_price, defaultCurrency)} (
                                {global_currency})
                            </p>
                        )}
                    </div>

                    <div>
                        <span className={FIELD_LABEL}>
                            Thumbnail <span className="text-neutral-400">(optional)</span>
                        </span>
                        <div className={isEditable ? "hidden" : "editable"}>
                            <GlobalUploader
                                type="minimal"
                                ref={uploaderRef}
                                ctxName="add-membership-context"
                                sendFile={(file) => {
                                    setThumb(file?.uuid || "");
                                    setIsEditable(true);
                                }}
                                options={st.membership}
                            />
                        </div>
                        <div className={isEditable ? "editable" : "hidden"}>
                            <UploadcareEditor
                                setIsEditable={setIsEditable}
                                uuid={thumb}
                                updateFile={(edited, uuid) => {
                                    setIsEditable(false);
                                    setThumb(`${uuid}/${edited.cdnUrlModifiers}-/preview/`);
                                }}
                            />
                        </div>
                    </div>

                    {!item && memberOnlyPostsCount === 0 && (
                        <p className="rounded-box-sm border-[3px] border-black bg-[#FFE0EC] p-4 text-left text-sm font-bold">
                            You haven't added any member-only posts yet. Create at least one before
                            selling a membership.
                        </p>
                    )}
                </div>
            ),
        },
    ];

    const canSubmit = !!item || memberOnlyPostsCount > 0;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={
                    classes ||
                    "addop w-full font-bold bg-white rounded-box p-3 mb-2 text-center"
                }
            >
                {text || <AddItemTrigger />}
            </button>

            <ItemFormShell
                open={open}
                onClose={() => setOpen(false)}
                title={item ? "Update membership" : "Add membership"}
                steps={steps}
                onSubmit={canSubmit ? submit : undefined}
                processing={loading}
                submitLabel={item ? "Update membership" : "Create membership"}
                error={
                    canSubmit
                        ? null
                        : "Add at least one member-only post before selling a membership."
                }
                preview={() => <RewardPreview value={data.reward} recurring />}
            />
        </>
    );
}

function AddItemTrigger() {
    return (
        <span className="flex w-full items-center">
 <span className="flex h-[44px] min-h-[44px] w-[44px] min-w-[44px] items-center justify-center rounded-box-sm border-2 border-black bg-pink-100 p-1 md:h-[52px] md:min-h-[52px] md:w-[52px] md:min-w-[52px]">
                <FaHouseChimneyUser color="var(--pink)" size="1.5rem" />
            </span>
            <span className="pl-3 text-left">
                <span className="block font-GillSans text-sm font-normal uppercase leading-tight md:text-lg">
                    Membership
                </span>
                <span className="block font-poppins text-sm">
                    Give fans monthly access to your exclusive posts.
                </span>
            </span>
        </span>
    );
}
