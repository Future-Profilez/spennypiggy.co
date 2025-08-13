
export default function PaymentUnActivated({heading, subheading}) {
  return (
    <>
      <div className="col-md-12 p-5 my-5 notactive">
          <h5 className="text-[30px] w-full font-GillSans font-normal text-uppercase text-yellow text-center  mb-1">
             {heading}
          </h5>
          <p className="text-center text-gray-400 text-[22px] ">{subheading}</p>
      </div>
    </>
  )
}
