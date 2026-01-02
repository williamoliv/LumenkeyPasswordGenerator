try {
    importScripts('utils.js');
} catch (e) {
    console.error(e);
}

async function generatePasswordFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['passwordPrefs'], (result) => {
            const prefs = result.passwordPrefs || {};

            // Set defaults if no prefs are saved
            const options = {
                length: prefs.length || 16,
                uppercase: prefs.uppercase !== false,
                lowercase: prefs.lowercase !== false,
                numbers: prefs.numbers !== false,
                symbols: prefs.symbols !== false,
                excludeSimilar: prefs.excludeSimilar === true // Default false
            };

            const password = self.generatePasswordLogic(options);
            resolve(password);
        });
    });
}

// --- Context Menu Setup ---

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "lumenkey-generate",
        title: "Generate with LumenKey",
        contexts: ["editable"] // Only show for editable fields (inputs, textareas)
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "lumenkey-generate") {
        const newPassword = await generatePasswordFromStorage();

        chrome.tabs.sendMessage(tab.id, {
            type: "inject-password",
            password: newPassword
        });
    }
});