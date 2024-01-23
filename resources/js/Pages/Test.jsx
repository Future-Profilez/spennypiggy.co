<<<<<<< HEAD
  import axios from 'axios';
import MembershipsLists from './membership/MembershipsLists';
import AddMembership from './membership/AddMembership'; 
  
  export default function Test() {
  
    const file = {
      "uuid": "5360fd62-eb19-4ac8-91b8-528c08a2e79b",
      "name": "c3.png",
      "size": 415841,
      "isStored": true,
      "isImage": true,
      "mimeType": "image/png",
      "cdnUrl": "https://ucarecdn.com/5360fd62-eb19-4ac8-91b8-528c08a2e79b/-/crop/352x348/192,0/-/preview/",
      "s3Url": null,
      "originalFilename": "c3.png",
      "imageInfo": {
        "dpi": [
          72,
          72
        ],
        "width": 700,
        "format": "PNG",
        "height": 460,
        "sequence": false,
        "colorMode": "RGBA",
        "orientation": null,
        "geoLocation": null,
        "datetimeOriginal": null
      },
      "videoInfo": null,
      "contentInfo": {
        "mime": {
          "mime": "image/png",
          "type": "image",
          "subtype": "png"
        },
        "image": {
          "dpi": [
            72,
            72
          ],
          "width": 700,
          "format": "PNG",
          "height": 460,
          "sequence": false,
          "colorMode": "RGBA",
          "orientation": null,
          "geoLocation": null,
          "datetimeOriginal": null
        }
      },
      "metadata": {},
      "s3Bucket": null,
      "defaultEffects": null,
      "cdnUrlModifiers": "-/crop/352x348/192,0/"
    }
    const post = () => { 
      axios.post(`say-thankyou/${payment_id}`, 
      { "messages":message,
        "message_media": file
      }
      ).then(resp => {
           console.log("resp", resp)
      }).catch(_err => {
          console.error("error", _err);
      });
    }
=======
import axios from "axios";
import MembershipsLists from "./membership/MembershipsLists";
import AddMembership from "./membership/AddMembership";
>>>>>>> 143b4ccaeb190c655009b335aa0805d9d866880e

export default function Test() {
    const file = {
        uuid: "5360fd62-eb19-4ac8-91b8-528c08a2e79b",
        name: "c3.png",
        size: 415841,
        isStored: true,
        isImage: true,
        mimeType: "image/png",
        cdnUrl: "https://ucarecdn.com/5360fd62-eb19-4ac8-91b8-528c08a2e79b/-/crop/352x348/192,0/-/preview/",
        s3Url: null,
        originalFilename: "c3.png",
        imageInfo: {
            dpi: [72, 72],
            width: 700,
            format: "PNG",
            height: 460,
            sequence: false,
            colorMode: "RGBA",
            orientation: null,
            geoLocation: null,
            datetimeOriginal: null,
        },
        videoInfo: null,
        contentInfo: {
            mime: {
                mime: "image/png",
                type: "image",
                subtype: "png",
            },
            image: {
                dpi: [72, 72],
                width: 700,
                format: "PNG",
                height: 460,
                sequence: false,
                colorMode: "RGBA",
                orientation: null,
                geoLocation: null,
                datetimeOriginal: null,
            },
        },
        metadata: {},
        s3Bucket: null,
        defaultEffects: null,
        cdnUrlModifiers: "-/crop/352x348/192,0/",
    };
    const post = () => {
        axios
            .post(`/membership/save`, {
                level: "bronze_level",
                month_price: 50.0,
                rewards: [
                    "green_circle_insta",
                    "insta_broadcast",
                    "telegram_group",
                    "monthly_content_bundle",
                    "weekly_DM_chat",
                ],
                thumbnail: file,
            })
            .then((resp) => {
                console.log("resp", resp);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const get = () => {
        axios
            .get(`/memberships/test`)
            .then((resp) => {
                console.log("resp", resp);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    return (
        <>
            <button onClick={get}>Test Get Request</button>
            <button onClick={post}>Test Post Request</button>

            <AddMembership />
            <MembershipsLists />
        </>
    );
}
