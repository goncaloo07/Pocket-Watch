// runs once when the settings page loads
const initSettingsPage = () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    settingsTheme = document.querySelectorAll('[name="settings-theme"]');
    settingsThemeDark = document.getElementById('settings-theme-dark');
    settingsThemeLight = document.getElementById('settings-theme-light');
    settingsThemeSystem = document.getElementById('settings-theme-system');
    settingsCurrencySelect = document.getElementById('settings-currency');
    settingsDeleteAll = document.getElementById('delete-data-btn');
    settingsExportData = document.getElementById('export-data-btn');
    
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

    settingsDeleteAll.addEventListener('click', deleteAllData);

    settingsExportData.addEventListener('click', openExportModal);

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

// content: the text, filename: name of the saved file, type: the MIME type
const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type }); // file that lives only in memory
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url); // frees the memory
};

const exportJSON = () => {
    const data = {
        version: 1,
        exportedAt: getTodayISO(),
        transactions: getTransactions(),
        budgets: getBudgets()
    };
    downloadFile(JSON.stringify(data, null, 2), `pocket-watch-${getTodayISO()}.json`, 'application/json')
};

// wraps text in quotes, doubles inner quotes, blocks Excel formulas
const csvCell = (value) => {
    let text = String(value);
    if (/^[=+\-@]/.test(text)) text = "'" + text; // Excel would run it as a formula
    return `"${text.replace(/"/g, '""')}"`;
};

const exportCSV = () => {
    const headers = [t('common.date'), t('common.name'), t('common.type'), t('common.category'), t('common.amount'), t('common.currency'), `${t('common.balance')} ${getCurrencyShortLabel(getActiveCurrency())}`];

    // oldest first; reverse() first so same-day transactions keep the order they were added
    const ordered = [...getTransactions()].reverse()
        .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

    let balance = 0;
    const rows = ordered.map(tr => {
        balance += toActive(tr.transactionAmount, tr.transactionCurrency, tr.transactionDate);
        return [
            tr.transactionDate,
            csvCell(tr.transactionName),
            t('common.' + tr.transactionType),
            csvCell(tCat(tr.transactionCat)),
            String(tr.transactionAmount).replace('.', ','),
            getCurrencyShortLabel(tr.transactionCurrency || 'EUR'),
            balance.toFixed(2).replace('.', ',')
        ]
    });

    rows.reverse();

    const lines = [headers, ...rows].map(row => row.join(';'));
    const csv = '\uFEFF' + lines.join('\n');
    downloadFile(csv, `pocket-watch-${getTodayISO()}.csv`, 'text/csv;charset=utf-8')
};