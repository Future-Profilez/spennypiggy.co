import { RefreshCw } from "lucide-react";

export default function LoaderButton({ className = '', disabled, children, spinnerclass="" ,...props }) {
    return (
        <button
            {...props}
            className={ `!text-[16px] mt-2 m-auto uppercase font-gulfs rounded-box  text-white flex items-center text-center justify-center  h focus:ring-offset-2 transition ease-in-out duration-150 main-button  ${disabled && 'opacity-75'} ${className ? className : 'p'} `}
            disabled={disabled}
        >
            {disabled && <>
                <RefreshCw size={16} className={`mr-2 animate-spin ` + spinnerclass} />
                <span className="sr-only">Loading... </span>
            </>}
            {children} 
        </button>
    );
}
