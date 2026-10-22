// runs once when the settings page loads
const initSettingsPage = () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    settingsTheme = document.querySelectorAll('[name="settings-theme"]');
    settingsThemeDark = document.getElementById('settings-theme-dark');
    settingsThemeLight = document.getElementById('settings-theme-light');
    settingsThemeSystem = document.getElementById('settings-theme-system');
    settingsCurrencySelect = document.getElementById('settings-currency');
    settingsDeleteAll = document.getElementById('delete-data-btn');
    
    settingsLanguageSelect = document.getElementById('settings-language');
    settingsLanguageSelect.value = getActiveLanguage(); // shows the saved language when the page opens

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

    settingsLanguageSelect.addEventListener('change', () => {
        safeSetItem('language', settingsLanguageSelect.value);
        document.documentElement.lang = settingsLanguageSelect.value; // helps screen readers and Google
        applyTranslations(); // updates the menu right away, no reload needed
        fillCurrencyOptions(); // rebuilds the currency names in the new language
        updatePageMeta(window.location.pathname); // tab title changes right away
    });

    settingsDeleteAll.addEventListener('click', deleteAllData)

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

// deletes all data
const deleteAllData = async () => {
    const ok = await showConfirm(t('confirm.deleteAll'));
    if (!ok) return; // user clicked Cancel

    saveTransactions([]);
    saveBudgets([]);
    showToast(t('toast.dataDeleted'));
}