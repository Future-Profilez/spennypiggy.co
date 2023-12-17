function DeviceID() {
  function generateUniqueIdentifier() {
    if (navigator && window) {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const uniqueString = `${userAgent}_${platform}_${screenWidth}_${screenHeight}`;
      const hashedIdentifier = btoa(uniqueString);
      return hashedIdentifier;
    } else {
      return null;
    }
  }
  return generateUniqueIdentifier();
}
export {
  DeviceID as D
};
