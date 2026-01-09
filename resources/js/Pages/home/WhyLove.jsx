import { LazyLoadImage } from "react-lazy-load-image-component";
// import image1 from "../../../assets/fea/1.png";
// import image2 from "../../../assets/fea/2.png";
// import image3 from "../../../assets/fea/3.png";
// import image4 from "../../../assets/fea/4.png";
// import image5 from "../../../assets/fea/5.png";
// import image6 from "../../../assets/fea/6.png";
// import image7 from "../../../assets/fea/7.png";
// import image8 from "../../../assets/fea/8.png";
// import image9 from "../../../assets/fea/9.png";
// import image11 from "../../../assets/fea/11.png";
// import image12 from "../../../assets/fea/12.png";
// import image13 from "../../../assets/fea/13.png";
// import cc from "../../../assets/fea/cc.png";
import amazon from "../../../assets/new/amazon.png";
import nike from "../../../assets/new/nike.png";
import uniqlo from "../../../assets/new/uniqlo.png";
import beauty from "../../../assets/new/beauty.png";
import apple from "../../../assets/new/apple.png";
import kylie from "../../../assets/new/kylie.png";
import asos from "../../../assets/new/asos.png";
import nova from "../../../assets/new/nova.png";
import other from "../../../assets/new/other.png";
import alo from "../../../assets/new/alo.png";
import huel from "../../../assets/new/huel.png";


export default function WhyLove() {
    const brandLogos = [
      { name: "Amazon", src: amazon },
      { name: "Nike", src: nike },
      { name: "Uniqlo", src: uniqlo },
      { name: "Fenty", src: beauty },
      { name: "Apple", src: apple },
      { name: "Kylie", src: kylie },
      { name: "Asos", src: asos },
      { name: "Fashion Nova", src: nova },
      { name: "Sephora", src: other },
      { name: "Alo", src: alo },
      { name: "Huel", src: huel },
    ];

    return (
        <>
            <section className="bg-black py-24 relative overflow-hidden">
                 {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse"></div>
                </div>

                <div className="container relative z-10 px-4 mx-auto">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-none">
                        Add Gifts From <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Any Brand</span>
                    </h2>
                    <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto font-poppins leading-relaxed mb-16 text-center">
                        With Spenny Piggy, you can seamlessly add gifts from any
                        brand to your Wishlist, offering your supporters a diverse
                        range of options to choose from. All you need is a link! You
                        can add items from our Gift Store showcasing our partner
                        brands, or any other online store on Shopify or Amazon.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6">
                      {brandLogos.map((brand, index) => (
                         <div key={index} className="group relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-4 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] border-4 border-transparent hover:border-pink-500">
                           <img
                             src={brand.src}
                             alt={brand.name}
                             className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                           />
                       </div>
                      ))}
                    </div>
                </div>
            </section>
        </>
    );
}
