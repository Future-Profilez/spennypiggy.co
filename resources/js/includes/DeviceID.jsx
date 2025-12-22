export default function DeviceID(){

   function generateUniqueIdentifier() {
      if(navigator && window){
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const uniqueString = `${userAgent}_${platform}_${screenWidth}_${screenHeight}`;
        // Make base64 URL-safe by replacing + with -, / with _ and removing =
        const hashedIdentifier = btoa(uniqueString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return hashedIdentifier;
      } else {
          return null
      }
    }

   return generateUniqueIdentifier()
}
