import axios from 'axios';

export async function handleIpRedirection(ziggy) {
  try {
    const response = await axios.get(`https://ipapi.co/json/`);
    const countryCode = response?.data?.country_code;
    // console.log("countryCode",countryCode);
    if (ziggy && ziggy?.url === 'https://spennypiggy.co' && countryCode === 'GB') {
      window.location = 'https://uk.spennypiggy.co/register?type=creator';
    }
    // else if (ziggy && ziggy?.url === 'https://uk.spennypiggy.co' && countryCode !== 'GB') {
    //   window.location = 'https://spennypiggy.co/register?type=creator';
    // }
  } catch (error) {
    console.error('Error fetching IP location data:', error);
  }
}
