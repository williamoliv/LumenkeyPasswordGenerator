let focusedElement;

// 1. Store the element that was last right-clicked
document.addEventListener("contextmenu", (event) => {
    focusedElement = event.target;
}, true);

// 2. Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "inject-password") {
        if (focusedElement && typeof focusedElement.value !== 'undefined') {
            // 3. Inject the password into the stored element
            focusedElement.value = request.password;

            // Bonus: Dispatch an 'input' event to make sure web apps
            // like React or Vue detect the change.
            focusedElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
});