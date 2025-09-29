import spennypiggy from "../../assets/img/logo.png";
import socialbg from "../../assets/social-bg.png";

/**
 * Generate HTML template for profile social image
 * @param {Object} params - Profile parameters
 * @param {string} params.avatarUid - Uploadcare UUID for avatar
 * @param {string} params.name - Creator name
 * @param {string} params.username - Creator username
 * @returns {string} HTML template string
 */
export function renderProfileCard({ avatarUid, name, username }) {
    return `
        <div id="card-to-capture" class="dot-pattern relative my-[300px] flex items-center p-6 w-[600px] h-[337.5px] text-white shadow-2xl">
            <img src="${socialbg}" alt="Background" class="w-full h-full object-cover absolute top-0 left-0 z-[-1]" crossorigin="anonymous" />

            <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.2)_3px,transparent_3px)] bg-[size:30px_30px]"></div>
            <div class="absolute top-18 left-6 text-yellow-300 text-4xl">✨</div>
            <div class="absolute bottom-4 right-28 text-cyan-300 text-2xl">⭐</div>
            <div class="absolute top-18 right-20 text-cyan-300 text-3xl">💰</div>

            <div class="inner-image w-full">
                <div class="flex items-center justify-center mb-4">
                    <div class="w-28 h-28 rounded-full border-4 border-[#00ff5e] overflow-hidden shadow-lg">
                        <img src="https://ucarecdn.com/${avatarUid}/-/crop/1:1/-/preview/" alt="Profile" class="w-full h-full object-cover" crossorigin="anonymous" />
                    </div>
                    <div class="ps-3">
                        <h1 class="image-name max-w-[200px] mt-[-20px] pb-2 uppercase font-fre text-3xl text-start">
                            ${name}
                        </h1>
                    </div>
                </div>

                <p class="text-white text-xl font-bold me-3 absolute top-[180px] left-[210px] max-w-[100px] object-cover">is now on </p>
                <img src="${spennypiggy}" alt="Logo" class="me-3 absolute top-[190px] left-[310px] max-w-[100px] object-cover" crossorigin="anonymous" />

                <div class="bg-gradient-to-r mt-[100px] from-[#9b0039] to-[#9b0039b6] link-shadow text-white px-4 leading-[15px] h-[40px] rounded-[15px] text-center text-[20px] shadow-md">
                    https://spennypiggy.co/${username}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate HTML template for support payment social image
 * Uses the same visual design foundation as the EditProfile component
 * @param {Object} params - Support payment parameters
 * @param {Object} params.creator - Creator object with name, username, avatar
 * @param {string} params.supporterName - Supporter display name
 * @param {string} params.amount - Formatted amount
 * @param {string} params.currency - Currency code
 * @param {boolean} params.isAnonymous - Whether supporter is anonymous
 * @param {string} params.message - Optional support message
 * @returns {string} HTML template string
 */
export function renderSupportCard({ creator, supporterName, amount, currency, isAnonymous, message }) {
    const displaySupporter = isAnonymous ? "Anonymous Supporter" : supporterName;
    const truncatedMessage = message && message.length > 80 ? message.substring(0, 77) + '...' : message;
    
    return `
        <div id="card-to-capture" class="dot-pattern relative flex items-center justify-center p-6 w-[600px] h-[337.5px] text-white shadow-2xl">
            <img src="${socialbg}" alt="Background" class="w-full h-full object-cover absolute top-0 left-0 z-[-1]" crossorigin="anonymous" />

            <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.2)_3px,transparent_3px)] bg-[size:30px_30px]"></div>

            <div class="inner-image w-full text-center">
                <div class="mb-6">
                    <h1 class="text-4xl font-bold text-yellow-300 mb-4">🎉 THANK YOU! 🎉</h1>
                    <p class="text-white text-2xl font-bold mb-4">Thank you ${displaySupporter}</p>
                    <p class="text-white text-xl mb-4">for making my day special with</p>
                    <p class="text-yellow-300 font-bold text-3xl mb-4">${currency} ${amount}</p>
                    ${truncatedMessage ? `<p class="text-white text-lg italic mb-4">"${truncatedMessage}"</p>` : ''}
                </div>

                <div class="bg-gradient-to-r from-[#9b0039] to-[#9b0039b6] link-shadow text-white px-4 leading-[15px] h-[40px] rounded-[15px] text-center text-[20px] shadow-md flex items-center justify-center">
                    https://spennypiggy.co/${creator.username}
                </div>
            </div>
        </div>
    `;
}

/**
 * Utility function to truncate long names
 * @param {string} name - Name to truncate
 * @param {number} maxLength - Maximum length (default: 20)
 * @returns {string} Truncated name
 */
export function truncateName(name, maxLength = 20) {
    if (!name || name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export function formatCurrency(amount, currency = 'GBP') {
    try {
        return new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e) {
        // Fallback to simple formatting
        return parseFloat(amount).toFixed(2);
    }
}