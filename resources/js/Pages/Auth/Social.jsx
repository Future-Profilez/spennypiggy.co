import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import Popup from "@/Components/Popup";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";

const regexValidators = {
  twitter: /^@?(\w){1,15}$/,
  instagram: /^@?([a-zA-Z0-9._]){1,30}$/,
  facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9_.-]+$/,
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
  twitch: /^(https?:\/\/)?(www\.)?twitch\.tv\/[A-Za-z0-9_]+$/,
  tumblr: /^@?([a-zA-Z0-9-]){1,32}$/,
  discord: /^.{3,32}#[0-9]{4}$/
};

const validateField = (name, value) => {
  const regex = regexValidators[name];
  if (!value) return ""; // no error for empty field
  if (regex && !regex.test(value.trim())) {
    return `Invalid ${name} format.`;
  }
  return "";
};

export default function AddSocial({ removetext, openSocial, sLinks, type, redirect_url }) {
  const { auth } = usePage().props;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [close, setClose] = useState();
  const [loading, setloading] = useState(false);

  const [data, setData] = useState({
    instagram: sLinks?.instagram || "",
    discord: sLinks?.discord || "",
    facebook: sLinks?.facebook || "",
    youtube: sLinks?.youtube || "",
    twitch: sLinks?.twitch || "",
    tumblr: sLinks?.tumblr || "",
    twitter: sLinks?.twitter || "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (openSocial === "open") {
      setClose(true);
    }
  }, [openSocial]);

  useEffect(() => {
    if (!sLinks) {
      setData({
        instagram: "",
        discord: "",
        facebook: "",
        youtube: "",
        twitch: "",
        tumblr: "",
        twitter: "",
      });
    }
  }, [sLinks]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const isFormValid = () => {
    const hasAnyFilled = Object.values(data).some(val => val.trim() !== "");
    const hasError = Object.values(errors).some(err => err);
    return hasAnyFilled && !hasError;
  };
  const isValid = isFormValid();
  const createSocial = (e) => {
    e.preventDefault();
    const isValid = isFormValid();
    if(!isValid) {
      errorAlert("Please fill at least one social link correctly.");
      return false;
    }
    e.preventDefault();
    setloading(true);
    axios.post(route("save_social_links"), {
      ...data,
      redirect_url
    })
      .then((res) => {
        setloading(false);
        if (res.data.status) {
          successAlert(res.data.message || "Updated successfully.");
          setClose(false);
          router.visit(route("user.show", auth?.user?.username), {
            preserveScroll: true,
          });
          setTimeout(() => {
            setClose();
          }, 1000);
        } else {
          errorAlert(res.data.msg);
        }
      })
      .catch((err) => {
        setloading(false);
        errorsHandling(err);
      });
  };

  return (
    <Popup
      action={close}
      space="4"
      modalclassName="pinkmodal full"
      size="md"
      classes=""
      text={removetext ? "" : "Add Socials"}
    >
      <div className="editprofileModalInner">
        <div className="swishinfo">
          <h2 className="pb-4 font-GillSans text-xl text-uppercase">
            Social Links
          </h2>

          {!isValid?  <p className="text-red-500 mb-4">
              Please add at least one social media handle. This is required to verify your account.
            </p> : ''}

          <form onSubmit={createSocial}>
            <ul className="ps-0 row">
              {[
                { name: "twitter", label: "X (Twitter)", placeholder: "@username" },
                { name: "instagram", label: "Instagram", placeholder: "@username" },
                { name: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
                { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/yourchannel" },
                { name: "twitch", label: "Twitch", placeholder: "https://twitch.tv/yourchannel" },
                { name: "tumblr", label: "Tumblr", placeholder: "@yourname" },
                { name: "discord", label: "Discord", placeholder: "Username#1234" },
              ].map((field, idx) => (
                <li className={`mb-4 ${idx < 2 ? "col-md-6" : "col-md-12"}`} key={field.name}>
                  <label htmlFor={field.name} className="mb-2 text-start d-block">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={data[field.name]}
                    placeholder={field.placeholder}
                    className={`form-input px-2 py-2 border w-full rounded-md ${errors[field.name] ? "border-red-500" : "border-gray-300"}`}
                    onChange={handleInput}
                  />
                  {errors[field.name] && (
                    <p className="text-sm text-red-500 mt-1">{errors[field.name]}</p>
                  )}
                </li>
              ))}
            </ul>

            <LoaderButton
              disabled={loading  }
              type="submit"
              className="flex button sm w-100 justify-content-center p-3 text-center mx-auto"
              spinnerClassName="fill-red-600"
            >
              {loading ? "Processing" : "Add Social Links"}
            </LoaderButton>
          </form>
        </div>
      </div>
    </Popup>
  );
}
