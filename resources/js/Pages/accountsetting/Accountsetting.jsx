import { useEffect, useState, useRef } from "react";
import { lazy } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import Popup from "@/Components/Popup";
import UpdateProfileInformation from "../Profile/Partials/UpdateProfileInformationForm";
import UpdatePasswordForm from "../Profile/Partials/UpdatePasswordForm";
import DeleteUserForm from "../Profile/Partials/DeleteUserForm";
import PaymentDashboard from "../stripe/PaymentDashboard";
import ChangeCurrency from "@/Components/ChangeCurrency";
import LinkTwitter from "../twitter/LinkTwitter";
import { useAlerts } from "@/Components/Alerts";
import ChangeVat from "../account/ChangeVat";
import { QRCodeSVG } from "qrcode.react";
const EditProfile = lazy(() => import("@/Pages/account/EditProfile"));
import DeleteStripeAccount from "../Profile/DeleteStripeAccount";
import SiteSubscription from "../Profile/SiteSubscription";
import AddressForm from "../rye/AddressForm";
import FollowersBulkNotification from "@/Components/FollowersBulkNotification";
import SubscriptionHistory, { billedRecords } from "@/Components/SubscriptionHistory";
import ManagePasskey from "@/Components/ManagePasskey";
import SecurityZone from "@/Components/SecurityZone";
import { Switch } from "@headlessui/react";
import {
    UserIcon,
    CreditCardIcon,
    BellIcon,
    LogoutIcon,
    ExternalLinkIcon,
    ChevronRightIcon,
    SettingsIcon,
    DollarSignIcon,
    HeartIcon,
    DashboardIcon,
    ActivityIcon,
    MapPinIcon,
    TwitterIcon,
    UsersIcon,
    Trash2Icon,
    MailIcon,
    LockIcon,
    GlobeIcon,
    ShieldCheckIcon,
    ShoppingBagIcon,
} from "@animateicons/react/lucide";
import {
    Shield,
    LogOut,
    Gift,
    LayoutDashboard,
    History,
    Percent,
    PiggyBank,
    HelpCircle,
    FileText,
    Fingerprint,
    Trophy,
} from "lucide-react";

export default function Accountsetting(props) {
    const { successAlert, errorAlert } = useAlerts();
    const {
        auth,
        user,
        global_currency,
        auto_tweet,
        pwa_notification_details,
        webAuthnCredentials,
        site_subscription,
        subscription_history,
        subscription_status,
        monthly_charges,
    } = usePage().props;

    const contactSupport = () => {
        if (window.Intercom) {
            window.Intercom('show');
        } else {
            window.location.href = "mailto:support@spennypiggy.co";
        }
    };

    const [suggestion, setSuggestion] = useState("");
    const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
    const [suggestionClose, setSuggestionClose] = useState(null);
    
    const closeSuggestionPopup = () => {
        setSuggestionClose(false);
        setTimeout(() => {
            setSuggestionClose(null);
        }, 50);
    };

    const [emailPopupAction, setEmailPopupAction] = useState(null);
    const [emailEnabled, setSetEnabled] = useState(false);

    useEffect(() => {
        setSetEnabled(auth?.user?.notification_send == 1);
    }, [auth?.user?.notification_send]);

    const [showEarning, setShowEarning] = useState(
        auth && auth.user && auth.user.show_piggy_bank == 1 ? true : false,
    );

    const swicthEarning = () => {
        setShowEarning(!showEarning);
        axios
            .post(route("piggy-bank-setting"))
            .then((resp) => {
                successAlert(resp.data.message);
            })
            .catch((_err) => {
                console.error("error", _err);
                setShowEarning(!showEarning); // Revert on error
            });
    };

    const [passClose, setSassClose] = useState(null);
    const passwordUpdated = () => {
        setSassClose(false);
        setTimeout(() => {
            setSassClose();
        }, 100);
    };

    const updatevat = (e) => {
        setSassClose(false);
        setTimeout(() => {
            setSassClose();
        }, 100);
        setvatpercent(e);
    };

    const switchNotification = () => {
        const previousValue = emailEnabled;
        setSetEnabled(!previousValue);
        axios
            .post(route("notification-switch"))
            .then((resp) => {
                successAlert(resp.data.msg);
            })
            .catch((_err) => {
                console.error("error", _err);
                // revert back
                setSetEnabled(previousValue);
                errorAlert("Unable to update notification settings");
            });
    };

    const [vatpercent, setvatpercent] = useState(
        (auth && auth?.user?.vat_amount_percentage) || "",
    );

    const closeEmailPopup = () => {
        setEmailPopupAction(false);
        setTimeout(() => {
            setEmailPopupAction(null);
        }, 50);
    };

    function base64urlToUint8Array(base64url) {
        const base64 = base64url
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), "=");

        const binary = window.atob(base64);

        return Uint8Array.from(binary, (c) => c.charCodeAt(0));
    }

    const registerFingerprint = async () => {
        try {
            const { data } = await axios.post(
                route("webauthn.register.options"),
            );

            // Check if there's an error in response
            if (data.success === false) {
                errorAlert(
                    data.message || "Failed to initialize passkey registration",
                );
                return;
            }

            const publicKey = data.publicKey ?? data;
            publicKey.challenge = base64urlToUint8Array(publicKey.challenge);
            publicKey.user.id = base64urlToUint8Array(publicKey.user.id);

            if (publicKey.excludeCredentials?.length) {
                publicKey.excludeCredentials = publicKey.excludeCredentials.map(
                    (item) => ({
                        ...item,
                        id: base64urlToUint8Array(item.id),
                    }),
                );
            }

            const credential = await navigator.credentials.create({
                publicKey,
            });

            const response = await axios.post(
                route("webauthn.register"),
                credential,
            );

            if (response.data.success) {
                successAlert(
                    response.data.message || "Passkey enabled successfully!",
                );
                setHasPasskey(true);
                // Refresh the page to show updated status
                setTimeout(() => router.reload(), 1500);
            } else {
                errorAlert(
                    response.data.message || "Failed to register passkey",
                );
            }
        } catch (e) {
            console.error("Registration error:", e);

            if (e.response?.data?.message) {
                errorAlert(e.response.data.message);
            } else if (e.name === "InvalidStateError") {
                errorAlert("A passkey already exists for this device");
            } else if (e.name === "NotAllowedError") {
                errorAlert("Registration cancelled or device not supported");
            } else {
                errorAlert(e.message || "Failed to register passkey");
            }
        }
    };

    const deleteFingerprint = async () => {
        if (!confirm("Remove Face / Fingerprint login?")) return;

        try {
            const response = await axios.delete(route("webauthn.delete"));

            if (response.data.success) {
                successAlert("Passkey removed successfully!");
                setHasPasskey(false);
                // Refresh the page to show updated status
                setTimeout(() => router.reload(), 1500);
            } else {
                errorAlert(response.data.message || "Failed to remove passkey");
            }
        } catch (e) {
            console.error("Delete error:", e);
            errorAlert(e.response?.data?.message || "Unable to remove passkey");
        }
    };

    const [hasPasskey, setHasPasskey] = useState(webAuthnCredentials);

    const getDeviceLabel = () => {
        if (
            window.PublicKeyCredential &&
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
        ) {
            return "Face Unlock / Fingerprint / Windows Hello PIN";
        }

        return "Secure Device Login";
    };

    const SettingItem = ({
        icon: Icon,
        title,
        subtitle,
        onClick,
        action,
        isDestructive,
        value,
        className,
        bordercolor,
    }) => {
        const iconRef = useRef(null);

        return (
            <div
                onClick={onClick}
                onMouseEnter={() => iconRef.current?.startAnimation?.()}
                onMouseLeave={() => iconRef.current?.stopAnimation?.()}
                className={`relative group w-full md:flex items-center justify-between p-4 bg-gray-100 border-2 ${bordercolor || "border-[#FF007F]"}  !rounded-[30px]  hover:border-pink-200 hover:shadow-sm transition-all cursor-pointer mb-3 ${isDestructive ? "hover:bg-red-50 hover:border-red-200" : ""} ${className}`}
            >
                <div className="flex !items-center gap-4 text-left">
                    <div
                        className={`p-2.5 !rounded-[15px] md:rounded-[20px] w-[60px] h-[60px] md:w-[50px] md:h-[50px] md:min-w-[50px] md:min-h-[50px] flex items-center justify-center
                        ${isDestructive ? "bg-red-200 text-red-600" : "bg-pink-200 text-[#FF007F]"}`}
                    >
                        <Icon ref={iconRef} size={28} strokeWidth={2} />
                    </div>
                    <div>
                        <h3
                            className={`font-bold text-base ${isDestructive ? "text-red-600" : "text-gray-800"}`}
                        >
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-sm text-gray-500 font-medium mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {value && (
                        <span
                            className={`mt-4 md:mt-0 text-sm font-semibold px-3 py-1 rounded-lg border ${
                                value.toLowerCase() === "active" ||
                                value.toLowerCase() === "connected" ||
                                value.toLowerCase() === "enabled" ||
                                value.toLowerCase() === "linked"
                                    ? "text-green-600 bg-green-50 border-green-500"
                                    : "text-gray-600 bg-gray-50 border-[#FF007F]"
                            }`}
                        >
                            {" "}
                            {value}{" "}
                        </span>
                    )}
                    {action ? (
                        action
                    ) : (
                        <ChevronRightIcon
                            size={18}
                            className="text-gray-300 group-hover:text-[#FF007F] absolute md:static !text-xl top-[30px] right-4"
                        />
                    )}
                </div>
            </div>
        );
    };

    const SectionTitle = ({ title }) => (
        <h2 className="text-normal text-gray-800 mb-4 px-2 uppercase tracking-widest font-gulfs">
            {title}
        </h2>
    );

    const isCreator = auth && auth.user && auth.user.role == 1;
    const stripeSubmitted =
        auth && auth.user && auth.user.stripe_details_submitted == 1;

    return (
        <Authenticated user={user} auth={auth.user}>
            <Head title={"My Account"} />
            <div className="min-h-dvh bg-gray-200 py-6 md:py-16">
                <div className="max-w-3xl mx-auto px-6 pt-8">
                    <div className="md:text-center mb-10">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-gray-900 uppercase tracking-wide mb-2">
                            Account{" "}
                            <span className="text-[#FF007F]">Settings</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-normal">
                            Manage your profile, preferences and security
                        </p>
                    </div>

                    {/* BECOME A CREATOR */}
                    {!isCreator && (
                        <div className="mb-10 animate-fade-in-up">
                            <div 
                                onClick={contactSupport}
                                className="relative group w-full flex items-center justify-between p-6 bg-gradient-to-r from-pink-500 to-purple-600 border-2 border-black !rounded-[30px] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all cursor-pointer mb-3"
                            >
                                <div className="flex items-center gap-4 text-left text-white">
                                    <div className="p-2.5 bg-white/20 rounded-[20px] w-[50px] h-[50px] flex items-center justify-center">
                                        <Trophy size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-gulfs text-lg uppercase tracking-wide">
                                            Become a Creator
                                        </h3>
                                        <p className="text-sm text-pink-100 font-medium mt-0.5">
                                            Start selling content and memberships. Contact support to get started!
                                        </p>
                                    </div>
                                </div>
                                <ChevronRightIcon size={24} className="text-white/70 group-hover:text-white" />
                            </div>
                        </div>
                    )}

                    {/* CREATOR STUDIO SECTION */}
                    {isCreator && (
                        <div className="mb-10 animate-fade-in-up">
                            <SectionTitle title="Creator Studio" />

                            <EditProfile
                                user={auth?.user}
                                text={
                                    <SettingItem
                                        icon={UsersIcon}
                                        title="My Profile"
                                        subtitle="Manage your earnings and payouts"
                                        value={auth?.user?.name}
                                    />
                                }
                                classes="w-full"
                                global_currency={global_currency}
                            />

                            {/*
                                Everything the creator sells, in one screen. Its own
                                entry point because the six module screens do not link
                                to each other, so a creator has no way to discover a
                                whole-catalogue view from any of them.
                            */}
                            <SettingItem
                                icon={ShoppingBagIcon}
                                title="My Listings"
                                subtitle="Every wish, shop item, pot and subscription in one place"
                                onClick={() => router.visit(route("catalogue.index"))}
                            />

                            <SettingItem
                                icon={ExternalLinkIcon}
                                title="Copy Profile Link"
                                subtitle="Copy your public profile URL to share"
                                onClick={() => {
                                    const url = `${window.location.origin}/${auth.user.username}`;
                                    navigator.clipboard.writeText(url)
                                        .then(() => successAlert("Profile link copied to clipboard!"))
                                        .catch(() => errorAlert("Failed to copy profile link"));
                                }}
                            />

                            {stripeSubmitted && (
                                <PaymentDashboard
                                    classes="w-full"
                                    trigger={
                                        <SettingItem
                                            icon={LayoutDashboard}
                                            title="Payment Dashboard"
                                            subtitle="Manage your earnings and payouts"
                                            value="Linked"
                                        />
                                    }
                                />
                            )}

                            <Popup
                                space="4"
                                size="lg"
                                modalclass="pinkmodal"
                                classes="w-full"
                                text={
                                    <SettingItem
                                        icon={Gift}
                                        title="Platform Subscription"
                                        subtitle={
                                            // ⚠️ Code 2 is "card saved, nothing
                                            // charged" — calling that "Active
                                            // Subscription" next to a "No Charge
                                            // Yet" chip made the row contradict
                                            // itself. Each code says its own thing.
                                            {
                                                1: "Billing monthly",
                                                2: "Card saved — no charge yet",
                                                // ⚠️ 0 covers an abandoned checkout
                                                // (`initiated`) as well as expired
                                                // and failed, so the wording has to
                                                // work for someone who never
                                                // finished rather than accusing them
                                                // of a problem.
                                                0: "Not active — add your card",
                                                // ⚠️ 3 = no MonthlyCharge row at all.
                                                // It had no entry and fell back to
                                                // "Manage Subscription", offering to
                                                // manage a thing that does not exist.
                                                3: "Not started — add your card",
                                            }[
                                                site_subscription
                                                    ?.subscription_status_code
                                            ] ?? "Manage Subscription"
                                        }
                                        value={site_subscription?.status}
                                    />
                                }
                            >
                                <SiteSubscription
                                    auth={auth}
                                    subscription_status={subscription_status}
                                    user={auth?.user}
                                    site_subscription={site_subscription}
                                    monthly_charges={monthly_charges}
                                >
                                    <SubscriptionHistory
                                        subscriptionHistory={
                                            subscription_history
                                        }
                                    />
                                </SiteSubscription>
                            </Popup>

                            {billedRecords(subscription_history).length > 0 && (
                                    <Popup
                                        space="4"
                                        size="md"
                                        classes="w-full"
                                        modalclass="pinkmodal"
                                        text={
                                            <SettingItem
                                                icon={History}
                                                title="Billing History"
                                                subtitle="View past invoices and payments"
                                                value={`${billedRecords(subscription_history).length} Records`}
                                            />
                                        }
                                    >
                                        <h2 className="text-black font-gulfs text-xl mb-3">
                                            SUBSCRIPTION PAYMENT HISTORY
                                        </h2>
                                        <SubscriptionHistory
                                            subscriptionHistory={
                                                subscription_history
                                            }
                                        />
                                    </Popup>
                                )}

                            <Popup
                                action={passClose}
                                space="4"
                                classes="w-full"
                                modalclass="pinkmodal"
                                text={
                                    <SettingItem
                                        icon={TwitterIcon}
                                        title="Auto Tweet"
                                        subtitle={
                                            auth.user.twitter_username
                                                ? `@${auth.user.twitter_username}`
                                                : "Connect X (Twitter)"
                                        }
                                        value={
                                            auth.user.twitter_username
                                                ? "Connected"
                                                : "Setup"
                                        }
                                    />
                                }
                            >
                                <LinkTwitter
                                    auto_tweet={auto_tweet}
                                    auth={auth}
                                    username={
                                        (auth &&
                                            auth.user &&
                                            auth.user.twitter_username) ||
                                        false
                                    }
                                />
                            </Popup>

                            <FollowersBulkNotification
                                trigger={
                                    <SettingItem
                                        icon={UsersIcon}
                                        title="Follower Notifications"
                                        subtitle="Send push notifications to followers"
                                    />
                                }
                                pwa_notification_details={
                                    pwa_notification_details
                                }
                            />

                            <Popup
                                space="4"
                                classes="w-full"
                                modalclass="pinkmodal"
                                text={
                                    <SettingItem
                                        icon={GlobeIcon}
                                        title="Profile QR Code"
                                        subtitle="Generate and download your profile QR code"
                                    />
                                }
                            >
                                <div className="text-center p-4">
                                    <h2 className="text-black font-gulfs text-xl mb-4">
                                        YOUR PROFILE QR CODE
                                    </h2>
                                    <div className="bg-white p-6 border-2 border-black rounded-[30px] inline-block shadow-[5px_5px_0px_rgba(0,0,0,1)] mb-6">
                                        <QRCodeSVG
                                            id="qr-code-svg"
                                            value={`${window.location.origin}/${auth.user.username}`}
                                            size={200}
                                            level={"H"}
                                            includeMargin={true}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-6 font-medium max-w-[320px] mx-auto">
                                        Let people scan this QR code with their phone camera to open your Spenny Piggy profile page instantly.
                                    </p>
                                    <button
                                        onClick={() => {
                                            const svg = document.getElementById("qr-code-svg");
                                            const svgData = new XMLSerializer().serializeToString(svg);
                                            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                                            const svgUrl = URL.createObjectURL(svgBlob);
                                            const downloadLink = document.createElement("a");
                                            downloadLink.href = svgUrl;
                                            downloadLink.download = `${auth.user.username}-qr-code.svg`;
                                            document.body.appendChild(downloadLink);
                                            downloadLink.click();
                                            document.body.removeChild(downloadLink);
                                        }}
                                        className="bg-black text-white px-6 py-3 rounded-full text-sm font-black uppercase hover:bg-pink-600 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
                                    >
                                        Download SVG
                                    </button>
                                </div>
                            </Popup>
                        </div>
                    )}

                    {/* BILLING & PURCHASES */}
                    <div
                        className="mb-10 animate-fade-in-up"
                        style={{ animationDelay: "0.1s" }}
                    >
                        <SectionTitle title="Billing & Purchases" />

                        <SettingItem
                            icon={ShoppingBagIcon}
                            title="My Purchases"
                            subtitle="View your media, orders, receipts, and saved items"
                            onClick={() => router.get(route("gifter.hub"))}
                        />

                        <SettingItem
                            icon={CreditCardIcon}
                            title="My Subscriptions"
                            subtitle="Manage your creator memberships and subscriptions"
                            onClick={() => router.get("/billing/my-subscriptions")}
                        />
                    </div>

                    {/* PREFERENCES SECTION */}
                    <div
                        className="mb-10 animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        <SectionTitle title="Preferences" />

                        <Popup
                            action={passClose}
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    iconcolor={`text-voilet`}
                                    icon={DollarSignIcon}
                                    title="Display Currency"
                                    subtitle="Choose your preferred currency"
                                    value={global_currency}
                                />
                            }
                        >
                            <ChangeCurrency defaultvalue={global_currency} />
                        </Popup>

                        {isCreator && (
                            <>
                                <Popup
                                    size={"lg"}
                                    action={passClose}
                                    space="4"
                                    classes="w-full"
                                    modalclass="pinkmodal"
                                    text={
                                        <SettingItem
                                            iconcolor={`text-voilet`}
                                            icon={MapPinIcon}
                                            title="Address"
                                            subtitle="Manage your physical address"
                                        />
                                    }
                                >
                                    <AddressForm
                                        isEditPopup={true}
                                        setSassClose={setSassClose}
                                    />
                                </Popup>

                                <Popup
                                    action={passClose}
                                    space="4"
                                    classes="w-full"
                                    modalclass="pinkmodal"
                                    text={
                                        <SettingItem
                                            iconcolor={`text-voilet`}
                                            icon={Percent}
                                            title="VAT Settings"
                                            subtitle="Manage tax settings"
                                            value={`${vatpercent || "0"}%`}
                                        />
                                    }
                                >
                                    <ChangeVat
                                        defaultvalue={vatpercent}
                                        updatevat={updatevat}
                                    />
                                </Popup>

                                <div className="group w-full flex items-center justify-between p-4 bg-white border-2 border-[#FF007F] rounded-[20px] md:rounded-[30px]  hover:border-pink-200 hover:shadow-sm transition-all mb-3">
                                    <div className="flex items-center gap-4 text-left">
                                        {/* <div className="p-2.5 rounded-[10px] md:rounded-[20px]  bg-pink-50 text-[#FF007F]">
                                            <PiggyBank
                                                size={20}
                                                strokeWidth={2.5}
                                            />
                                        </div> */}
                                        <div
                                            className={`p-2.5 !rounded-[15px] md:rounded-[20px] w-[60px] h-[60px] md:w-[50px] md:h-[50px] md:min-w-[50px] md:min-h-[50px] flex items-center justify-center bg-pink-200 text-[#FF007F]`}
                                        >
                                            <PiggyBank
                                                size={20}
                                                strokeWidth={2.5}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-gray-800">
                                                Piggy Bank Earnings
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium mt-0.5">
                                                Show earnings goal on profile
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={showEarning}
                                        onChange={swicthEarning}
                                        className={`${showEarning ? "bg-pink-600" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                                    >
                                        <span
                                            className={`${showEarning ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                        />
                                    </Switch>
                                </div>
                            </>
                        )}

                        <div className="group w-full flex items-center justify-between p-4 bg-white border-2 border-[#FF007F] rounded-[30px]  hover:border-pink-200 hover:shadow-sm transition-all mb-3">
                            <div className="flex items-center gap-4 text-left">
                                <div
                                    className={`p-2.5 !rounded-[15px] md:rounded-[20px] w-[60px] h-[60px] md:w-[50px] md:h-[50px] md:min-w-[50px] md:min-h-[50px] flex items-center justify-center bg-pink-200 text-[#FF007F]`}
                                >
                                    <BellIcon size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-gray-800">
                                        Email Notifications
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                                        Receive updates via email
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={emailEnabled}
                                onChange={switchNotification}
                                className={`${emailEnabled ? "bg-pink-600" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                            >
                                <span
                                    className={`${emailEnabled ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                        </div>

                        <SettingItem
                            icon={History}
                            title="Activity Logs"
                            subtitle="View your audit trail and filter activity entries"
                            onClick={() => router.get(route("activity.logs"))}
                        />

                        <SettingItem
                            icon={Gift}
                            title="Support History"
                            subtitle="View your complete support history"
                            onClick={() =>
                                router.get(route("support.history.page"))
                            }
                        />
                    </div>

                    {/* SECURITY SECTION */}
                    <div
                        className="mb-10 animate-fade-in-up"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <SectionTitle title="Security" />

                        <ManagePasskey
                            className="w-full border-2 border-[#FF007F] rounded-[30px]  hover:border-pink-200 hover:shadow-sm transition-all"
                            email={auth.user.email}
                        />

                        <Popup
                            size={"lg"}
                            action={passClose}
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    icon={Shield}
                                    title={isCreator ? "Creator Security Zone" : "Devices & Sessions"}
                                    subtitle={isCreator ? "Manage sessions and blocked users" : "Manage active login sessions"}
                                />
                            }
                        >
                            <SecurityZone isCreator={isCreator} />
                        </Popup>

                        <Popup
                            action={emailPopupAction}
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    icon={MailIcon}
                                    title="Email Address"
                                    subtitle="Update your email address"
                                    value={auth?.user?.email}
                                />
                            }
                        >
                            <UpdateProfileInformation
                                closeModal={closeEmailPopup}
                            />
                        </Popup>

                        <Popup
                            action={passClose}
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    icon={LockIcon}
                                    title="Password"
                                    subtitle="Change your password"
                                    value="••••••••"
                                />
                            }
                        >
                            <UpdatePasswordForm
                                passwordUpdate={passwordUpdated}
                            />
                        </Popup>

                        <Link
                            href={route("account.2fa")}
                            className="block w-full"
                        >
                            <SettingItem
                                icon={Shield}
                                title="Multi-Step Verification"
                                subtitle="Add an extra layer of security"
                                value={
                                    auth?.user?.is_2fa == 1
                                        ? "Enabled"
                                        : "Disabled"
                                }
                            />
                        </Link>
                    </div>

                    {/* SUPPORT SECTION */}
                    <div
                        className="mb-10 animate-fade-in-up"
                        style={{ animationDelay: "0.4s" }}
                    >
                        <SectionTitle title="Support & Legal" />

                        <Link
                            href={route("refer-and-earn")}
                            className="block w-full"
                        >
                            <SettingItem
                                icon={UsersIcon}
                                title="Refer & Earn"
                                subtitle="Invite creators and earn rewards"
                            />
                        </Link>

                        <Link
                            href={route("how-spenny-piggy-works")}
                            className="block w-full"
                        >
                            <SettingItem
                                icon={HelpCircle}
                                title="How it Works"
                                subtitle="Learn about Spenny Piggy"
                            />
                        </Link>

                        <Link
                            href={route("founder.bonus")}
                            className="block w-full"
                        >
                            <SettingItem
                                icon={Trophy}
                                title="Founder Program"
                                subtitle="View seats, qualification status, and rewards"
                            />
                        </Link>

                        <SettingItem
                            icon={HelpCircle}
                            title="Contact Support"
                            subtitle="Get help via live chat or email"
                            onClick={contactSupport}
                        />

                        <Popup
                            action={suggestionClose}
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    icon={HelpCircle}
                                    title="Suggest a Feature"
                                    subtitle="Have an idea? Let us know what to build next"
                                />
                            }
                        >
                            <div className="p-4">
                                <h2 className="text-black font-gulfs text-xl mb-4 uppercase">
                                    Suggest a Feature
                                </h2>
                                <p className="text-sm text-gray-600 mb-4 font-medium">
                                    We love hearing your feedback! Tell us what features or changes you'd like to see on Spenny Piggy.
                                </p>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!suggestion.trim()) return;
                                    setSubmittingSuggestion(true);
                                    router.post(route('feature-suggestion.store'), {
                                        suggestion: suggestion
                                    }, {
                                        onSuccess: () => {
                                            successAlert("Thank you for your suggestion!");
                                            setSuggestion("");
                                            closeSuggestionPopup();
                                        },
                                        onError: () => {
                                            errorAlert("Failed to submit suggestion.");
                                        },
                                        onFinish: () => {
                                            setSubmittingSuggestion(false);
                                        }
                                    });
                                }}>
                                    <textarea
                                        value={suggestion}
                                        onChange={(e) => setSuggestion(e.target.value)}
                                        placeholder="I want a feature that allows..."
                                        rows={5}
                                        maxLength={2000}
                                        required
                                        className="w-full p-4 border-2 border-black rounded-[20px] focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm font-medium mb-4"
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeSuggestionPopup}
                                            className="px-5 py-2.5 border-2 border-black text-black font-bold uppercase rounded-full hover:bg-gray-100 transition-all text-xs"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingSuggestion || !suggestion.trim()}
                                            className="px-6 py-2.5 bg-black text-white font-black uppercase rounded-full hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-xs shadow-[3px_3px_0px_rgba(0,0,0,1)] disabled:shadow-none"
                                        >
                                            {submittingSuggestion ? "Submitting..." : "Submit"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </Popup>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Link
                                href={route("terms-and-conditions")}
                                className="block w-full"
                            >
                                <SettingItem
                                    icon={FileText}
                                    title="Terms & Conditions"
                                    subtitle="Read our terms and conditions"
                                    className="!mb-0"
                                />
                            </Link>
                            <Link
                                href={route("promotion-terms")}
                                className="block w-full"
                            >
                                <SettingItem
                                    icon={GlobeIcon}
                                    title="Privacy Policy"
                                    subtitle="Read our privacy policy"
                                    className="!mb-0"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* DANGER ZONE */}
                    <div
                        className="mb-10 animate-fade-in-up"
                        style={{ animationDelay: "0.5s" }}
                    >
                        <SectionTitle title="Danger Zone" />

                        <SettingItem
                            bordercolor="border-red-600"
                            icon={LogoutIcon}
                            title="Logout"
                            subtitle="Sign out of your session"
                            onClick={() => {
                                if (confirm("Are you sure you want to log out?")) {
                                    router.post(route("logout"));
                                }
                            }}
                            isDestructive
                        />
                        <Popup
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    bordercolor="border-red-600"
                                    icon={Trash2Icon}
                                    title="Delete Account"
                                    subtitle="Permanently remove your account and data"
                                    isDestructive
                                />
                            }
                        >
                            <DeleteUserForm />
                        </Popup>
                    </div>

                    <div className="text-center text-xs text-gray-400 mt-10 pb-10">
                        {auth?.user?.created_at && (
                            <div className="mb-2">
                                Joined on{" "}
                                {new Date(
                                    auth.user.created_at,
                                ).toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </div>
                        )}
                        Version 2.0.0 • Spenny Piggy ©{" "}
                        {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
