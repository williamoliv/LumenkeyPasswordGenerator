document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const passwordDisplay = document.getElementById('passwordDisplay');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    const includeUppercase = document.getElementById('includeUppercase');
    const includeLowercase = document.getElementById('includeLowercase');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    const excludeSimilar = document.getElementById('excludeSimilar'); // New
    const autoCopy = document.getElementById('autoCopy'); // New
    const copyButton = document.getElementById('copyButton');
    const regenerateButton = document.getElementById('regenerateButton'); // New
    const copyMessage = document.getElementById('copyMessage');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const timeValue = document.getElementById('timeValue'); // New

    // History Elements
    const toggleHistory = document.getElementById('toggleHistory');
    const historyContainer = document.getElementById('historyContainer');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // Theme Element
    const themeSwitch = document.getElementById('themeSwitch');

    // --- State ---
    let passwordHistory = [];
    let isInitialLoad = true; // Flag to prevent auto-copy on open

    // --- Password Generation ---
    function generatePassword() {
        try {
            const options = {
                length: parseInt(lengthSlider.value, 10),
                uppercase: includeUppercase.checked,
                lowercase: includeLowercase.checked,
                numbers: includeNumbers.checked,
                symbols: includeSymbols.checked,
                excludeSimilar: excludeSimilar.checked
            };

            const password = self.generatePasswordLogic(options); // Use global from utils.js

            passwordDisplay.value = password;
            updateStrengthIndicator(password);

            // Calculate and display crack time
            const entropy = self.calculateEntropyLogic(password);
            const timeToCrack = self.estimateCrackTimeLogic(entropy);
            if (timeValue) timeValue.textContent = timeToCrack;

            savePreferences();
            addToHistory(password); // Add to history

            // Auto Copy Logic
            if (autoCopy.checked && !isInitialLoad) {
                copyPassword();
            }

        } catch (error) {
            console.error("Error generating password:", error);
            passwordDisplay.value = "Error!";
        }
    }

    // --- History Functions ---
    function addToHistory(password) {
        // Prevent duplicates at the top of the stack
        if (passwordHistory.length > 0 && passwordHistory[0] === password) return;

        passwordHistory.unshift(password);
        if (passwordHistory.length > 10) {
            passwordHistory.pop();
        }
        saveHistory();
        renderHistory();
    }

    function saveHistory() {
        chrome.storage.local.set({ passwordHistory: passwordHistory });
    }

    function loadHistory() {
        chrome.storage.local.get(['passwordHistory'], (result) => {
            if (result.passwordHistory) {
                passwordHistory = result.passwordHistory;
                renderHistory();
            }
        });
    }

    function renderHistory() {
        historyList.innerHTML = '';
        passwordHistory.forEach(pwd => {
            const li = document.createElement('li');
            li.className = 'history-item';

            const span = document.createElement('span');
            span.className = 'history-pwd';
            span.textContent = pwd;

            const btn = document.createElement('button');
            btn.className = 'copy-mini-btn';
            btn.innerHTML = '📋'; // Simple copy icon
            btn.title = 'Copy';
            btn.addEventListener('click', () => {
                copyText(pwd);
            });

            li.appendChild(span);
            li.appendChild(btn);
            historyList.appendChild(li);
        });
    }

    function toggleHistoryView() {
        historyContainer.classList.toggle('hidden');
        const icon = toggleHistory.querySelector('.toggle-icon');
        icon.style.transform = historyContainer.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }

    function clearHistory() {
        passwordHistory = [];
        saveHistory();
        renderHistory();
    }

    // --- UI & State Functions ---

    function updateStrengthIndicator(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++; // Increased from 16 for better granularity
        if (password.length >= 16) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;

        // Bonus for variety
        const varietyCount = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/].filter(r => r.test(password)).length;
        if (varietyCount === 4) score++;

        strengthBar.className = 'strength-bar';
        strengthText.className = '';

        if (score <= 3) {
            strengthBar.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = 'Weak';
        } else if (score <= 5) {
            strengthBar.classList.add('medium');
            strengthText.classList.add('medium');
            strengthText.textContent = 'Medium';
        } else {
            strengthBar.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = 'Strong';
        }
    }

    function copyText(text) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            copyMessage.classList.add('show');
            setTimeout(() => {
                copyMessage.classList.remove('show');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    function copyPassword() {
        copyText(passwordDisplay.value);
    }

    function updateSliderProgress() {
        const min = lengthSlider.min;
        const max = lengthSlider.max;
        const value = lengthSlider.value;
        const percent = ((value - min) / (max - min)) * 100;
        lengthSlider.style.setProperty('--slider-progress', `${percent}%`);
    }

    function updateLengthDisplay() {
        lengthValue.textContent = lengthSlider.value;
        updateSliderProgress();
    }

    function savePreferences() {
        const preferences = {
            length: lengthSlider.value,
            uppercase: includeUppercase.checked,
            lowercase: includeLowercase.checked,
            numbers: includeNumbers.checked,
            symbols: includeSymbols.checked,
            excludeSimilar: excludeSimilar.checked, // Save new pref
            autoCopy: autoCopy.checked // Save new pref
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
                excludeSimilar.checked = prefs.excludeSimilar === true;
                autoCopy.checked = prefs.autoCopy === true;
            }
            updateLengthDisplay();
            generatePassword(); // This will also save to history immediately
            // After initial generation, set flag to false so subsequent changes trigger auto-copy
            isInitialLoad = false;
        });
    }

    // --- Theme Functions ---
    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeSwitch.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeSwitch.checked = false;
        }
    }

    function saveTheme(theme) {
        chrome.storage.local.set({ theme: theme });
    }

    function loadTheme() {
        chrome.storage.local.get(['theme'], (result) => {
            let theme = result.theme;
            if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            applyTheme(theme);
        });
    }

    // --- Event Listeners ---

    // Slider
    lengthSlider.addEventListener('input', () => {
        updateLengthDisplay();
        generatePassword();
    });

    // Checkboxes
    const allCheckboxes = [includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, autoCopy];
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', generatePassword);
    });

    // Buttons
    copyButton.addEventListener('click', copyPassword);
    if (regenerateButton) regenerateButton.addEventListener('click', generatePassword);

    // History
    toggleHistory.addEventListener('click', toggleHistoryView);
    clearHistoryBtn.addEventListener('click', clearHistory);

    // Theme
    themeSwitch.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'light' : 'dark';
        applyTheme(newTheme);
        saveTheme(newTheme);
    });

    // --- Initialization ---
    loadTheme();
    loadHistory();
    loadPreferences();
});