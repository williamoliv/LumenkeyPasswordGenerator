// --- Character Sets ---
const CHAR_SETS = {
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
    NUMBERS: '0123456789',
    SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// --- Secure Randomness ---
function getRandomInt(max) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] % (max + 1);
}

/**
 * Generates a password based on stored settings.
 * This logic is duplicated from the popup script to work in the background.
 */
async function generatePasswordFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['passwordPrefs'], (result) => {
            const prefs = result.passwordPrefs || {};
            
            // Set defaults if no prefs are saved
            const length = prefs.length || 16;
            const includeUppercase = prefs.uppercase !== false;
            const includeLowercase = prefs.lowercase !== false;
            const includeNumbers = prefs.numbers !== false;
            const includeSymbols = prefs.symbols !== false;

            let availableChars = '';
            if (includeUppercase) availableChars += CHAR_SETS.UPPERCASE;
            if (includeLowercase) availableChars += CHAR_SETS.LOWERCASE;
            if (includeNumbers) availableChars += CHAR_SETS.NUMBERS;
            if (includeSymbols) availableChars += CHAR_SETS.SYMBOLS;

            // Fallback
            if (availableChars.length === 0) {
                availableChars = CHAR_SETS.LOWERCASE;
            }

            let password = '';
            for (let i = 0; i < length; i++) {
                const randomIndex = getRandomInt(availableChars.length - 1);
                password += availableChars[randomIndex];
            }
            resolve(password);
        });
    });
}

// --- Context Menu Setup ---

// 1. Create the menu item on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "lumenkey-generate",
        title: "Generate with LumenKey",
        contexts: ["editable"] // Only show for editable fields (inputs, textareas)
    });
});

// 2. Listen for a click on our menu item
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "lumenkey-generate") {
        const newPassword = await generatePasswordFromStorage();
        
        // 3. Send the generated password to the content script in the active tab
        chrome.tabs.sendMessage(tab.id, {
            type: "inject-password",
            password: newPassword
        });
    }
});