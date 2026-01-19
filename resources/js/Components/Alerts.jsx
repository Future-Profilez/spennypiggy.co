import { toast } from "react-hot-toast";

export const useAlerts = () => {
    const clearToasts = () => {
        toast.dismiss(); // 🔥 clears all existing toasts
    };

    const successAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast.success(message, {
            duration,
            position,
        });
    };

    const errorAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast.error(message, {
            duration,
            position,
        });
    };

    const warningAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast(message, {
            duration,
            position,
            className: "bg-yellow-800 text-white",
        });
    };

    const infoAlert = (message, position = "top-right", duration = 4500) => {
        clearToasts();
        toast(message, {
            duration,
            position,
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
