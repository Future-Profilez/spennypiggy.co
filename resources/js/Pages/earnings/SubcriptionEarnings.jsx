import * as React from "react";


export default function SubcriptionEarnings() {
  function WishItem({ imageSrc, wishName, price }) {
    return (
      <div className="flex gap-5 justify-between pr-5 py-3 max-w-full border-b border-gray-150 ">
        <div className="flex gap-4">
          <img src={imageSrc} alt={`Image of ${wishName}`} className="shrink-0 w-12 aspect-square" />
          <div className="flex-auto my-auto">{wishName}</div>
        </div>
        <div className="my-auto font-bold">{price}</div>
      </div>
    );
  }
  const wishItems = [
    { imageSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/a7c47aa390f3b25226d03942160cd592056b79d558b91b3d645b2e90b39ee0f2?apiKey=51c874e18c094444aa186f1aa9325093&", wishName: "WishName #1", price: "£42.00" },
    { imageSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/ffb0dbb330158b94de141fae0669179b7db57c3fe0dd5444191cf3be4b15c208?apiKey=51c874e18c094444aa186f1aa9325093&", wishName: "WishName #2", price: "£42.00" },
    { imageSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/ccd9652ce106a6d37e0f249263ad005c1a899786282b108a1982102ff09e836f?apiKey=51c874e18c094444aa186f1aa9325093&", wishName: "WishName #3", price: "£42.00" },
    { imageSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/213fcd680cb7df002dbd0ea0f76ebcc131e59860fe6542a0cbf44504e728d4c6?apiKey=51c874e18c094444aa186f1aa9325093&", wishName: "WishName #4", price: "£42.00" },
    { imageSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/dfc1df406015c43b78dcac177e4fcc6838ce32d7fe1bf874980ee36bd52f8708?apiKey=51c874e18c094444aa186f1aa9325093&", wishName: "WishName #5", price: "£42.00" },
  ];

  return (
    <section className="bg-white rounded-3xl shadow-2xl ">
      <h2 className="w-full uppercase p-4 border-b border-gray-200 font-bold">Top Wishes Subscription</h2>

      <div className="p-4" >
        {wishItems.map((item, index) => (
          <WishItem key={index} imageSrc={item.imageSrc} wishName={item.wishName} price={item.price} />
        ))}
      </div>
    </section>
  );
}