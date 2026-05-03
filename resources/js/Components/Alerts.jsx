import { toast } from "react-hot-toast";
import { 
    CircleCheckIcon, 
    TriangleAlertIcon, 
    InfoIcon 
} from "@animateicons/react/lucide";

export const useAlerts = () => {
    const clearToasts = () => {
        toast.dismiss(); // 🔥 clears all existing toasts
    };

    const successAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast.success(message, {
            duration,
            position,
            icon: <CircleCheckIcon size={24} color="#22c55e" />,
        });
    };

    const errorAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast.error(message, {
            duration,
            position,
            icon: <TriangleAlertIcon size={24} color="#ef4444" />,
        });
    };

    const warningAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast(message, {
            duration,
            position,
            className: "bg-yellow-800 text-white",
            icon: <TriangleAlertIcon size={24} color="#facc15" />,
        });
    };

    const infoAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast(message, {
            duration,
            position,
            icon: <InfoIcon size={24} color="#3b82f6" />,
        });
    };

    const errorsHandling = (error, position = "top-right", duration = 4500) => {
        clearToasts();

        if (error?.response?.data?.errors) {
            const Error = error.response.data.errors;

            Object.keys(Error).forEach((key) => {
                Error[key].forEach((message) => {
                    toast.error(message, {
                        duration,
                        position,
                    });
                });
            });
        }
    };

    return {
        successAlert,
        errorAlert,
        warningAlert,
        infoAlert,
        errorsHandling,
    };
};
