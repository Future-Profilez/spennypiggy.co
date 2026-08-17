import { FaSquareXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import { TbBrandYoutubeFilled } from "react-icons/tb";
import { PiTwitchLogoFill } from "react-icons/pi";

export default function SocialLinks({ links }) {

    const baseUrls = {
        instagram: "https://instagram.com/",
        twitter: "https://twitter.com/",
        reddit: "",
        twitch: "",
        tumblr: "https://www.tumblr.com/",
        facebook: "",
        youtube: "",
        other: ""
    };

    const colors = {
        instagram: " border border-yellow-600 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20",
        twitter: "border border-blue-600  text-blue-500 bg-blue-500/10 hover:bg-blue-500/20",
        reddit: "border border-red-600 text-red-500 bg-red-500/10 hover:bg-red-500/20",
        twitch: "border border-purple-600 text-purple-500 bg-purple-500/10 hover:bg-purple-500/20",
        tumblr: "border border-purple-600 text-purple-500 bg-purple-500/10 hover:bg-purple-500/20",
        facebook: "border border-blue-600 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20",
        youtube: "border border-red-600 text-red-500 bg-red-500/10 hover:bg-red-500/20",
        other: "border border-gray-200 text-white bg-white/10"
    };

    const icons = {
        instagram: <RiInstagramFill className="w-6 h-6 " />,
        twitter: <FaSquareXTwitter className="w-6 h-6" />,
        youtube: <TbBrandYoutubeFilled className="w-6 h-6" />,
        twitch: <PiTwitchLogoFill className="w-6 h-6" />
    };

    function isHttpUrl(url) {
        if (!url) return false;
        return url.trim().toLowerCase().startsWith("http");
    }

    // 🔥 Create array of social items to loop through
    const socialArray = [
        { key: "instagram", label: "Instagram" },
        { key: "youtube", label: "Youtube" },
        { key: "twitter", label: "Twitter" },
        { key: "twitch", label: "Twitch" }
    ];

    return (
        <div>
            <ul className="socialmedia flex-wrap flex justify-start mt-4">


                {socialArray.map((item) => {
                    const value = links?.[item.key];
                    if (!value) return null;

                    const href = isHttpUrl(value)
                        ? value
                        : `${baseUrls[item.key]}${value}`;

                    return (
                        <li key={item.key} className="px-1 mt-1 mb-1">
                            <a
                                target="_blank"
                                title={item.label}
                                href={href}
                                className={`${colors[item.key]} p-1 rounded-box-xs   !pe-2 !text-sm flex items-center gap-1`} >
                                {icons[item.key]}
                                {item.label}
                            </a>
                        </li>
                    );
                })}

            </ul>
        </div>
    );
}
