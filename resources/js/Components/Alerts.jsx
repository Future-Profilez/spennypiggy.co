import { toast } from "react-hot-toast";

export const useAlerts = () => {

    /**
     * Success Taost Alert
     * @param {String} message Alert Message
     * @param {String} position Position of Toast
     * @param {Number} duration MiliSeconds
     * @returns {void}
     */
    const successAlert = (message, position = "top-right" ,duration = 10000) => {
        toast.success(message, {
            duration: duration,
            position: position,
        });
        // console.log('Success:', message);
        return;
    }


    /**
     * Error Taost Alert
     * @param {String} message Alert Message
     * @param {String} position Position of Toast
     * @param {Number} duration MiliSeconds
     * @returns {void}
     */
    const errorAlert = (message, position = "top-right" ,duration = 10000) => {
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
    const warningAlert = (message, position = "top-right" ,duration = 10000) => {
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
    const infoAlert = (message, position = "top-right" ,duration = 10000) => {
        toast(message, {
            duration: duration,
            position: position,
        });
        return;
    }

    return {successAlert, errorAlert, warningAlert, infoAlert};

}
