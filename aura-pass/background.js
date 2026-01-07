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

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (password) => {
                const element = document.activeElement;
                if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                    const start = element.selectionStart;
                    const end = element.selectionEnd;
                    const text = element.value;
                    element.value = text.substring(0, start) + password + text.substring(end);
                    element.selectionStart = element.selectionEnd = start + password.length;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
            },
            args: [newPassword]
        });
    }
});