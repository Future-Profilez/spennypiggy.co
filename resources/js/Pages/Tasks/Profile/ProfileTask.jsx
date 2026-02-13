import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import { Link, useForm, usePage } from "@inertiajs/react";

export default function ProfileTask({ task, IsloggedIn, profileUser }) {
    const { auth } = usePage().props;
    const { formatMultiPrice } = PriceFormat();
    const { post, processing } = useForm();
    const url = `/task/${task.uuid}`;

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
        const adminFee = 1.00; 

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
        <li className="bg-white rounded-[35px] mb-3 p-6 hover:bg-gray-100 transition-colors border-b-2 border-gray-100 last:border-0">
                <div className="md:flex justify-between items-center hover:!text-pink-500">
                    <div className="">
                        <Link href={url} className="text-xl text-gray-900 line-clamp-1 font-bold font-poppins">
                            {task.title}
                        </Link>
                        <p className="text-sm text-gray-600 !my-3 line-clamp-2">
                            {task.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}>{task.status}
                            </span>
                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-blue-100 text-blue-800 !border-blue-200">
                                {task.type} Delivery
                            </span>
                            {task?.sla_hours ? 
                                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-yellow-100 text-yellow-800 !border-yellow-200">
                                    {task.sla_hours} Hours
                                </span>
                            : ''}
                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-pink-100 text-pink-800 !border-pink-200">
                                {task.category || 'Paid Task'}
                            </span>
                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-gray-200 text-gray-800 !border-gray-400">
                                Created: {new Date(task.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-start ps-0 md:!ps-6">
                        <div className="mt-4 md:mt-0  min-w-[100px] gap-4 flex flex-wrap md:!flex-nowrap items-center">
                            <div className="flex flex-col items-end">
                                <p className="text-xl sm:text-2xl font-black text-pink-500 font-poppins">
                                    {isCreator ? (
                                        formatMultiPrice(task.price, task.currency || 'USD')
                                    ) : (
                                        formatMultiPrice(
                                            calculateTotalSupporterPays(
                                                task.price, 
                                                task.currency || 'USD',
                                                vatAmount
                                            ), 
                                            task.currency || 'USD'
                                        )
                                    )}
                                </p> 
                                {!isCreator && (
                                    <span className="block text-xs text-gray-500 font-normal mt-0 leading-tight text-right">
                                        * Includes all fees
                                    </span>
                                )}
                            </div>
                            {!IsloggedIn ?  
                                <div className="">
                                    <Link href={`/task/${task.uuid}`} className="whitespace-nowrap text-sm sm:text-normal inline-block px-6 py-2 bg-pink-500 text-white font-bold rounded-full shadow-md hover:bg-pink-600 transition-colors">
                                        <>{task.type === 'instant' ? 'Pay to Access 🔓' : 'Pay to Assign 📝'} </> 
                                    </Link> 
                                </div>
                            : ''}
                        </div> 
                    </div>
                </div>
                {task.is_approved  !== 1 ?
                    <p className="!pt-3 block text-red-500 font-bold">Unapproved : {task.is_approved_reason || 'Item is currently under review. Please check again after 30 minutes.'}</p> 
                : ''}
        </li>
    );
}
