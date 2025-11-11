document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const passwordDisplay = document.getElementById('passwordDisplay');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    const includeUppercase = document.getElementById('includeUppercase');
    const includeLowercase = document.getElementById('includeLowercase');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    const copyButton = document.getElementById('copyButton');
    const copyMessage = document.getElementById('copyMessage');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    // --- Character Sets ---
    const CHAR_SETS = {
        UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
        NUMBERS: '0123456789',
        SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    /**
     * Securely generates a random integer within a range.
     * Uses Web Crypto API for true randomness.
     */
    function getRandomInt(max) {
        const randomBuffer = new Uint32Array(1);
        crypto.getRandomValues(randomBuffer);
        return randomBuffer[0] % (max + 1);
    }

    /**
     * Generates a password, updates the display, and saves preferences.
     * This is the central function.
     */
    function generatePassword() {
        try {
            let availableChars = '';
            let password = '';
            const length = parseInt(lengthSlider.value, 10);

            // Build available character set
            if (includeUppercase.checked) availableChars += CHAR_SETS.UPPERCASE;
            if (includeLowercase.checked) availableChars += CHAR_SETS.LOWERCASE;
            if (includeNumbers.checked) availableChars += CHAR_SETS.NUMBERS;
            if (includeSymbols.checked) availableChars += CHAR_SETS.SYMBOLS;

            // **Error Handling/Fallback:**
            // If no boxes are checked, default to lowercase to avoid errors.
            if (availableChars.length === 0) {
                availableChars = CHAR_SETS.LOWERCASE;
                includeLowercase.checked = true; // Visually re-check the box
            }

            // Generate the password
            for (let i = 0; i < length; i++) {
                const randomIndex = getRandomInt(availableChars.length - 1);
                password += availableChars[randomIndex];
            }

            // **Display the password**
            passwordDisplay.value = password;

            // Update strength and save settings
            updateStrengthIndicator(password);
            savePreferences();

        } catch (error) {
            console.error("Error generating password:", error);
            passwordDisplay.value = "Error!";
        }
    }

    /**
     * Updates the password strength indicator in real-time.
     */
    function updateStrengthIndicator(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 16) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;

        strengthBar.className = 'strength-bar';
        strengthText.className = '';

        if (score <= 2) {
            strengthBar.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = 'Weak';
        } else if (score <= 4) {
            strengthBar.classList.add('medium');
            strengthText.classList.add('medium');
            strengthText.textContent = 'Medium';
        } else {
            strengthBar.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = 'Strong';
        }
    }

    /**
     * Copies the password to the clipboard.
     */
    function copyPassword() {
        if (!passwordDisplay.value) return;
        navigator.clipboard.writeText(passwordDisplay.value).then(() => {
            copyMessage.classList.add('show');
            setTimeout(() => {
                copyMessage.classList.remove('show');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy password: ', err);
        });
    }

    /**
     * Updates the length value display when slider changes.
     */
    function updateLengthDisplay() {
        lengthValue.textContent = lengthSlider.value;
    }

    /**
     * Saves user preferences to local storage.
     */
    function savePreferences() {
        const preferences = {
            length: lengthSlider.value,
            uppercase: includeUppercase.checked,
            lowercase: includeLowercase.checked,
            numbers: includeNumbers.checked,
            symbols: includeSymbols.checked,
        };
        chrome.storage.local.set({ passwordPrefs: preferences });
    }

    /**
     * Loads user preferences and triggers initial password generation.
     */
    function loadPreferences() {
        chrome.storage.local.get(['passwordPrefs'], (result) => {
            const prefs = result.passwordPrefs;
            if (prefs) {
                lengthSlider.value = prefs.length || 16;
                includeUppercase.checked = prefs.uppercase !== false;
                includeLowercase.checked = prefs.lowercase !== false;
                includeNumbers.checked = prefs.numbers !== false;
                includeSymbols.checked = prefs.symbols !== false;
            }
            
            // **FIX: Generate password on load**
            // This is the key for "generate on open"
            updateLengthDisplay();
            generatePassword();
        });
    }

    // --- Event Listeners (Real-Time Updates) ---

    // When slider moves, update text and regenerate password
    lengthSlider.addEventListener('input', () => {
        updateLengthDisplay();
        generatePassword();
    });

    // When any checkbox is changed, regenerate password
    const allCheckboxes = [includeUppercase, includeLowercase, includeNumbers, includeSymbols];
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', generatePassword);
    });

    // Copy button listener
    copyButton.addEventListener('click', copyPassword);

    // --- Initialization ---
    // Load preferences, which will then trigger the first password generation.
    loadPreferences();
});