import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Clock, PackageOpen, ShieldCheck } from "lucide-react";
import GuestLayout from "@/Layouts/GuestLayout";
import RewardBlock from "@/Components/Reward/RewardBlock";

/**
 * A guest's own purchases, behind the signed link they were emailed.
 *
 * 🚨 The paid content renders ONLY on a settled purchase — the server has already
 * stripped it from anything else, and this component never reaches for it. The URL is
 * the credential here, so the page is noindex and sends no referrer.
 *
 * The page uses the login screen's mint background — for a supporter these two screens
 * are the same moment, and a stranger landing here should not feel sent somewhere else.
 *
 * ⚠️ NEVER `leading-<n>` in this project: tailwind.config maps numeric line-height keys to
 * PIXELS, so `leading-6` is 6px and paragraphs render on top of each other.
 */

function money(amount, currency) {
    if (amount === null || amount === undefined) return null;

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "GBP",
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency || ""} ${Number(amount).toFixed(2)}`.trim();
    }
}

function when(iso) {
    if (!iso) return null;

    try {
        return new Date(iso).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return null;
    }
}

function Avatar({ creator }) {
    const url = creator?.avatar_url;

    if (url) {
        return (
            <img
                src={url}
                alt=""
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-full border-2 border-black object-cover"
            />
        );
    }

    return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#05EFB8] text-[14px] font-bold text-black">
            {(creator?.name || creator?.username || "?").charAt(0).toUpperCase()}
        </span>
    );
}

export default function PurchaseResults() {
    const { email, purchases } = usePage().props;
    const rows = purchases || [];

    return (
        <GuestLayout className="bg-[#A2E4B8]">
            <Head title="My purchases">
                <meta name="robots" content="noindex, nofollow, noarchive" />
                <meta name="referrer" content="no-referrer" />
            </Head>

            <div className="mx-auto w-full max-w-[640px] px-4 pb-24 pt-28">
                <header>
                    <h1 className="font-gulfs text-[32px] uppercase leading-[1.05] tracking-tight text-black sm:text-[40px]">
                        Your purchases
                    </h1>
                    <p className="mt-2 text-[14px] leading-[1.5] text-gray-800">
                        Everything bought with{" "}
                        {/* A long address must wrap rather than push the page sideways. */}
                        <span className="break-all font-bold text-black">
                            {email}
                        </span>
                    </p>
                    {rows.length > 0 && (
                        <p className="mt-1 text-[14px] text-gray-700">
                            {rows.length} {rows.length === 1 ? "purchase" : "purchases"}
                        </p>
                    )}
                </header>

                {rows.length === 0 && (
                    <div className="mt-7 rounded-box border-[3px] border-black bg-white p-8 text-center">
 <PackageOpen size={30} className="mx-auto text-black/60" />
                        <h2 className="mt-3 font-gulfs text-[22px] uppercase leading-[1.1] text-black">
                            Nothing here yet
                        </h2>
 <p className="mt-2 text-[14px] leading-[1.5] text-black/60">
                            We could not find purchases for this address. If you
                            used a different email at checkout, try that one.
                        </p>
                        <Link
                            href={route("guest-purchases.form")}
 className="mt-5 inline-flex min-h-[48px] items-center rounded-box-sm border-[3px] border-black px-5 text-[15px] font-bold text-black transition-colors duration-200 hover:bg-black/[0.04]"
                        >
                            Try another email
                        </Link>
                    </div>
                )}

                <div className="mt-7 space-y-6">
                    {rows.map((row) => (
                        <article
                            key={row.key}
                            className="rounded-box border-[3px] border-black bg-white p-5 sm:p-6"
                        >
                            <div className="flex flex-wrap items-center gap-2">
 <span className="rounded-box-sm border-2 border-black bg-[#E6EA7B] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-black">
                                    {row.type_label}
                                </span>
                                {when(row.purchased_at) && (
 <span className="text-[13px] text-black/60">
                                        {when(row.purchased_at)}
                                    </span>
                                )}
                            </div>

                            <h2 className="mt-3 text-[22px] font-bold leading-[1.2] tracking-tight text-black">
                                {row.title}
                            </h2>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
                                {row.creator ? (
                                    <Link
                                        href={`/${row.creator.username}`}
                                        className="flex min-h-[44px] items-center gap-2.5"
                                    >
                                        <Avatar creator={row.creator} />
                                        <span className="min-w-0">
                                            <span className="block truncate text-[14px] font-bold text-black">
                                                {row.creator.name || row.creator.username}
                                            </span>
                                            <span className="block truncate text-[13px] text-[#FF007F]">
                                                @{row.creator.username}
                                            </span>
                                        </span>
                                    </Link>
                                ) : (
                                    <span />
                                )}

                                {money(row.amount, row.currency) && (
                                    <span className="text-[20px] font-bold tabular-nums tracking-tight text-black">
                                        {money(row.amount, row.currency)}
                                    </span>
                                )}
                            </div>

                            {/*
                                "Your bank is still confirming" and "this did not go
                                through" are different findings with different fixes,
                                and only one of them is the supporter's problem. The
                                server keeps them apart; so does this.
                            */}
                            {row.awaiting_settlement && !row.item_missing && (
                                <p className="mt-4 flex items-start gap-2 rounded-box-sm border-2 border-amber-400 bg-amber-50 px-3 py-2.5 text-[13px] font-medium leading-[1.45] text-amber-800">
                                    <Clock size={15} className="mt-0.5 shrink-0" />
                                    <span>
                                        Your bank is still confirming this payment.
                                        Your content unlocks here as soon as it
                                        clears — usually 1–2 days.
                                    </span>
                                </p>
                            )}

                            {/*
                                ⚠️ THREE states, not two. RewardBlock's `locked` copy
                                promises the content "unlocks as soon as your bank
                                confirms" — true while a debit is clearing, and a plain
                                lie on a refunded or failed payment, where nothing will
                                ever unlock. So the block is shown settled or awaiting,
                                and a terminal payment gets a note instead of a promise.

                                `locked` only changes what RewardBlock draws; the server
                                has already stripped the content from anything unsettled,
                                so this is never the thing holding it back.
                            */}
                            {row.reward && !row.item_missing && (row.settled || row.awaiting_settlement) && (
                                <div className="mt-4">
                                    <RewardBlock
                                        reward={row.reward}
                                        locked={!row.settled}
 className=""
                                    />
                                </div>
                            )}

                            {/*
                                The listing this paid for no longer exists. The purchase
                                is still shown — hiding money someone spent is the worst
                                answer this page could give — but there is no title, no
                                creator and no content, so it says that instead of
                                rendering an empty card the reader has to interpret.
                            */}
                            {row.item_missing && (
 <p className="mt-4 rounded-box-sm border-2 border-gray-300 bg-gray-50 px-3 py-2.5 text-[13px] font-medium leading-[1.45] text-black/80">
                                    {/*
                                        ⚠️ This REPLACES the awaiting-settlement note
                                        rather than sitting beside it. Together they read
                                        "your content unlocks here soon" and "there is
                                        nothing left to collect" on the same card — two
                                        promises that contradict each other.
                                    */}
                                    The creator has removed this listing, so there is
                                    nothing left to collect here.
                                    {row.awaiting_settlement
                                        ? " Your bank was still confirming this payment when it was taken down — reply to your receipt email and we will check it for you."
                                        : " Your receipt email still has the details."}
                                </p>
                            )}

                            {!row.item_missing && !row.settled && !row.awaiting_settlement && (
 <p className="mt-4 rounded-box-sm border-2 border-gray-300 bg-gray-50 px-3 py-2.5 text-[13px] font-medium leading-[1.45] text-black/80">
                                    This payment did not complete, so there is no
                                    content to collect. If you were charged, reply to
                                    your receipt email and we will look into it.
                                </p>
                            )}
                        </article>
                    ))}
                </div>

                {rows.length > 0 && (
                    <p className="mt-8 flex items-start justify-center gap-2 text-center text-[13px] leading-[1.5] text-gray-700">
                        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                        <span>
                            Keep this link private — anyone who opens it can see
                            these purchases.
                        </span>
                    </p>
                )}
            </div>
        </GuestLayout>
    );
}
