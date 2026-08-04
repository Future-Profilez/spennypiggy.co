import { useCallback, useEffect, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import PriceFormat from "@/includes/PriceFormat";
import ItemFormShell from "@/Components/ItemFormShell";
import RewardEditor, {
    rewardFromItem,
    rewardToPayload,
    validateReward,
} from "@/Components/Reward/RewardEditor";
import RewardPreview from "@/Components/Reward/RewardPreview";

const FIELD =
    "w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white px-4 py-3 text-base font-bold placeholder:font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_0px_rgba(255,0,127,1)]";
const FIELD_LABEL = "mb-2 block text-left text-[11px] font-black uppercase tracking-[0.14em]";

export default function EditMembership({ item }) {
    const { auth, global_currency } = usePage().props;
    const memberOnlyPostsCount = auth?.member_only_posts_count || 0;
    const { errorAlert } = useAlerts();
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
        reward: rewardFromItem(item),
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

        router.post(
            `/membership/edit/${item.uuid}`,
            {
                ...rest,
                ...rewardToPayload(reward),
                rewards: reward.perks,
                thumbnail: thumb,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLoading(false);
                    setOpen(false);
                    router.visit(
                        route("user.show", {
                            username: auth.user.username,
                            page: "memberships",
                        }),
                        { preserveState: true, preserveScroll: true },
                    );
                },
                onError: (errors) => {
                    setLoading(false);
                    errorAlert(
                        Object.values(errors || {}).flat()[0] ||
                            "Failed to update membership. Something went wrong.",
                    );
                },
            },
        );
    };

    const steps = [
        {
            key: "reward",
            title: "What they get",
            hint: "A membership has to deliver: something the moment they join, and something every month after.",
            validate: () => validateReward(data.reward, { recurring: true }),
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
                    <RewardEditor
                        value={data.reward}
                        onChange={setReward}
                        recurring
                        memberPostsCount={memberOnlyPostsCount}
                        ctxName="membership-edit-reward"
                    />
                </div>
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
                        <label htmlFor="membership-edit-price" className={FIELD_LABEL}>
                            {isLifetime ? "Lifetime price" : "Monthly price"} ({defaultCurrency})
                        </label>
                        <input
                            id="membership-edit-price"
                            type="number"
                            inputMode="decimal"
                            min="4.99"
                            max="100"
                            step="0.01"
                            className={FIELD}
                            value={data.month_price}
                            onChange={(event) => setData("month_price", event.target.value)}
                        />

                        {data.month_price > 0 && (
                            <div className="mt-4 rounded-box-sm border-[3px] border-black bg-[#BAE6FD] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
                                ctxName="edit-membership-context"
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
                </div>
            ),
        },
    ];

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="btn-pink w-full sm mt-3">
                Edit
            </button>

            <ItemFormShell
                open={open}
                onClose={() => setOpen(false)}
                title="Update membership"
                steps={steps}
                onSubmit={submit}
                processing={loading}
                submitLabel="Save changes"
                preview={() => <RewardPreview value={data.reward} recurring />}
            />
        </>
    );
}
