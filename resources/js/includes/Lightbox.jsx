import React, { useState } from "react";

const Lightbox = ({ images, text, classes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const openLightbox = () => {
    setSelectedImage(!selectedImage);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setSelectedImage(false);
    setIsOpen(false);
  };

  return (
    <>
    <style>{`
    .lightbox-overlay {
      background: #000000b5;
      position: fixed;
      z-index: 99;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
  }

  button.closelightbox{position:absolute;top:-27px;right:-17px;z-index:11;color:#fff;font-size:29px;
    background:#1c1c1c;width:42px;height:39px;line-height:36px;border-radius:10px;}
    .lightbox-content iframe {
      min-height: 396px;
      width: 700px;
  }
  .lightbox-content {
    position: relative; max-width: 700px;
    width: 100%;
    
}

@media(max-width:767px){
  .lightbox-content iframe {
    min-height: 396px;
    width: 100%;
}
button.closelightbox {
  top: 20px;
  position: fixed;
  right: 20px;
}
}


  `}</style>
    <div>
      <button className={classes} onClick={() => openLightbox(images[0])}>{text}</button>
      {isOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content p-3">
            <iframe src="https://player.vimeo.com/video/892796707?h=d636ff2918"   frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
            <button className="closelightbox" onClick={closeLightbox} >&times;</button>
          </div> 
        </div>
      )}
    </div>
    </>
  );
};

export default Lightbox;
