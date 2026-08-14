import { useRef, useState, useEffect } from "react";
import userdefaultphoto from "../../../assets/siteicon.png";
import coverimage from "../../../assets/img/wishlistbannerimg.png";
import editicon from "../../../assets/img/editicon.png";
import Popup from "@/Components/Popup";
import { useForm, usePage } from "@inertiajs/react";
import PendingChangesNotice from "@/Components/PendingChangesNotice";
import { useAlerts } from "@/Components/Alerts";
import UpdateAvatar from "./UpdateAvatar";
import LoaderButton from "@/Components/LoaderButton";
import spennypiggy from "../../../assets/img/logo.png";
import axios from "axios";
import { Switch } from "@headlessui/react";
import { Link } from "@inertiajs/react";
import ManagePasskey from "@/Components/ManagePasskey";
import CoverBannerPicker from "@/Components/CoverBannerPicker";

export default function EditProfile({
    profilepage,
    user,
    text,
    classes,
    updateProfileSteps,
    global_currency,
}) {


    console.log("user", user);

    // SSR Guard for usePage().props
    const pageProps = usePage().props;
    const auth = pageProps.auth;

    const profileUser = {
        ...(auth?.user ?? {}),
        ...(user ?? {}),
        date_of_birth: user?.date_of_birth ?? auth?.user?.date_of_birth,
        creator_category: user?.creator_category ?? auth?.user?.creator_category,
        country: user?.country ?? auth?.user?.country,
        min_surprise_amount: user?.min_surprise_amount ?? auth?.user?.min_surprise_amount,
        social_handle: user?.social_handle ?? auth?.user?.social_handle,
    };

    const formatDate = (value) => {
        if (!value) {
            return "";
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return "";
        }

        return parsed.toISOString().slice(0, 10);
    };

    // SSR Guard for window usage
    const isSSR = typeof window === "undefined";

    const [close, setClose] = useState();
    const { successAlert, errorAlert } = useAlerts();
    const [profileDP, setProfileDP] = useState();
    const [coverImage, setCoverImage] = useState();
    const [socialFile, setSocialFile] = useState();
    const [activeTab, setActiveTab] = useState("profile"); // profile, appearance, settings

    useEffect(() => {
        if (socialFile) {
            setData("social_image", socialFile);
        }
    }, [socialFile]);

    const { data, setData, post, processing, errors } = useForm({
        name: profileUser.name,
        username: profileUser.username,
        email: profileUser.email,
        bio: profileUser?.bio || "",
        avatar: null,
        cover: null,
        gender: profileUser?.gender || "he",
        date_of_birth: formatDate(profileUser?.date_of_birth),
        creator_category: profileUser?.creator_category
            ? typeof profileUser.creator_category === "string"
                ? JSON.parse(profileUser.creator_category)
                : profileUser.creator_category
            : [],
        country: profileUser?.country || "",
        social_image: null,
        min_surprise_amount: profileUser?.min_surprise_amount || 5,
        social_handle: profileUser?.social_handle || "",
        profilepage: profilepage || false,
    });

    useEffect(() => {
        setData("name", profileUser.name);
        setData("username", profileUser.username);
        setData("email", profileUser.email);
        setData("bio", profileUser?.bio || "");
        setData("gender", profileUser?.gender || "he");
        setData(
            "date_of_birth",
            formatDate(profileUser?.date_of_birth),
        );
        setData(
            "creator_category",
            profileUser?.creator_category
                ? typeof profileUser.creator_category === "string"
                    ? JSON.parse(profileUser.creator_category)
                    : profileUser.creator_category
                : [],
        );
        setData("country", profileUser?.country || "");
        setData("min_surprise_amount", profileUser?.min_surprise_amount || 5);
        setData("social_handle", profileUser?.social_handle || "");
    }, [
        profileUser.name,
        profileUser.username,
        profileUser.email,
        profileUser.bio,
        profileUser.gender,
        profileUser.date_of_birth,
        profileUser.creator_category,
        profileUser.country,
        profileUser.min_surprise_amount,
        profileUser.social_handle,
    ]);

    const [loading, setLoading] = useState(processing);
    const generateCardAndUpload = async (avataruid, load) => {
        // if(load == true){
        //     setLoading(true);
        // }
        const container = document.createElement("div");
        container.style.position = "absolute";
        // container.style.left = '-9999px';
        // container.style.top = '0';
        // container.style.zIndex = '-1';
        document.body.appendChild(container);
        const cardName = (data?.name || user?.name || "").trim();
        const cardUsername = data?.username || user?.username || "";

        // The chip answers "what do I get" — the old card said nothing about it.
        const rawCats = data?.creator_category;
        const catList = Array.isArray(rawCats)
            ? rawCats
            : typeof rawCats === "string" && rawCats
              ? (() => {
                    try {
                        const parsed = JSON.parse(rawCats);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                })()
              : [];
        // Two categories, not three. Three joined with " · " runs the pill to the
        // card's right edge and the 10px uppercase text reads as a cramped strip.
        const cardCategory = catList.length
            ? catList.slice(0, 2).join(" · ")
            : "Exclusive content";

        const esc = (s) =>
            String(s).replace(
                /[&<>"']/g,
                (c) =>
                    ({
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#39;",
                    })[c],
            );

        // Authored at 600 x 337.5 and captured at scale 2, so the exported PNG is
        // 1200 x 675.
        //
        // Everything is laid out with flex. The previous version pinned "is now on"
        // and the logo to hardcoded offsets (top:180px; left:210px), so nothing could
        // move without moving everything, and a long name broke mid-word.
        //
        // The arc pattern is drawn with plain divs rather than social-bg.png: the
        // artwork was covered in gift boxes and a money bag, which is the framing the
        // content-first compliance rules removed from every other surface — and this
        // is the most-shared asset the platform produces.
        // Shared by the markup and the shrink-to-fit loop below — if the two ever
        // disagree the fitter measures against a line box the card does not use.
        const NAME_FONT_SIZE = 43;
        const NAME_LINE_HEIGHT = 1.02;

        // 🚨 NOTHING BELOW MAY USE `vertical-align: middle` TO CENTRE TEXT.
        //
        // html2canvas draws a text run near the BOTTOM of its line box rather than
        // on the browser's baseline, and it does so whichever way the box is
        // centred — `vertical-align: middle` on a table-cell and an explicit
        // `line-height` equal to the box height both rendered the same. Measured on
        // the raster: the pill's label sat 6.75px below the pill's centre and the
        // URL 9.5px below the bar's centre, which is what "the badge text and the
        // URL are not aligned" was.
        //
        // So each of these boxes has an explicit HEIGHT and a deliberately SHORTER
        // `line-height`, chosen so the text lands centred in the exported PNG. The
        // offset moves ~0.5px for every 1px of line-height, which is how these were
        // derived. Consequence, and it is the whole point: the live DOM now looks
        // slightly wrong while the PNG looks right. Only the PNG is ever seen —
        // this element is generated off-screen and thrown away. Verify a change
        // here by measuring the CANVAS, never by looking at the DOM.
        //
        // Verified good state (authored px, offset from box centre):
        // pill label 0.25 · dot vs label -0.25 · URL -0.25 · VISIT -0.25

        const arc = (r, alpha) =>
            `<div style="position:absolute;width:${r * 2}px;height:${r * 2}px;left:${620 - r}px;top:${352 - r}px;border-radius:50%;background:rgba(255,255,255,${alpha});"></div>`;

        container.innerHTML = `
            <div
                id="card-to-capture"
                style="position:relative;margin:300px 0;width:600px;height:337.5px;color:#fff;overflow:hidden;font-family:'CeraGR',system-ui,sans-serif;background:linear-gradient(118deg,#8C0F45 0%,#C21367 46%,#FF2E93 100%);"
            >
                ${arc(280, 0.05)}${arc(215, 0.05)}${arc(150, 0.05)}${arc(88, 0.05)}
                <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.13) 1.2px,transparent 1.3px);background-size:17px 17px;"></div>

                <div style="position:absolute;inset:0;z-index:2;padding:27px 32px;display:flex;flex-direction:column;justify-content:center;">

                    <!--
                        This row is a table, not a flex row, and that is load-bearing.
                        html2canvas mis-places a flex child sized by \`flex:1\` + \`gap\`:
                        measured on the exported PNG the name was drawn ~53px LEFT of
                        its column and overlapped the avatar, while the pill beneath it
                        — same parent — landed correctly. A fixed table layout gives
                        both children the same deterministic box, and \`table-layout:fixed\`
                        means the name can never widen the cell and push itself out.
                    -->
                    <div style="display:table;width:100%;table-layout:fixed;">
                        <div style="display:table-cell;width:127px;vertical-align:middle;">
                            <div style="width:108px;height:108px;border-radius:50%;padding:4px;background:linear-gradient(150deg,#A2E4B8,#E6EA7B 62%,#A2E4B8);box-shadow:0 9px 20px rgba(0,0,0,0.42);">
                                <img
                                    src="https://ucarecdn.com/${avataruid}/-/crop/1:1/-/preview/"
                                    alt="Profile"
                                    crossorigin="anonymous"
                                    style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;"
                                />
                            </div>
                        </div>
                        <div style="display:table-cell;vertical-align:middle;overflow:hidden;">
                            <!--
                                The gap under the name is 26px of margin for ~14px of
                                VISIBLE space: measured on the raster, \`gulfs\` ink runs
                                about 12px past the bottom of its own line box, so the
                                CSS gap and the optical gap are not the same number.
                                At the original 10px the pill sat on the letters; at 14
                                it still read as touching (2px of daylight).
                                line-height must also stay >= 1 for the same reason.
                            -->
                            <div id="card-name" style="font-family:'gulfs',system-ui,sans-serif;font-size:43px;line-height:${NAME_LINE_HEIGHT};text-transform:uppercase;letter-spacing:0.5px;color:#fff;text-shadow:0 1.5px 0 rgba(0,0,0,0.34);overflow-wrap:break-word;">${esc(cardName)}</div>
                            <div style="display:inline-block;margin-top:26px;background:#A2E4B8;color:#0B2B1A;border-radius:999px;padding:0 12px;height:25px;line-height:13px;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;max-width:100%;overflow:hidden;">
                                <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#0B2B1A;margin-right:6px;margin-bottom:-5px;vertical-align:baseline;"></span><span style="vertical-align:baseline;">${esc(cardCategory)}</span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:12px;">
                        <span style="font-size:16.5px;color:rgba(255,255,255,0.92);vertical-align:middle;">is now on</span><img src="${spennypiggy}" alt="Spenny Piggy" crossorigin="anonymous" style="height:30px;width:auto;display:inline-block;vertical-align:middle;margin-left:10px;" /></div>

                    <!-- Table for the same reason as the row above: no flex:1. -->
                    <div style="display:table;width:100%;margin-top:19px;border-radius:11px;overflow:hidden;box-shadow:0 8px 18px rgba(0,0,0,0.36);">
                        <div style="display:table-cell;width:62px;background:#0B0B0C;color:#fff;vertical-align:top;text-align:center;padding:0 13px;height:44px;line-height:32px;font-size:9.5px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">Visit</div>
                        <div style="display:table-cell;background:#fff;color:#0B0B0C;vertical-align:top;padding:0 8px 0 15px;height:44px;line-height:24px;font-size:17px;font-weight:700;letter-spacing:-0.012em;white-space:nowrap;overflow:hidden;">spennypiggy.co/<span style="color:#C21367;">${esc(cardUsername)}</span></div>
                        <div style="display:table-cell;width:82px;background:#fff;vertical-align:top;padding:12px 13px 13px 3px;">
                            <img src="${spennypiggy}" alt="" crossorigin="anonymous" style="height:19px;width:auto;display:block;" />
                        </div>
                    </div>
                </div>
            </div>
        `;

        const card = container.querySelector("#card-to-capture");
        const images = card.querySelectorAll("img");

        await Promise.all(
            Array.from(images).map((img) => {
                return new Promise((resolve, reject) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.onload = () => resolve();
                        img.onerror = () => {
                            console.warn("Image failed to load:", img.src);
                            resolve(); // Continue even if image fails
                        };
                    }
                });
            }),
        );

        // The name is set in 'gulfs'. Measuring it before that face has loaded gives
        // fallback-font widths, so the fitter would size against the wrong metrics.
        if (document.fonts?.ready) {
            try {
                await document.fonts.ready;
            } catch {
                // Font loading is best-effort — never block the card on it.
            }
        }

        // Shrink to fit rather than truncate. A card that ends in an ellipsis, or
        // splits a name mid-word the way the old `word-break:break-all` did, is worse
        // than a slightly smaller name. Two lines max, then step the size down.
        const nameEl = card.querySelector("#card-name");
        if (nameEl) {
            const maxHeight = 2 * NAME_FONT_SIZE * NAME_LINE_HEIGHT; // two lines at the starting size
            let size = NAME_FONT_SIZE;
            while (size > 20 && nameEl.scrollHeight > maxHeight) {
                size -= 2;
                nameEl.style.fontSize = `${size}px`;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(card, {
            useCORS: true,
            scale: 2,
            allowTaint: false,
        });
        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png", 1.0),
        );
        if (!blob) {
            console.log("❌ Failed to convert card to image");
            return;
        }

        setSocialFile(
            new File([blob], `${user?.username}-social_avatar`, {
                type: blob.type,
            }),
        );
        setData(
            "social_image",
            new File([blob], `${user?.username}-social_avatar`, {
                type: blob.type,
            }),
        );
        // Update the preview with the newly generated banner
        const bannerUrl = URL.createObjectURL(blob);
        setCurrentSocialBanner(bannerUrl);

        // 7. Cleanup
        setTimeout(() => {
            if (container && container.parentNode) {
                document.body.removeChild(container);
            }
        }, 1000);
    };
    const [UploadingStart, setUploadingStart] = useState(false);
    const [CoverUploadingStart, setCoverUploadingStart] = useState(false);
    const [localAvatar, setLocalAvatar] = useState("");
    const [generatingBanner, setGeneratingBanner] = useState(false);
    const [currentSocialBanner, setCurrentSocialBanner] = useState(
        auth?.user?.social_url || null,
    );

    // Toggles State
    const [piggyBankEnabled, setPiggyBankEnabled] = useState(false);

    useEffect(() => {
        setPiggyBankEnabled(user?.show_piggy_bank == 1);
    }, [user?.show_piggy_bank]);

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        setNotificationsEnabled(auth?.user?.notification_send == 1);
    }, [auth?.user?.notification_send]);

    const getImageUID = (e) => {
        setData("avatar", {
            uuid: e?.uuid,
            cdnUrlModifiers: e?.cdnUrlModifiers || null,
        });
        setLocalAvatar(e?.uuid || "");
        setProfileDP(e.cdnUrl);
        setUploadingStart(false);
    };

    const getCoverUID = (e) => {
        setCoverImage(e.cdnUrl);
        setData("cover", {
            uuid: e?.uuid,
            cdnUrlModifiers: e?.cdnUrlModifiers || null,
        });
        setCoverUploadingStart(false);
    };

    const [username, setUsername] = useState(user?.username);
    const [profileTags, setProfileTags] = useState([]);
    useEffect(() => {
        if (user?.creator_category) {
            try {
                // Handle both array and string format from DB
                const categories =
                    typeof user.creator_category === "string"
                        ? JSON.parse(user.creator_category)
                        : user.creator_category;
                setProfileTags(Array.isArray(categories) ? categories : []);
            } catch (e) {
                console.error("Error parsing creator tags", e);
                setProfileTags([]);
            }
        }
    }, [user]);

    const handleProfileTags = (e) => {
        const value = e.target.value;
        setProfileTags((prevTags) => {
            const newTags = prevTags.includes(value)
                ? prevTags.filter((tag) => tag !== value)
                : [...prevTags, value];
            setData("creator_category", newTags);
            return newTags;
        });
    };

    const creatortypes = [
        { label: "Artist", value: "Artist" },
        { label: "Activist", value: "Activist" },
        { label: "DJ", value: "DJ" },
        { label: "Beauty Creator", value: "Beauty Creator" },
        { label: "Dancer", value: "Dancer" },
        { label: "Developer", value: "Developer" },
        { label: "Cosplay Creator", value: "Cosplay Creator" },
        { label: "Education Creator", value: "Education Creator" },
        { label: "Fashionista", value: "Fashionista" },
        { label: "Gamer", value: "Gamer" },
        { label: "Gym Bunny", value: "Gym Bunny" },
        { label: "Musician", value: "Musician" },
        { label: "Model", value: "Model" },
        { label: "Podcaster", value: "Podcaster" },
        { label: "Streamer", value: "Streamer" },
        { label: "Video Creator", value: "Video Creator" },
        { label: "Writer", value: "Writer" },
    ];

    const generateSocialImage = async () => {
        const avatarToUse = localAvatar || user?.avatar;
        if (avatarToUse) {
            setGeneratingBanner(true);
            try {
                await generateCardAndUpload(avatarToUse);
            } catch (error) {
                console.error("Error generating banner:", error);
                alert("Failed to generate banner. Please try again.");
            }
            setGeneratingBanner(false);
            return;
        } else {
            alert(
                "Please upload an avatar first to generate a promotional banner.",
            );
            return;
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();

        // Local regex validation for username to avoid unnecessary server calls
        if (data.username) {
            if (!/^[a-zA-Z0-9_\.]+$/.test(data.username)) {
                errorAlert(
                    "Username can only contain letters, numbers, periods (.), and underscores (_).",
                );
                return;
            }
            if (data.username.length < 5) {
                errorAlert("The username must be at least 5 characters.");
                return;
            }
            if (data.username.length > 20) {
                errorAlert(
                    "The username must not be greater than 20 characters.",
                );
                return;
            }
        }

        setLoading(true);
        // Automatic social image generation removed to prevent potential Cloudflare blocks
        // due to large binary payloads. Users can generate it manually in Appearance tab.
        // await generateSocialImage();

        post(route("edit-profile"), {
            preserveScroll: true,
            onSuccess: (resp) => {
                setClose(false);
                setTimeout(() => {
                    setClose();
                }, 1000);
                if (resp.props.flash?.success) {
                    updateProfileSteps && updateProfileSteps();
                }
                setLoading(false);
            },
            onError: (_err) => {
                console.table("profile update error", _err);
                if (_err.username) {
                    errorAlert(
                        _err.username || "Something went wrong in username.",
                    );
                }
                if (_err.email) {
                    errorAlert(_err.email || "Something went wrong in email.");
                }
                if (_err.bio) {
                    errorAlert(_err.bio || "Something went wrong in bio.");
                }
                if (_err.name) {
                    errorAlert(
                        _err.name ||
                            "Something went wrong in your display name.",
                    );
                }
                setLoading(false);
            },
        });
    };

    const IsProfileChannged = async () => {
        // Removed automatic banner generation - users can generate banners manually
    };

    const togglePiggyBank = async () => {
        try {
            const resp = await axios.post(route("piggy-bank-setting"));
            if (resp.data.status) {
                setPiggyBankEnabled(!piggyBankEnabled);
                successAlert(resp.data.message);
            }
        } catch (e) {
            console.error(e);
            errorAlert("Failed to update Piggy Bank setting.");
        }
    };

    const toggleNotifications = async () => {
        const previousValue = notificationsEnabled;

        setNotificationsEnabled(!previousValue);

        try {
            const resp = await axios.post(route("notification-switch"));

            if (resp.data.status) {
                successAlert(resp.data.message);
            } else {
                setNotificationsEnabled(previousValue);
            }
        } catch (e) {
            console.error(e);

            setNotificationsEnabled(previousValue);

            errorAlert("Failed to update Notification setting.");
        }
    };

    const renderTabs = () => (
        <div className="flex ps-2 py-3 gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            <button
                onClick={() => setActiveTab("profile")}
 className={`py-2 px-6 text-sm font-black uppercase tracking-widest border-[3px] border-black rounded-box-sm transition-all whitespace-nowrap ${
                    activeTab === "profile"
 ? "bg-yellow-300 text-black translate-x-[-1px] translate-y-[-1px]"
 : "bg-white text-black hover:bg-yellow-100 hover:translate-x-[-1px] hover:translate-y-[-1px]"
                }`}
            >
                Profile
            </button>

            {/* Appearance is no longer its own tab. Photos, bio and name are one
                job — "how my profile looks" — and splitting them meant a creator
                changing their avatar and their display name had to save, switch
                tab and save again. The photos now open the merged tab, above the
                fields, because they are what a visitor sees first. */}
            <button
                onClick={() => setActiveTab("settings")}
 className={`py-2 px-6 text-sm font-black uppercase tracking-widest border-[3px] border-black rounded-box-sm transition-all whitespace-nowrap ${
                    activeTab === "settings"
 ? "bg-yellow-300 text-black translate-x-[-1px] translate-y-[-1px]"
 : "bg-white text-black hover:bg-yellow-100 hover:translate-x-[-1px] hover:translate-y-[-1px]"
                }`}
            >
                Settings
            </button>
        </div>
    );

    return (
        <Popup
            modalclass="pinkmodal editprofile full"
            size="xl"
            action={close}
            text={text || <> Update Profile </>}
            classes={` ${classes ? classes : "button bg-pink block sm:flex m-auto sm:m-0"} `}
        >
            <div className="editForm mt-4">
                {UploadingStart ? (
                    <div className="p-4 ">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="pb-0 font-gulfs uppercase text-xl">
                                Update Avatar
                            </h2>
                            <button
                                onClick={() => setUploadingStart(false)}
 className="mr-4 bg-gray-200 px-4 py-1 rounded-box-sm"
                            >
                                Exit
                            </button>
                        </div>
                        {user?.role == 1 && (
                            <p className=" text-yellow-600">
                                Your Profile picture must match the person in
                                the ID verification which is the next step, if
                                it doesn’t your account will be blocked and the
                                user banned.
                            </p>
                        )}
                        <UpdateAvatar
                            type="avatar"
                            getImageUID={getImageUID}
                            text={
                                <>
                                    {" "}
                                    <button className="editbtn">
                                        <img src={editicon} alt="img" />
                                    </button>
                                </>
                            }
                        />
                    </div>
                ) : (
                    ""
                )}

                {CoverUploadingStart ? (
                    <div className="py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="py-2 pb-0 font-gulfs uppercase text-xl">
                                Update Cover
                            </h2>
                            <button
                                type="button"
                                onClick={() => setCoverUploadingStart(false)}
 className="mr-4 mt-4 bg-gray-200 px-4 py-1 rounded-box-sm"
                            >
                                Exit
                            </button>
                        </div>
                        <UpdateAvatar
                            type="cover"
                            getImageUID={getCoverUID}
                            text={
                                <>
                                    {" "}
                                    <button type="button" className="editbtn">
                                        {" "}
                                        <img src={editicon} alt="img" />{" "}
                                    </button>{" "}
                                </>
                            }
                        />

                        <CoverBannerPicker
                            selected={data?.cover?.uuid ?? user?.cover}
                            onSelect={getCoverUID}
                        />
                    </div>
                ) : (
                    ""
                )}

                {UploadingStart || CoverUploadingStart ? (
                    ""
                ) : (
                    <>
                        {renderTabs()}

                        <form onSubmit={updateProfile} className="flex flex-col">
                            {/* ⚠️ Read straight off the page props rather than
                                taken as a prop: this form is embedded in five
                                different parents, and threading it through each
                                is five chances for one of them to forget. Absent
                                on a page that does not send it, so it renders
                                nothing rather than guessing. */}
                            <PendingChangesNotice
                                assets={pageProps?.pending_profile_changes}
                                className="mt-6"
                            />
                            {/* Merging the two tabs left the photos block running
                                straight into "Display Name" with nothing between
                                them, so the page read as one undifferentiated
                                scroll. A rule and a heading say where one job
                                ends and the next begins. */}
                            <div
                                className={
                                    activeTab === "profile" ? "block" : "hidden"
                                }
                            >
 <h3 className="mb-4 mt-8 border-t border-black/10 pt-8 text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                                    Your details
                                </h3>
                                <ul>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Display Name
                                        </label>
                                        <input
                                            onBlur={IsProfileChannged}
                                            type="text"
                                            name="name"
                                            defaultValue={user?.name || ""}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
 className="w-full border-gray-300 border px-4 py-3 rounded-box-sm focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
                                            placeholder="Your Name"
                                        />
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            onBlur={IsProfileChannged}
                                            defaultValue={user?.username || ""}
                                            onChange={(e) =>
                                                setData(
                                                    "username",
                                                    e.target.value,
                                                )
                                            }
                                            type="text"
                                            name="username"
 className="w-full border-gray-300 border px-4 py-3 rounded-box-sm focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
                                            placeholder="spennypiggy.co/username"
                                            onKeyUp={(e) => {
                                                setUsername(e.target.value);
                                            }}
                                        />
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            onBlur={IsProfileChannged}
                                            type="email"
                                            name="email"
                                            defaultValue={user?.email || ""}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
 className="w-full border-gray-300 border px-4 py-3 rounded-box-sm focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
                                            placeholder="your@email.com"
                                        />
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Gender
                                        </label>

                                        <div className="relative">
                                            <select
                                                className="
                                                    w-full
                                                    border border-gray-300
                                                    px-4 py-3 pr-12
 rounded-box-sm
                                                    focus:outline-none
                                                    focus:border-[#FF007F]
                                                    focus:ring-1
                                                    focus:ring-pink-500
                                                    bg-white
                                                    appearance-none
                                                    cursor-pointer
                                                "
                                                value={data.gender}
                                                onChange={(e) =>
                                                    setData(
                                                        "gender",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="" disabled>
                                                    Select Gender
                                                </option>
                                                <option value="he">He</option>
                                                <option value="she">She</option>
                                                <option value="they">
                                                    They
                                                </option>
                                            </select>

                                            {/* Custom Dropdown Icon */}
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                <svg
 className="w-5 h-5 text-black/60"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date of Birth (for milestone & birthday rewards)
                                        </label>
                                        <input
                                            type="date"
 className="w-full border border-gray-300 px-4 py-3 rounded-box-sm focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 bg-white"
                                            value={data.date_of_birth}
                                            onChange={(e) => setData("date_of_birth", e.target.value)}
                                        />
                                        {errors.date_of_birth && (
                                            <span className="text-xs text-red-500 mt-1 block">{errors.date_of_birth}</span>
                                        )}
                                    </li>
                                    <li className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Bio
                                            </label>
                                            {user?.bio &&
                                                user?.bio_approved === 0 && (
                                                    <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200">
                                                        Pending Approval
                                                    </span>
                                                )}
                                            {user?.bio &&
                                                user?.bio_approved === 1 && (
                                                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                                                        Approved
                                                    </span>
                                                )}
                                            {user?.bio &&
                                                user?.bio_approved === 2 && (
                                                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                                                        Rejected
                                                    </span>
                                                )}
                                        </div>
                                        {user?.bio_approved === 2 &&
                                            user?.edit_bio_reason && (
 <div className="mb-2 text-sm text-red-600 bg-red-50 p-3 rounded-box-sm border border-red-200">
                                                    <span className="font-bold">
                                                        Rejection Reason:
                                                    </span>{" "}
                                                    {user.edit_bio_reason}
                                                </div>
                                            )}
                                        <textarea
                                            onBlur={IsProfileChannged}
                                            defaultValue={user?.bio || ""}
                                            onChange={(e) =>
                                                setData("bio", e.target.value)
                                            }
                                            name="bio"
 className="w-full border-gray-300 border p-4 rounded-box-sm focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 min-h-[120px]"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </li>
                                    <li className="mb-4">
 <div className="p-3 bg-gray-50 rounded-box-sm border border-gray-200">
                                            <strong className="block text-sm text-gray-600 mb-1">
                                                Profile URL
                                            </strong>
                                            <div className="text-[#FF007F] font-medium break-all">
                                                {typeof window !== "undefined"
                                                    ? `https://spennypiggy.co/${username}`
                                                    : ""}
                                            </div>
                                        </div>
                                    </li>

                                    <li className="mb-4">
                                        <Link
                                            href={route("account.2fa")}
 className="flex items-center justify-between p-4 bg-gray-50 rounded-box-sm border border-gray-200 hover:bg-gray-100 transition-colors w-full text-left"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-gray-800">
                                                        Multi-Step Verification
                                                    </h4>
                                                    {user?.is_2fa == 1 && (
                                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">
                                                            Enabled
                                                        </span>
                                                    )}
                                                </div>
 <p className="text-xs text-black/60 mt-1">
                                                    Add an extra layer of
                                                    security to your account
                                                </p>
                                            </div>
                                            <div className="bg-white p-2 rounded-full border border-gray-200">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
 className="h-5 w-5 text-black/60"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* ⚠️ `order-first`, not a code move. This block is
                                ~110 lines of upload wiring and cutting/pasting it
                                above the fields is the kind of edit that silently
                                drops a handler; the form is a flex column, so the
                                order is expressed where it is read. */}
                            <div
                                className={
                                    activeTab === "profile"
                                        ? "order-first block"
                                        : "hidden"
                                }
                            >
 <h3 className="mb-4 text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                                    How your profile looks
                                </h3>
                                <div className="mainprofile mb-8 relative w-full">
                                    <div className="profilePhotoImg cover group relative">
                                        <img
                                            src={
                                                coverImage
                                                    ? coverImage
                                                    : user?.cover_url ||
                                                      coverimage
                                            }
                                            alt="Cover"
 className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90 !rounded-box "
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCoverUploadingStart(true)
                                            }
 className="w-fit absolute top-4 right-4 bg-white hover:bg-gray-200 transition-all z-10 px-4 py-2 rounded-box-sm !text-sm"
                                        >
                                            Edit Cover Photo
                                        </button>
                                    </div>
                                    <div className="flex justify-center mt-[-70px]">
 <div className="w-[120px] h-[120px] dp group relative !border-3 !border-green-400 !rounded-box overflow-hidden">
                                            <img
                                                src={
                                                    profileDP
                                                        ? profileDP
                                                        : user?.avatar_url ||
                                                          userdefaultphoto
                                                }
                                                alt="Avatar"
                                                className="w-full h-full object-cover "
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUploadingStart(true)
                                                }
 className="editbtn absolute bottom-[5px] right-0 bg-white rounded-full hover:bg-gray-100 transition-all z-10"
                                            >
                                                <img
                                                    src={editicon}
                                                    alt="Edit"
                                                    className=""
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* mt-8, not mt-16: this card used to be the last
                                    thing on its own tab, so a large gap above it
                                    separated it from nothing. It now has fields
                                    beneath it and the outsized margin read as a
                                    broken layout. */}
                                {user?.role == 1 && (
                                    <div className="bg-gray-50 p-6 rounded-box border border-gray-200 mt-8 text-center">
                                        <h4 className="text-lg font-gulfs uppercase text-gray-800 mb-2">
                                            Social Media Banner
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Generate a promotional banner to
                                            share your profile on social media
                                            platforms like Twitter, Facebook,
                                            and Instagram.
                                        </p>

                                        {currentSocialBanner && (
                                            <div className="mb-4 relative group">
 <div className="border-4 border-white rounded-box-sm overflow-hidden mx-auto max-w-md">
                                                    <img
                                                        src={
                                                            currentSocialBanner ||
                                                            auth?.user
                                                                ?.social_url
                                                        }
                                                        alt="Social Media Banner"
                                                        className="w-full h-auto"
                                                    />
                                                </div>
 <p className="text-xs text-black/60 mt-2">
                                                    Right-click image to save
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={generateSocialImage}
                                            disabled={
                                                generatingBanner ||
                                                (!localAvatar && !user?.avatar)
                                            }
 className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium transform transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generatingBanner
                                                ? "Generating..."
                                                : currentSocialBanner
                                                  ? "Regenerate Banner"
                                                  : "Generate Banner"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                className={
                                    activeTab === "settings"
                                        ? "block"
                                        : "hidden"
                                }
                            >
                                <ul>
                                    {user?.role === 1 && (
                                        <>
                                            <li className="mb-6">
                                                <label className="block !text-lg font-medium !text-black mb-3">
                                                    Profile Tags (Creator)
                                                </label>
                                                <div className="flex flex-wrap gap-3">
                                                    {creatortypes.map(
                                                        (s, index) => {
                                                            const isSelected =
                                                                profileTags.includes(
                                                                    s.value,
                                                                );
                                                            return (
                                                                <div
                                                                    key={
                                                                        s.value
                                                                    }
                                                                    className="relative"
                                                                >
                                                                    <input
                                                                        id={`types-${index}`}
                                                                        type="checkbox"
                                                                        value={
                                                                            s.value
                                                                        }
                                                                        className="hidden"
                                                                        onChange={
                                                                            handleProfileTags
                                                                        }
                                                                        checked={
                                                                            isSelected
                                                                        }
                                                                    />
                                                                    <label
                                                                        htmlFor={`types-${index}`}
 className={`block px-4 py-2 text-normal rounded-full font-medium cursor-pointer min-w-[50px] !text-center transition-all duration-300 border 
                                                                        ${
                                                                            isSelected
 ? "bg-pink-600 border-[#FF007F] !text-white "
                                                                                : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-50"
                                                                        }`}
                                                                    >
                                                                        {
                                                                            s.label
                                                                        }
                                                                    </label>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </li>

                                            {/* <li className="mb-6">
                                                <label className="block text-normal font-medium !text-black mb-2">Minimum Treat Amount</label>
                                                <div className="relative">
 <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/60 font-medium">
                                                        {global_currency?.symbol || '£'}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        name="min_surprise_amount"
                                                        defaultValue={user?.min_surprise_amount || ''}
                                                        onChange={(e) => setData('min_surprise_amount', e.target.value)}
 className="w-full border-gray-300 border pl-10 pr-4 py-[10px] rounded-box-sm focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500" 
                                                        placeholder="0.00"
                                                    />
                                                </div>
 <p className="text-xs text-black/60 mt-1">
                                                    Minimum amount supporters must spend on a treat.
                                                </p>
                                            </li> */}
                                        </>
                                    )}

                                    <li className="mb-4">
                                        <ManagePasskey email={user?.email} />
                                    </li>

                                    <li className="mb-4">
 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-box-sm border border-gray-200">
                                            <div>
                                                <h4 className="font-medium text-gray-800">
 Earnings on profile
                                                </h4>
 <p className="text-xs text-black/60 mt-1">
 Show your total earned to
 visitors. Off, they still
 see your milestone progress
 — just not the amount.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={piggyBankEnabled}
                                                onChange={togglePiggyBank}
                                                className={`${
                                                    piggyBankEnabled
                                                        ? "bg-pink-600"
                                                        : "bg-gray-300"
                                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                                            >
                                                <span
                                                    className={`${
                                                        piggyBankEnabled
                                                            ? "translate-x-6"
                                                            : "translate-x-1"
                                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                />
                                            </Switch>
                                        </div>
                                    </li>

                                    <li className="mb-4">
 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-box-sm border border-gray-200">
                                            <div>
                                                <h4 className="font-medium text-gray-800">
                                                    Email Notifications
                                                </h4>
 <p className="text-xs text-black/60 mt-1">
                                                    Receive updates about your
                                                    account via email
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notificationsEnabled}
                                                onChange={toggleNotifications}
                                                className={`${
                                                    notificationsEnabled
                                                        ? "bg-pink-600"
                                                        : "bg-gray-300"
                                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                                            >
                                                <span
                                                    className={`${
                                                        notificationsEnabled
                                                            ? "translate-x-6"
                                                            : "translate-x-1"
                                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                />
                                            </Switch>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8 pb-8 pt-4 flex gap-4 items-center">
                                <button
                                    type="button"
                                    onClick={() => setClose(false)}
 className="w-full rounded-box-sm bg-gray-200 border-[3px]
                                    border-black font-black uppercase tracking-widest block p-[10px]
                                    hover:bg-gray-300 transition-colors
 
                                    hover:translate-x-[-2px] hover:translate-y-[-2px]
 !text-sm"
                                >
                                    Cancel
                                </button>
                                <LoaderButton
                                    type="submit"
                                    disabled={processing}
 className="w-full rounded-box-sm bg-yellow-300 
                                    border-[3px] border-black font-black
                                    uppercase font-poppins tracking-widest block p-[10px] hover:bg-yellow-400
                                    transition-colors font-bold !mt-0 !text-sm
 
                                    hover:translate-x-[-2px] hover:translate-y-[-2px]
 !text-black "
                                    spinnerclass="fill-black"
                                >
                                    {loading || processing
                                        ? "Saving..."
                                        : "Save Changes"}
                                </LoaderButton>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </Popup>
    );
}
