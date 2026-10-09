// runs once when the settings page loads
const initSettingsPage = () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    settingsTheme = document.querySelectorAll('[name="settings-theme"]');
    settingsThemeDark = document.getElementById('settings-theme-dark');
    settingsThemeLight = document.getElementById('settings-theme-light');
    settingsThemeSystem = document.getElementById('settings-theme-system');
    settingsCurrencySelect = document.getElementById('settings-currency');
    if (savedTheme === 'dark') {
        settingsThemeDark.checked = true;
    } else if (savedTheme === 'light') {
        settingsThemeLight.checked = true;
    } else {
        settingsThemeSystem.checked = true;
    }

    settingsTheme.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (settingsThemeDark.checked) {
                setTheme('dark');
            } else if (settingsThemeLight.checked) {
                setTheme('light');
            } else {
                localStorage.removeItem('theme');
                applyTheme(resolveTheme());
            }
        });
    });

    settingsCurrencySelect.addEventListener('change', () => {
        const selectedCurrency = settingsCurrencySelect.value;
        safeSetItem('currency', selectedCurrency);
    });

    fillCurrencyOptions();
};

// fills the currency dropdown with the currencies from rates.json
const fillCurrencyOptions = async () => {
    const data = await loadRates();
    if (!data) return; // keeps the options that are already in the HTML
    settingsCurrencySelect.innerHTML = ''; // clears the options that are already in the HTML
    Object.keys(data.rates).forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = getCurrencyLabel(code);
        settingsCurrencySelect.appendChild(option);
    });
    const savedCurrency = localStorage.getItem('currency');
    settingsCurrencySelect.value = data.rates[savedCurrency] ? savedCurrency : 'EUR';
};