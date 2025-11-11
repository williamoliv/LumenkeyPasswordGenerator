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
    
    // **New Theme Element**
    const themeSwitch = document.getElementById('themeSwitch');

    // --- Character Sets ---
    const CHAR_SETS = {
        UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
        NUMBERS: '0123456789',
        SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // --- Password Generation ---
    function getRandomInt(max) {
        const randomBuffer = new Uint32Array(1);
        crypto.getRandomValues(randomBuffer);
        return randomBuffer[0] % (max + 1);
    }

    function generatePassword() {
        try {
            let availableChars = '';
            let password = '';
            const length = parseInt(lengthSlider.value, 10);

            if (includeUppercase.checked) availableChars += CHAR_SETS.UPPERCASE;
            if (includeLowercase.checked) availableChars += CHAR_SETS.LOWERCASE;
            if (includeNumbers.checked) availableChars += CHAR_SETS.NUMBERS;
            if (includeSymbols.checked) availableChars += CHAR_SETS.SYMBOLS;

            if (availableChars.length === 0) {
                availableChars = CHAR_SETS.LOWERCASE;
                includeLowercase.checked = true;
            }

            for (let i = 0; i < length; i++) {
                const randomIndex = getRandomInt(availableChars.length - 1);
                password += availableChars[randomIndex];
            }

            passwordDisplay.value = password;
            updateStrengthIndicator(password);
            savePreferences();

        } catch (error) {
            console.error("Error generating password:", error);
            passwordDisplay.value = "Error!";
        }
    }

    // --- UI & State Functions ---

    function updateStrengthIndicator(password) {
        // (Function unchanged)
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

    function copyPassword() {
        // (Function unchanged)
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
     * Updates the slider's "progress" bar.
     */
    function updateSliderProgress() {
        const min = lengthSlider.min;
        const max = lengthSlider.max;
        const value = lengthSlider.value;
        const percent = ((value - min) / (max - min)) * 100;
        lengthSlider.style.setProperty('--slider-progress', `${percent}%`);
    }

    /**
     * Updates the length value display and the slider progress.
     */
    function updateLengthDisplay() {
        lengthValue.textContent = lengthSlider.value;
        updateSliderProgress(); // Update the progress bar fill
    }

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
            updateLengthDisplay();
            generatePassword();
        });
    }

    // --- ✨ New Theme Management Logic ✨ ---

    /**
     * Applies the theme to the DOM.
     */
    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeSwitch.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeSwitch.checked = false;
        }
    }

    /**
     * Saves the theme preference to storage.
     */
    function saveTheme(theme) {
        chrome.storage.local.set({ theme: theme });
    }

    /**
     * Loads the theme from storage or system preference.
     */
    function loadTheme() {
        chrome.storage.local.get(['theme'], (result) => {
            let theme = result.theme;
            
            // If no theme is saved, check system preference
            if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            applyTheme(theme);
        });
    }

    // --- Event Listeners ---
    
    // Slider: Update length text and re-generate password
    lengthSlider.addEventListener('input', () => {
        updateLengthDisplay();
        generatePassword();
    });

    // Checkboxes: Re-generate password on change
    const allCheckboxes = [includeUppercase, includeLowercase, includeNumbers, includeSymbols];
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', generatePassword);
    });

    // Copy Button
    copyButton.addEventListener('click', copyPassword);

    // **New Theme Switch Listener**
    themeSwitch.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'light' : 'dark';
        applyTheme(newTheme);
        saveTheme(newTheme);
    });

    // --- Initialization ---
    loadTheme();
    loadPreferences(); // This also calls updateLengthDisplay() and generatePassword()
});