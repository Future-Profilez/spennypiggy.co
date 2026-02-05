
export default function PaymentUnActivated({heading, subheading}) {
  return (
    <>
      <div className="w-full p-5 my-5">
          <h5 className="text-[30px] w-full font-GillSans font-normal uppercase text-yellow-400 text-center  mb-1">
             {heading}
          </h5>
          <p className="text-center text-gray-400 text-[22px] ">{subheading}</p>
      </div>
    </>
  )
}
