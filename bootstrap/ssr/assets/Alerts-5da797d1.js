import { toast } from "react-hot-toast";
const useAlerts = () => {
  const successAlert = (message, position = "top-right", duration = 3e3) => {
    toast.success(message, {
      duration,
      position
    });
    return;
  };
  const errorAlert = (message, position = "top-right", duration = 3e3) => {
    toast.error(message, {
      duration,
      position
    });
    return;
  };
  const warningAlert = (message, position = "top-right", duration = 3e3) => {
    toast(message, {
      duration,
      position,
      className: "bg-yellow-800 text-white"
    });
    return;
  };
  const infoAlert = (message, position = "top-right", duration = 1e4) => {
    toast(message, {
      duration,
      position
    });
    return;
  };
  const errorsHandling = (error, position = "top-right", duration = 1e4) => {
    {
      Object.keys(error).map((key) => {
        let e = error[key];
        return toast.error(e, {
          duration,
          position
        });
      });
    }
    return;
  };
  return { successAlert, errorAlert, warningAlert, infoAlert, errorsHandling };
};
export {
  useAlerts as u
};
