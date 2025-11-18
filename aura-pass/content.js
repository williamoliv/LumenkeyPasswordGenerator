let focusedElement;

//Store the element that was last right-clicked
document.addEventListener("contextmenu", (event) => {
    focusedElement = event.target;
}, true);

//Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "inject-password") {
        if (focusedElement && typeof focusedElement.value !== 'undefined') {
            // Inject the password into the stored element
            focusedElement.value = request.password;
            focusedElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
});