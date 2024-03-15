import { toast } from "react-hot-toast";

export const useAlerts = () => {

    /**
     * Success Taost Alert
     * @param {String} message Alert Message
     * @param {String} position Position of Toast
     * @param {Number} duration MiliSeconds
     * @returns {void}
     */
    const successAlert = (message, position = "top-right", duration = 4500) => {
        toast.success(message, {
            duration: duration,
            position: position,
        });
        return;
    }


    /**
     * Error Taost Alert
     * @param {String} message Alert Message
     * @param {String} position Position of Toast
     * @param {Number} duration MiliSeconds
     * @returns {void}
     */
    const errorAlert = (message, position = "top-right", duration = 4500) => {
        toast.error(message, {
            duration: duration,
            position: position,
        });
        return;
    }

    /**
     * Warning Taost Alert
     * @param {String} message Alert Message
     * @param {String} position Position of Toast
     * @param {Number} duration MiliSeconds
     * @returns {void}
     */
    const warningAlert = (message, position = "top-right", duration = 4500) => {
        toast(message, {
            duration: duration,
            position: position,
            className: "bg-yellow-800 text-white"
        });
        return;
    }

    /**
     * Info Taost Alert
     * @param {String} message Alert Message
     * @param {String} position Position of Toast
     * @param {Number} duration MiliSeconds
     * @returns {void}
     */
    const infoAlert = (message, position = "top-right", duration = 4500) => {
        toast(message, {
            duration: duration,
            position: position,
        });
        return;
    }


    const errorsHandling = (error, position = "top-right", duration = 4500) => {
        if(error?.response?.data?.errors){ 
            const Error = error?.response?.data?.errors;
            Object.keys(Error).map((key) => {
                let err = Error[key];
                err.map((m, i) => { 
                    toast.error(m, {
                        duration: duration,
                        position: position
                    });
                });
            });
        } 
        return;
    }



    return { successAlert, errorAlert, warningAlert, infoAlert, errorsHandling };

}
