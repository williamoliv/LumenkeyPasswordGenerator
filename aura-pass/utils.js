// --- Character Sets ---
const CHAR_SETS = {
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
    NUMBERS: '0123456789',
    SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    SIMILAR: 'l1IO0'
};

/**
 * Generates a cryptographically secure random integer.
 * @param {number} max 
 * @returns {number}
 */
function getRandomInt(max) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] % (max + 1);
}

/**
 * Generates a password based on the provided options.
 * @param {Object} options 
 * @returns {string}
 */
function generatePasswordLogic(options) {
    const { length, uppercase, lowercase, numbers, symbols, excludeSimilar } = options;

    let availableChars = '';

    // Build available character string
    if (uppercase) availableChars += CHAR_SETS.UPPERCASE;
    if (lowercase) availableChars += CHAR_SETS.LOWERCASE;
    if (numbers) availableChars += CHAR_SETS.NUMBERS;
    if (symbols) availableChars += CHAR_SETS.SYMBOLS;

    // Filter out similar characters if requested
    if (excludeSimilar) {
        // Create regex from SIMILAR chars
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const similarCharsRegex = new RegExp(`[${escapeRegExp(CHAR_SETS.SIMILAR)}]`, 'g');
        availableChars = availableChars.replace(similarCharsRegex, '');
    }

    // Fallback if no characters selected or all filtered out
    if (availableChars.length === 0) {
        // Fallback to lowercase, removing likely excluded similar chars if needed
        let fallback = CHAR_SETS.LOWERCASE;
        if (excludeSimilar) {
            fallback = fallback.replace(/[l1IO0]/g, '');
        }
        availableChars = fallback;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = getRandomInt(availableChars.length - 1);
        password += availableChars[randomIndex];
    }

    return password;
}

/**
 * Calculates the entropy of a password.
 * H = L * log2(N)
 * @param {string} password 
 * @returns {number} Entropy in bits
 */
function calculateEntropyLogic(password) {
    if (!password) return 0;

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32; // Approx symbols

    if (poolSize === 0) return 0;

    return password.length * Math.log2(poolSize);
}

/**
 * Estimates the time to crack the password.
 * @param {number} entropy bits
 * @returns {string} Human readable time
 */
function estimateCrackTimeLogic(entropy) {
    // Assume 100 Billion guesses per second (10^11) - Moderate GPU cluster
    const guessesPerSecond = 1e11;
    const seconds = Math.pow(2, entropy) / guessesPerSecond;

    if (seconds < 1) return "Instant";
    if (seconds < 60) return "Less than a minute";
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`; // 30 days
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`; // 12 months
    if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`; // 100 years

    return "Centuries";
}

// Make functions globally available
self.generatePasswordLogic = generatePasswordLogic;
self.CHAR_SETS = CHAR_SETS;
self.calculateEntropyLogic = calculateEntropyLogic;
self.estimateCrackTimeLogic = estimateCrackTimeLogic;
