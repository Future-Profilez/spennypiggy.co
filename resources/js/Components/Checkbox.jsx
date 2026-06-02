export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded-[4px] border-gray-300 text-[#FF007F] shadow-sm focus:ring-pink-500 cursor-pointer w-5 h-5 transition-all ' +
                className
            }
        />
    );
}
