import { 
  FaTwitter, 
  FaInstagram, 
  FaFacebookF, 
  FaYoutube, 
  FaTwitch, 
  FaTumblr, 
  FaReddit, 
  FaDiscord,
  FaHeart,
  FaStar,
  FaFan,
  FaVideo,
  FaGlobe
} from 'react-icons/fa';

// Platform configuration map - single source of truth for all social platforms
export const SOCIAL_PLATFORMS = {
  twitter: {
    id: 'twitter',
    label: 'X (Twitter)',
    type: 'handle', // 'handle' or 'url'
    baseUrl: 'https://x.com/',
    icon: FaTwitter,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    focusColor: 'focus:border-blue-500',
    maxLength: 15,
    placeholder: '@username',
    hint: 'Enter your Twitter/X username (with or without @)',
    validation: /^@?[A-Za-z0-9_]{1,15}$/,
    order: 1
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    type: 'handle',
    baseUrl: 'https://instagram.com/',
    icon: FaInstagram,
    color: 'text-[#FF007F]',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    focusColor: 'focus:border-[#FF007F]',
    maxLength: 30,
    placeholder: '@username',
    hint: 'Enter your Instagram username (with or without @)',
    validation: /^@?[A-Za-z0-9._]{1,30}$/,
    order: 2
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    type: 'url',
    baseUrl: 'https://youtube.com/',
    icon: FaYoutube,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    focusColor: 'focus:border-red-500',
    maxLength: 200,
    placeholder: 'https://youtube.com/@yourchannel',
    hint: 'Enter your full YouTube channel URL',
    validation: /^(https?:\/\/)?(www\.)?(youtube\.com\/(c\/|channel\/|@)[A-Za-z0-9_-]+|youtu\.be\/[A-Za-z0-9_-]+)/,
    order: 3
  },
  twitch: {
    id: 'twitch',
    label: 'Twitch',
    type: 'handle',
    baseUrl: 'https://twitch.tv/',
    icon: FaTwitch,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    focusColor: 'focus:border-purple-500',
    maxLength: 25,
    placeholder: 'username',
    hint: 'Enter your Twitch username (no @ needed)',
    validation: /^@?[A-Za-z0-9_]{4,25}$/,
    order: 4
  },
  // tumblr: {
  //   id: 'tumblr',
  //   label: 'Tumblr',
  //   type: 'handle',
  //   baseUrl: 'https://tumblr.com/{handle}', // Special template for subdomain
  //   icon: FaTumblr,
  //   color: 'text-indigo-500',
  //   bgColor: 'bg-indigo-50',
  //   borderColor: 'border-indigo-300',
  //   focusColor: 'focus:border-indigo-500',
  //   maxLength: 32,
  //   placeholder: 'blogname',
  //   hint: 'Enter your Tumblr blog name',
  //   // validation: /^@?[A-Za-z0-9-]{3,32}$/,
  //   validation: /^@?[A-Za-z0-9._]{1,30}$/,
  //   order: 5
  // },
  // reddit: {
  //   id: 'reddit',
  //   label: 'Reddit',
  //   type: 'handle',
  //   baseUrl: 'https://reddit.com/user/',
  //   icon: FaReddit,
  //   color: 'text-orange-500',
  //   bgColor: 'bg-orange-50',
  //   borderColor: 'border-orange-300',
  //   focusColor: 'focus:border-orange-500',
  //   maxLength: 20,
  //   placeholder: 'u/username',
  //   hint: 'Enter your Reddit username (with or without u/)',
  //   validation: /^(u\/)?[A-Za-z0-9_-]{3,20}$/,
  //   order: 6
  // },
  // facebook: {
  //   id: 'facebook',
  //   label: 'Facebook',
  //   type: 'url',
  //   baseUrl: 'https://facebook.com/',
  //   icon: FaFacebookF,
  //   color: 'text-blue-600',
  //   bgColor: 'bg-blue-50',
  //   borderColor: 'border-blue-300',
  //   focusColor: 'focus:border-blue-500',
  //   maxLength: 200,
  //   placeholder: 'https://facebook.com/yourpage',
  //   hint: 'Enter your full Facebook profile/page URL',
  //   validation: /^(https?:\/\/)?(www\.)?facebook\.com\/(profile\.php\?id=[0-9]+|[A-Za-z0-9.]{5,})\/?$/,
  //   order: 7
  // },
  // discord: {
  //   id: 'discord',
  //   label: 'Discord',
  //   type: 'handle',
  //   baseUrl: 'https://discord.com/users/',
  //   icon: FaDiscord,
  //   color: 'text-indigo-600',
  //   bgColor: 'bg-indigo-50',
  //   borderColor: 'border-indigo-300',
  //   focusColor: 'focus:border-indigo-500',
  //   maxLength: 37, // username#0000 format
  //   placeholder: 'username#1234 or @username',
  //   hint: 'Enter Discord username (old: username#1234, new: @username)',
  //   validation: /^(@?[A-Za-z0-9._-]{2,32}|.{3,32}#[0-9]{4})$/,
  //   order: 8
  // },
  // Adult content platforms - lower priority
  onlyfans: {
    id: 'onlyfans',
    label: 'OnlyFans',
    type: 'url',
    baseUrl: 'https://onlyfans.com/',
    icon: FaHeart,
    color: 'text-blue-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    focusColor: 'focus:border-blue-400',
    maxLength: 200,
    placeholder: 'https://onlyfans.com/username',
    hint: 'Enter your OnlyFans profile URL',
    validation: /^(https?:\/\/)?(www\.)?onlyfans\.com\/[A-Za-z0-9_-]+\/?$/,
    order: 10
  },
  loyalfans: {
    id: 'loyalfans',
    label: 'LoyalFans',
    type: 'url',
    baseUrl: 'https://loyalfans.com/',
    icon: FaStar,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    focusColor: 'focus:border-yellow-500',
    maxLength: 200,
    placeholder: 'https://loyalfans.com/username',
    hint: 'Enter your LoyalFans profile URL',
    validation: /^(https?:\/\/)?(www\.)?loyalfans\.com\/[A-Za-z0-9_-]+\/?$/,
    order: 11
  },
  fansly: {
    id: 'fansly',
    label: 'Fansly',
    type: 'url',
    baseUrl: 'https://fansly.com/',
    icon: FaFan,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    focusColor: 'focus:border-cyan-500',
    maxLength: 200,
    placeholder: 'https://fansly.com/username',
    hint: 'Enter your Fansly profile URL',
    validation: /^(https?:\/\/)?(www\.)?fansly\.com\/[A-Za-z0-9_-]+\/?$/,
    order: 12
  },
  manyvids: {
    id: 'manyvids',
    label: 'ManyVids',
    type: 'url',
    baseUrl: 'https://manyvids.com/',
    icon: FaVideo,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    focusColor: 'focus:border-purple-600',
    maxLength: 200,
    placeholder: 'https://manyvids.com/Profile/username',
    hint: 'Enter your ManyVids profile URL',
    validation: /^(https?:\/\/)?(www\.)?manyvids\.com\/Profile\/[A-Za-z0-9_-]+\/?$/,
    order: 13
  },
  other: {
    id: 'other',
    label: 'Other Website',
    type: 'url',
    baseUrl: null,
    icon: FaGlobe,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    focusColor: 'focus:border-gray-500',
    maxLength: 300,
    placeholder: 'https://yourwebsite.com',
    hint: 'Enter any other website or social platform URL',
    validation: /^https?:\/\/.+/,
    order: 14
  }
};

// Get platforms sorted by order
export const getSortedPlatforms = () => {
  return Object.values(SOCIAL_PLATFORMS).sort((a, b) => a.order - b.order);
};

// Get primary platforms (main social media)
export const getPrimaryPlatforms = () => {
  return getSortedPlatforms().filter(platform => platform.order <= 8);
};

// Get secondary platforms (adult content + other)
export const getSecondaryPlatforms = () => {
  return getSortedPlatforms().filter(platform => platform.order > 8);
};

// Get platform by ID
export const getPlatform = (id) => {
  return SOCIAL_PLATFORMS[id] || null;
};

// Check if platform expects handle input
export const isHandlePlatform = (id) => {
  const platform = getPlatform(id);
  return platform && platform.type === 'handle';
};

// Check if platform expects URL input
export const isUrlPlatform = (id) => {
  const platform = getPlatform(id);
  return platform && platform.type === 'url';
};