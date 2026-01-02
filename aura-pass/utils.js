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

// Make functions globally available for importScripts or standard script tags
self.generatePasswordLogic = generatePasswordLogic;
self.CHAR_SETS = CHAR_SETS;
