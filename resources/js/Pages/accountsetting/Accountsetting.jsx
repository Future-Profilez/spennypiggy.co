import { useEffect, useState } from "react";
import { lazy } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
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
const EditProfile = lazy(() => import("@/Pages/account/EditProfile"));
import DeleteStripeAccount from "../Profile/DeleteStripeAccount";
import SiteSubscription from "../Profile/SiteSubscription";
import AddressForm from "../rye/AddressForm";
import FollowersBulkNotification from "@/Components/FollowersBulkNotification";
import SubscriptionHistory from "@/Components/SubscriptionHistory";
import ManagePasskey from '@/Components/ManagePasskey';
import SecurityZone from '@/Components/SecurityZone';
import { Switch } from "@headlessui/react";
import {
    User,
    CreditCard,
    Bell,
    Shield,
    LogOut,
    ExternalLink,
    ChevronRight,
    Settings,
    DollarSign,
    Heart,
    Gift,
    LayoutDashboard,
    History,
    MapPin,
    Percent,
    Twitter,
    PiggyBank,
    Users,
    Trash2,
    Mail,
    Lock,
    HelpCircle,
    FileText,
    Globe,
    Fingerprint,
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
    } = usePage().props;

    const [emailPopupAction, setEmailPopupAction] = useState(null);
    const [emailEnabled, setSetEnabled] = useState(
        auth && auth.user && auth.user.notification_send == 1 ? true : false,
    );
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
        setSetEnabled(!emailEnabled);
        axios
            .post(route("notification-switch"))
            .then((resp) => {
                successAlert(resp.data.msg);
            })
            .catch((_err) => {
                console.error("error", _err);
                setSetEnabled(!emailEnabled); // Revert on error
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
    }) => (
        <div
            onClick={onClick}
            className={`relative group w-full md:flex items-center justify-between p-4 bg-gray-100 border-2 ${bordercolor || "border-pink-500"}  !rounded-[30px] hover:border-pink-200 hover:shadow-sm transition-all cursor-pointer mb-3 ${isDestructive ? "hover:bg-red-50 hover:border-red-200" : ""} ${className}`}
        >
            <div className="flex !items-center gap-4 text-left">
                <div
                    className={`p-2.5 !rounded-[15px] md:rounded-[20px] w-[60px] h-[60px] md:w-[50px] md:h-[50px] md:min-w-[50px] md:min-h-[50px] flex items-center justify-center
                    ${isDestructive ? "bg-red-200 text-red-600" : "bg-pink-200 text-pink-600"}`}
                >
                    <Icon size={28} strokeWidth={2} />
                </div>
                <div>
                    <h3
                        className={`font-bold text-base ${isDestructive ? "text-red-600" : "text-gray-800"}`}
                    >
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {value && (
                    <span className=" mt-4 md:mt-0 text-sm font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-pink-500">
                        {value}
                    </span>
                )}
                {action ? (
                    action
                ) : (
                    <ChevronRight
                        size={18}
                        className="
                 text-gray-300 group-hover:text-pink-400 absolute md:static !text-xl
                 top-[30px] right-4 "
                    />
                )}
            </div>
        </div>
    );

    const SectionTitle = ({ title }) => (
        <h2 className="text-normal text-gray-600 mb-4 px-2 uppercase tracking-widest font-gulfs">
            {title}
        </h2>
    );

    const isCreator = auth && auth.user && auth.user.role == 1;
    const stripeSubmitted =
        auth && auth.user && auth.user.stripe_details_submitted == 1;

    return (
        <Authenticated user={user} auth={auth.user}>
            <Head title={"My Account"} />
            <div className="min-h-screen bg-gray-200 py-6 md:py-16">
                <div className="max-w-3xl mx-auto px-6 pt-8">
                    <div className="md:text-center mb-10">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-gray-900 uppercase tracking-wide mb-2">
                            Account{" "}
                            <span className="text-pink-600">Settings</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-normal">
                            Manage your profile, preferences and security
                        </p>
                    </div>

                    {/* CREATOR STUDIO SECTION */}
                    {isCreator && (
                        <div className="mb-10 animate-fade-in-up">
                            <SectionTitle title="Creator Studio" />

                            <EditProfile
                                user={auth?.user}
                                text={
                                    <SettingItem
                                        icon={Users}
                                        title="My Profile"
                                        subtitle="Manage your earnings and payouts"
                                        value={auth?.user?.name}
                                    />
                                }
                                classes="w-full"
                                global_currency={global_currency}
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
                                space="4" size='lg' 
                                modalclass="pinkmodal" 
                                classes="w-full" 
                                text={
                                    <SettingItem
                                        icon={Gift}
                                        title="Platform Subscription"
                                        subtitle={
                                            site_subscription?.subscription_status_code === 1 || site_subscription?.subscription_status_code === 2
                                                ? "Active Subscription"
                                                : "Manage Subscription"
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
                                >
                                    <SubscriptionHistory
                                        subscriptionHistory={
                                            subscription_history
                                        }
                                    />
                                </SiteSubscription>
                            </Popup>

                            {/* {subscription_history &&
                                subscription_history.length > 0 && (
                                    <Popup
                                        space="4"
                                        classes="w-full"
                                        modalclass="pinkmodal"
                                        text={
                                            <SettingItem
                                                icon={History}
                                                title="Billing History"
                                                subtitle="View past invoices and payments"
                                                value={`${subscription_history.length} Records`}
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
                                )} */}

                            <Popup
                                action={passClose}
                                space="4"
                                classes="w-full"
                                modalclass="pinkmodal"
                                text={
                                    <SettingItem
                                        icon={Twitter}
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
                                        icon={Users}
                                        title="Follower Notifications"
                                        subtitle="Send push notifications to followers"
                                    />
                                }
                                pwa_notification_details={
                                    pwa_notification_details
                                }
                            />
                        </div>
                    )}

                    {/* PREFERENCES SECTION */}
                    <div
                        className="mb-10 animate-fade-in-up"
                        style={{ animationDelay: "0.1s" }}
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
                                    icon={DollarSign}
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
                                            icon={MapPin}
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

                                <div className="group w-full flex items-center justify-between p-4 bg-white border-2 border-pink-500 rounded-[20px] md:rounded-[30px] hover:border-pink-200 hover:shadow-sm transition-all mb-3">
                                    <div className="flex items-center gap-4 text-left">
                                        {/* <div className="p-2.5 rounded-[10px] md:rounded-[20px]  bg-pink-50 text-pink-600">
                                            <PiggyBank
                                                size={20}
                                                strokeWidth={2.5}
                                            />
                                        </div> */}
                                        <div
                                            className={`p-2.5 !rounded-[15px] md:rounded-[20px] w-[60px] h-[60px] md:w-[50px] md:h-[50px] md:min-w-[50px] md:min-h-[50px] flex items-center justify-center bg-pink-200 text-pink-600`}
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
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">
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

                        <div className="group w-full flex items-center justify-between p-4 bg-white border-2 border-pink-500 rounded-[30px] hover:border-pink-200 hover:shadow-sm transition-all mb-3">
                            <div className="flex items-center gap-4 text-left">
                              
                                <div
                                            className={`p-2.5 !rounded-[15px] md:rounded-[20px] w-[60px] h-[60px] md:w-[50px] md:h-[50px] md:min-w-[50px] md:min-h-[50px] flex items-center justify-center bg-pink-200 text-pink-600`}
                                        >
                                            <Bell
                                                size={20}
                                                strokeWidth={2.5}
                                            />
                                        </div>
                                <div>
                                    <h3 className="font-bold text-base text-gray-800">
                                        Email Notifications
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
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
                            onClick={() => router.get(route("creator.activity.logs"))}
                        />
                    </div>

                    {/* SECURITY SECTION */}
                    <div
                        className="mb-10 animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        <SectionTitle title="Security" />

                        <ManagePasskey className="w-full border-2 border-pink-500 rounded-[30px] hover:border-pink-200 hover:shadow-sm transition-all" email={auth.user.email} />

                        {isCreator && (
                            <Popup
                                size={"lg"}
                                action={passClose}
                                space="4"
                                classes="w-full"
                                modalclass="pinkmodal"
                                text={
                                    <SettingItem
                                        icon={Shield}
                                        title="Creator Security Zone"
                                        subtitle="Manage sessions and blocked users"
                                    />
                                }
                            >
                                <SecurityZone />
                            </Popup>
                        )}

                        <Popup
                            action={emailPopupAction}
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    icon={Mail}
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
                                    icon={Lock}
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
                        style={{ animationDelay: "0.3s" }}
                    >
                        <SectionTitle title="Support & Legal" />

                        <Link
                            href={route("refer-and-earn")}
                            className="block w-full"
                        >
                            <SettingItem
                                icon={Users}
                                title="Refer & Earn"
                                subtitle="Invite creators and earn rewards"
                            />
                        </Link>

                        <Link
                            href={route("how-it-works")}
                            className="block w-full"
                        >
                            <SettingItem
                                icon={HelpCircle}
                                title="How it Works"
                                subtitle="Learn about Spenny Piggy"
                            />
                        </Link>

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
                                    icon={Globe}
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
                        style={{ animationDelay: "0.4s" }}
                    >
                        <SectionTitle title="Danger Zone" />
                        <Popup
                            space="4"
                            classes="w-full"
                            modalclass="pinkmodal"
                            text={
                                <SettingItem
                                    bordercolor="border-red-600"
                                    icon={Trash2}
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
                        Version 2.0.0 • Spenny Piggy ©{" "}
                        {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
