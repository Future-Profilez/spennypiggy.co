import Nocontent from "@/includes/Nocontent";
import Popup from "@/Components/Popup";
import axios from "axios";
import { useEffect, useState } from "react";

export default function GifterMedia({ username }) {
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState([]);

  const fetch_items = async () => {
    setLoading(true);
    axios
      .get(`/gifter-content/${username}`)
      .then((resp) => {
        setLoading(false);
        setMedia(resp.data.items || []);
      })
      .catch((_err) => {
        console.error("error", _err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch_items();
  }, []);

  const ItemCard = ({ item }) => {
    const deriveType = () => {
      if (item.type) return item.type;
      const path = (() => { try { return new URL(item.url).pathname; } catch { return item.url || ''; } })();
      const ext = path.split('.').pop().toLowerCase();
      if (["jpg","jpeg","png","gif","webp","svg"].includes(ext) || item.url.includes("/format/jpeg")) return "image";
      if (["mp4","webm","mov","avi"].includes(ext)) return "video";
      return "doc";
    };
    const type = deriveType();
    const isImage = type === "image";
    const isVideo = type === "video";
    return (
      <div className="w-full md:w-[calc(100%/2-11px)] lg:w-[calc(100%/3-1.2rem)] my-4">
        <div className="rounded-[40px]  overflow-hidden bg-gray-100 border-2 border-black shadow-pink">
          {isImage ? (
            <button onClick={() => openViewer(item)} className="w-full aspect-video relative">
              <img src={item.url} className="w-full h-full object-cover" alt={item.title || ""} />
              <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">Image</span>
            </button>
          ) : isVideo ? (
            <button onClick={() => openViewer(item)} className="w-full aspect-video relative">
              <video src={item.url} className="w-full h-full object-cover" muted />
              <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">Video</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white/70 rounded-full p-3 border-2 border-black">▶</span>
              </span>
            </button>
          ) : (
            <button onClick={() => openViewer(item)} className="w-full p-6 flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-10 h-10 rounded bg-pink-100 border-2 border-black mr-3 flex items-center justify-center">📄</span>
                <span className="text-pink-600">Open File</span>
              </span>
              <span className="text-xs px-2 py-1 bg-black text-white rounded">Document</span>
            </button>
          )}
        </div>
        <div className="mt-2">
          <h2 className="text-sm text-gray-300">{item.title || "Content"}</h2>
          {item.owner?.username ? (
            <p className="text-xs text-gray-500">@{item.owner.username}</p>
          ) : null}
        </div>
      </div>
    );
  };

  const [viewerItem, setViewerItem] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const openViewer = (item) => {
    setViewerItem(item);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="my-4 md:my-10 flex gap-6 flex-wrap">
        {loading && media.length === 0 ? (
          <div className="w-full m-auto"><Nocontent text="Loading..." /></div>
        ) : media && media.length ? (
          media.map((itm, i) => <ItemCard key={`media-${i}`} item={itm} />)
        ) : (
          <div className="w-full m-auto"><Nocontent text="No Posts to see" /></div>
        )}
      </div>
      {viewerItem && (
        <Popup action={viewerOpen} size="xl" bodyclass="!p-0" space={0} hidecontrols={true} fullscreen={true} classes="hidden" text="">
          <div className="w-screen max-w-[90vw] h-screen max-h-[85vh] bg-black flex items-center justify-center">
            {viewerItem.type === 'image' ? (
              <img src={viewerItem.url} alt={viewerItem.title || ''} className="max-w-full max-h-full object-contain" />
            ) : viewerItem.type === 'video' ? (
              <video src={viewerItem.url} controls autoPlay className="max-w-full max-h-full" />
            ) : (
              <iframe src={viewerItem.url} className="w-full h-full" />
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
