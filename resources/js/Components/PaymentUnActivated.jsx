
export default function PaymentUnActivated({heading, subheading}) {
  return (
    <>
      <div className="w-full p-5 my-5 bg-white rounded-box py-8 md:py-16 px-8 border-2 border-black ">
          <h5 className="text-[25px] md:text-[30px] w-full font-GillSans font-normal uppercase text-yellow-500 text-center  mb-1">
             {heading}
          </h5>
          <p className="text-center text-gray-900 text-[18px] md:text-[22px] ">{subheading}</p>
      </div>
    </>
  )
}
