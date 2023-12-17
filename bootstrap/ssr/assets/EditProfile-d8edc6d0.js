import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as userphoto } from "./userphoto-76727e42.js";
import { w as wishlistbannerimg } from "./wishlistbannerimg-66b5ad17.js";
import Popup from "./Popup-7b8a2e20.js";
import { useForm } from "@inertiajs/react";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import UpdateAvatar from "./UpdateAvatar-74e2dabd.js";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import "react-bootstrap/Modal";
import "react-hot-toast";
import "./uploader.module-d5dbf507.js";
import "@uploadcare/blocks";
const editicon = "/build/assets/editicon-50f94eed.png";
function EditProfile({ user }) {
  const [close, setClose] = useState();
  const { successAlert, errorAlert } = useAlerts();
  const [profileDP, setProfileDP] = useState();
  const [coverImage, setCoverImage] = useState();
  const getImageUID = (e) => {
    setData("avatar", e.uuid);
    setProfileDP(e.cdnUrl);
  };
  const getCoverUID = (e) => {
    setCoverImage(e.cdnUrl);
    setData("cover", e.uuid);
  };
  const [username, setUsername] = useState(user == null ? void 0 : user.username);
  const { data, setData, post, processing, errors, reset } = useForm({
    name: (user == null ? void 0 : user.name) || "",
    username: (user == null ? void 0 : user.username) || "",
    bio: (user == null ? void 0 : user.bio) || "",
    avatar: (user == null ? void 0 : user.avatar) || "",
    cover: (user == null ? void 0 : user.cover) || ""
  });
  const updateProfile = (e) => {
    e.preventDefault();
    post(route("edit-profile"), {
      preserveScroll: true,
      onSuccess: (resp) => {
        var _a, _b, _c, _d;
        setClose(false);
        setTimeout(() => {
          setClose();
        }, 1e3);
        if ((_a = resp.props.flash) == null ? void 0 : _a.success) {
          successAlert(((_b = resp.props.flash) == null ? void 0 : _b.success) || "Updated successfully.");
        }
        if ((_c = resp.props.flash) == null ? void 0 : _c.error) {
          errorAlert(((_d = resp.props.flash) == null ? void 0 : _d.error) || "Something went wrong.");
        }
      },
      onError: (_err) => {
        console.error(`errors:`);
        console.table(_err);
        if (_err.username) {
          errorAlert(_err.username || "Something went wrong.");
        }
      }
    });
  };
  return /* @__PURE__ */ jsxs(
    Popup,
    {
      modalclass: "pinkmodal editprofile",
      size: "md",
      action: close,
      text: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M11 5.00001H6C5.46957 5.00001 4.96086 5.21072 4.58579 5.5858C4.21071 5.96087 4 6.46958 4 7.00001V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H17C17.5304 20 18.0391 19.7893 18.4142 19.4142C18.7893 19.0391 19 18.5304 19 18V13M17.586 3.58601C17.7705 3.39499 17.9912 3.24262 18.2352 3.13781C18.4792 3.03299 18.7416 2.97782 19.0072 2.97551C19.2728 2.9732 19.5361 3.0238 19.7819 3.12437C20.0277 3.22493 20.251 3.37343 20.4388 3.56122C20.6266 3.74901 20.7751 3.97231 20.8756 4.2181C20.9762 4.46389 21.0268 4.72725 21.0245 4.99281C21.0222 5.25837 20.967 5.52081 20.8622 5.76482C20.7574 6.00883 20.605 6.22952 20.414 6.41401L11.828 15H9V12.172L17.586 3.58601Z", stroke: "#5D25FD", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
        " Update Profile "
      ] }),
      classes: " editProfile w-full flex",
      children: [
        /* @__PURE__ */ jsx("div", { className: "editprofileHead", children: /* @__PURE__ */ jsx("h2", { children: "Edit your Profile" }) }),
        /* @__PURE__ */ jsxs("div", { className: "editForm", children: [
          /* @__PURE__ */ jsxs("div", { className: "mainprofile mb-5 position-relative w-100 ", children: [
            /* @__PURE__ */ jsxs("div", { className: "profilePhotoImg cover", children: [
              /* @__PURE__ */ jsx("img", { src: coverImage ? coverImage : (user == null ? void 0 : user.cover_url) || wishlistbannerimg, alt: "img" }),
              /* @__PURE__ */ jsx(
                UpdateAvatar,
                {
                  type: "cover",
                  getImageUID: getCoverUID,
                  text: /* @__PURE__ */ jsxs(Fragment, { children: [
                    " ",
                    /* @__PURE__ */ jsxs("button", { className: "editbtn", children: [
                      " ",
                      /* @__PURE__ */ jsx("img", { src: editicon, alt: "img" }),
                      " "
                    ] }),
                    " "
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "profilePhotoImg dp", children: [
              /* @__PURE__ */ jsx("img", { src: profileDP ? profileDP : (user == null ? void 0 : user.avatar_url) || userphoto, alt: "img" }),
              /* @__PURE__ */ jsx(UpdateAvatar, { type: "avatar", getImageUID, text: /* @__PURE__ */ jsxs(Fragment, { children: [
                " ",
                /* @__PURE__ */ jsx("button", { className: "editbtn", children: /* @__PURE__ */ jsx("img", { src: editicon, alt: "img" }) })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: updateProfile, children: [
            /* @__PURE__ */ jsxs("ul", { children: [
              /* @__PURE__ */ jsxs("li", { className: "mb-3", children: [
                /* @__PURE__ */ jsx("label", { className: "mb-1", children: "Display Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    name: "name",
                    defaultValue: (user == null ? void 0 : user.name) || "",
                    onChange: (e) => setData("name", e.target.value),
                    className: "form-input px-2 py-2 border w-full rounded-md"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("li", { className: "mb-2", children: [
                /* @__PURE__ */ jsx("label", { className: "mb-1", children: "Username" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    defaultValue: (user == null ? void 0 : user.username) || "",
                    onChange: (e) => setData("username", e.target.value),
                    type: "text",
                    name: "username",
                    className: "form-input px-2 py-2 border w-full rounded-md",
                    placeholder: "Spennypiggy.com/warner99",
                    onKeyUp: (e) => {
                      setUsername(e.target.value);
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("strong", { className: "d-block text-start mb-4", children: [
                "Profile URL : https://www.spennypiggy.co/",
                username
              ] }) }),
              /* @__PURE__ */ jsxs("li", { className: "mb-3", children: [
                /* @__PURE__ */ jsx("label", { className: "mb-1", children: "Bio" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    defaultValue: (user == null ? void 0 : user.bio) || "",
                    onChange: (e) => setData("bio", e.target.value),
                    name: "bio",
                    className: "form-input px-2 py-2 border w-full rounded-md",
                    placeholder: "Bio"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: " text-center mb-7", children: /* @__PURE__ */ jsx(
              LoaderButton,
              {
                type: "submit",
                disabled: processing,
                className: "btn-pink lg m-auto",
                spinnerClassName: "fill-red-600",
                children: processing ? "Updating" : "Update Profile"
              }
            ) })
          ] })
        ] })
      ]
    }
  );
}
export {
  EditProfile as default
};
