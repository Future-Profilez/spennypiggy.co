import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import { Link, useForm, usePage } from "@inertiajs/react";

export default function ProfileTask({ task, IsloggedIn, profileUser }) {
    const { auth } = usePage().props;
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const { post, processing } = useForm();
    const url = `/task/${task.uuid}`;
    const isRejected = task?.is_approved === 2;
    const isApproved = task?.is_approved === 1;
    const isPending = !isApproved && !isRejected;
    const reviewMessage =
        task?.reason ||
        task?.is_approved_reason ||
        "Item is currently under review. Please check again after 30 minutes.";

    // Helper to identify zero decimal currencies
    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
            'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
    const calculateTotalSupporterPays = (price, curr, vatAmount = 0) => {
        const listedPrice = parseFloat(price || 0);
        const vat = parseFloat(vatAmount || 0);
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        
        // Client Rule: Add VAT before other fees
        const priceWithVat = listedPrice + vat;

        // Constants must match backend configuration (Helpers.php)
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
        const platformFeeRate = 0.15; 
        const complianceFeeRate = 0.02; 
        const adminFee = adminFeeInCurrency(curr); 

        const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
        
        if (totalDeductionRate >= 1) return priceWithVat;

        const totalSupporterPays = (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
        
        return totalSupporterPays;
    };

    const isCreator = auth?.user?.id === (profileUser?.id || task.creator_id);
    const vatPercentage = profileUser?.vat_amount_percentage || 0;
    const vatAmount = ((parseFloat(String(task.price || 0).replace(/,/g, '')) + parseFloat(String(task.tax_amount || 0).replace(/,/g, ''))) * vatPercentage / 100);

     const handlePurchase = () => {
        post(route('task.purchase', task.uuid));
    };

     const handlePurchaseClick = (e) => {
        e.preventDefault();
        handlePurchase();
    };

    return (
        <li className="bg-[#fdfbf7] rounded-[35px] mb-4 p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all border-[3px] !border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="md:flex justify-between items-center">
                    <div className="">
                        <Link href={url} className="text-2xl text-black line-clamp-1 font-black capitalize tracking-wide">
                            {task.title}
                        </Link>
                        <p className="text-sm text-gray-700 font-bold !my-3 line-clamp-2">
                            {task.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black ${
                                task.status === 'active' ? 'bg-[#A2E4B8] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}>{task.status}
                            </span>
                            <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-blue-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {task.type} Delivery
                            </span>
                            {task?.sla_hours ? 
                                <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {task.sla_hours} Hours
                                </span>
                            : ''}
                            <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-[#b892ff] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {task.category || 'Paid Task'}
                            </span>
                        </div>
                    </div>
                    <div className="text-start ps-0 md:!ps-6 mt-6 md:mt-0">
                        <div className="min-w-[100px] gap-4 flex flex-wrap md:!flex-nowrap items-center justify-end">
                            <div className="flex flex-col items-end">
                                <p className="text-2xl sm:text-2xl font-black text-black">
                                    {isCreator ? (
                                        formatMultiPrice(task.price, task.currency || 'USD')
                                    ) : (
                                        formatMultiPrice(
                                            calculateTotalSupporterPays( task.price,  task.currency || 'USD', vatAmount ), 
                                            task.currency || 'USD'
                                        )
                                    )}
                                </p> 
                                {!isCreator && (
                                    <span className="block text-xs text-gray-500 font-bold mt-0 leading-tight text-right">
                                        * Includes all fees
                                    </span>
                                )}
                            </div>
                            {!IsloggedIn ?  
                                <div className="">
                                    <Link href={`/task/${task.uuid}`} className="whitespace-nowrap text-sm sm:text-base inline-block px-6 py-3 bg-yellow-300 border-[3px] border-black text-black font-black uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                                        <>{task.type === 'instant' ? 'Pay to Access 🔓' : 'Pay to Assign 📝'} </> 
                                    </Link> 
                                </div>
                            : ''}
                        </div> 
                    </div>
                </div>
                {isRejected ? (
                    <p className="!pt-3 block text-red-600 font-bold">
                        Action Required: {reviewMessage}
                    </p>
                ) : isPending ? (
                    <p className="!pt-3 block text-yellow-700 font-bold">
                        Under Review: {reviewMessage}
                    </p>
                ) : (
                    ""
                )}
        </li>
    );
}
