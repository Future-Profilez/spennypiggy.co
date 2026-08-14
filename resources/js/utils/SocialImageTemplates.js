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
        <div id="card-to-capture" class="dot-pattern relative my-[300px] flex items-center p-6 w-[600px] h-[337.5px] text-white ">
            <img src="${socialbg}" alt="Background" class="w-full h-full object-cover absolute top-0 left-0 z-[-1]" crossorigin="anonymous" />

            <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.2)_3px,transparent_3px)] bg-[size:30px_30px]"></div>
            <div class="absolute top-18 left-6 text-yellow-300 text-4xl">✨</div>
            <div class="absolute bottom-4 right-28 text-cyan-300 text-2xl">⭐</div>
            <div class="absolute top-18 right-20 text-cyan-300 text-3xl">💰</div>

            <div class="inner-image w-full">
                <div class="flex items-center justify-center mb-4">
                    <div class="w-28 h-28 rounded-full border-2 border-[#00ff5e] overflow-hidden ">
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

                <div class="bg-gradient-to-r mt-[100px] from-[#9b0039] to-[#9b0039b6] link-shadow text-white px-4 leading-[15px] h-[40px] rounded-[30px]   text-center text-[20px] ">
                    https://spennypiggy.co/${username}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate HTML template for support payment social image
 * Modern elegant design with pink gradient background and decorative elements
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
    const displaySupporter = isAnonymous ? 'Anonymous' : supporterName;
    const truncatedMessage = message && message.length > 80 ? message.substring(0, 77) + '...' : message;

    return `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
        <div id="card-to-capture" style="position:relative;width:600px;height:337px;overflow:hidden;border-radius:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
            <img src="${socialbg}" alt="Background" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:-2;filter:contrast(1.0) saturate(1.25);" crossorigin="anonymous" />
            <div style="position:absolute;inset:0;background:radial-gradient(800px 200px at 80% 10%, rgba(167,139,250,0.35), transparent 50%), radial-gradient(600px 180px at 20% 90%, rgba(34,211,238,0.35), transparent 55%);"></div>
            <div style="position:absolute;inset:0;opacity:0.15;background-image:radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px);background-size:18px 18px;mix-blend:screen;"></div>

            <!-- Decorative gifts removed per request -->

            <!-- Main content container -->
            <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:0 40px;text-align:center;color:#fff;">
                <img src="${spennypiggy}" alt="SpennyPiggy" style="width:42px;height:42px;object-fit:contain;opacity:0.95;margin-bottom:8px;" crossorigin="anonymous" />

                <h1 style="margin-bottom:8px;font-size:44px;letter-spacing:0.3px;font-family:'Outfit',-apple-system,Segoe UI,Roboto,sans-serif;text-transform:uppercase;background:linear-gradient(90deg,#8b5cf6 0%,#06b6d4 50%,#22d3ee 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 12px 32px rgba(34,211,238,0.28),0 4px 12px rgba(167,139,250,0.4);">THANK YOU</h1>

                <p style="margin-bottom:4px;font-size:20px;opacity:0.95;font-weight:600;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">Thank you ${displaySupporter}</p>
                <p style="margin-bottom:16px;font-size:16px;opacity:0.80;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">for making my day special with</p>

                <div style="display:inline-block;padding:6px 14px;border-radius:14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.22);backdrop-filter:blur(4px);box-shadow:0 8px 24px rgba(0,0,0,0.3);">
                    <span style="font-size:22px;letter-spacing:0.2px;font-family:'Outfit',-apple-system,Segoe UI,Roboto,sans-serif;background:linear-gradient(90deg,#f97316 0%,#fb7185 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 6px 16px rgba(251,113,133,0.30),0 2px 6px rgba(249,115,22,0.25);">${(currency || '').toUpperCase()} ${amount}</span>
                </div>

                <style>
                  html, body, #card-to-capture, h1, p, span {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                  }
                </style>

                <div style="display:inline-block;margin-top:24px;padding:8px 14px;border-radius:9999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.22);box-shadow:0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15);backdrop-filter:blur(4px);color:rgba(255,255,255,0.92);font-size:14px;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">https://spennypiggy.co/${creator.username}</div>
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
