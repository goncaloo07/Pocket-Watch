const initSettingsPage = () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    settingsTheme = document.querySelectorAll('[name="settings-theme"]');
    settingsThemeDark = document.getElementById('settings-theme-dark');
    settingsThemeLight = document.getElementById('settings-theme-light');
    settingsThemeSystem = document.getElementById('settings-theme-system');
    settingsCurrencySelect = document.getElementById('settings-currency');
    settingsDeleteAll = document.getElementById('delete-data-btn');
    settingsExportData = document.getElementById('export-data-btn');
    settingsImportBtn = document.getElementById('import-data-btn');
    settingsImportInput = document.getElementById('import-data-input');
    
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
 
    settingsImportBtn.addEventListener('click', () => settingsImportInput.click());
 
    settingsImportInput.addEventListener('change', handleImportFile);
 
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
    showToast(t('toast.dataDeleted'), 4000, 'success');
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
 
const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return; // user closed the picker without choosing
    const text = (await file.text()).replace(/^\uFEFF/, '').trim();
    e.target.value = ''; // lets the user pick the same file again later
 
    const format = detectImportFormat(text);
    let data = null;
    if (format === 'json') data = parseJSONImport(text);
    else if (format === 'csv') data = parseCSVImport(text);
 
    if (!data) {
        showToast(t('toast.importInvalid'), 6000); // not a file we understand
        return;
    }
    await applyImport(data, format);
};
 
const detectImportFormat = (text) => {
    if (text.startsWith('{')) return 'json'; // our JSON export always starts with {
    if (text.split('\n')[0].includes(';')) return 'csv';
    return null;
};
 
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && formatDateISO(parseDateISO(s)) === s;
 
const isKnownCurrency = (code) => code === undefined || ratesCache?.rates[code] !== undefined;
 
const isSafeTransaction = (tr) => {
    if (!isValidTransaction(tr)) return false;
    if (!isISODate(tr.transactionDate) || !(tr.transactionDate <= getTodayISO())) return false;
    if (tr.transactionType === 'spending') {
        if (!CATEGORIES_SPENDING.includes(tr.transactionCat)) return false
        if (tr.transactionAmount >= 0) return false
    } else {
        if (!CATEGORIES_RECEIVING.includes(tr.transactionCat)) return false
        if (tr.transactionAmount <= 0) return false
    }
    if (!isKnownCurrency(tr.transactionCurrency)) return false
    return true;
};
 
const isSafeBudget = (b) => {
    if (!isValidBudget(b)) return false;
    if (b.budgetCat !== GENERAL_BUDGET_CAT && !CATEGORIES_SPENDING.includes(b.budgetCat)) return false;
    if (b.budgetLimit <= 0 || !isISODate(b.budgetCreatedAt) || !isKnownCurrency(b.budgetCurrency)) return false;
    if (b.budgetPeriod === 'date') {
        if (!isISODate(b.budgetEndDate)) return false
    }
    return true;
};
 
// returns { transactions, budgets } or null if the file is not a valid export
const parseJSONImport = (text) => {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        return null; // broken JSON
    }
    if (data.version !== 1 || !Array.isArray(data.transactions) || !Array.isArray(data.budgets)) return null
    const transactions = data.transactions.filter(isSafeTransaction);
    const seenCats = new Set();
    const budgets = data.budgets
        .filter(isSafeBudget)
        .filter(b => !isBudgetExpired(b))
        .filter(b => {
            if (seenCats.has(b.budgetCat)) return false;
            seenCats.add(b.budgetCat);
            return true;
        });
    const hadItems = data.transactions.length + data.budgets.length > 0;
    if (hadItems && transactions.length === 0 && budgets.length === 0) return null;
    return { transactions, budgets };
};
 
// splits one CSV line into its columns, respecting quotes
const splitCSVLine = (line) => {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"' && line[i + 1] === '"') {
                current += '"'; // two quotes in a row mean one real quote
                i++;            // skip the second one
            } else if (char === '"') {
                inQuotes = false; // the quoted part ended
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ';') {
            cols.push(current); // column finished
            current = '';
        } else {
            current += char;
        }
    }
    cols.push(current); // the last column has no ";" after it
    return cols;
};
 
// "Despesa" or "Spending" -> 'spending'; unknown -> null
const typeFromText = (text) => {
    for (const lang of Object.values(TRANSLATIONS)) {
        if (text === lang['common.spending']) return 'spending';
        if (text === lang['common.receiving']) return 'receiving';
    }
    return null;
};
 
// "Alimentação" or "Food" -> 'Food'; unknown -> null
const catFromText = (text) => {
    for (const lang of Object.values(TRANSLATIONS)) {
        const key = Object.keys(lang).find(k => k.startsWith('cat.') && lang[k] === text);
        if (key) return key.slice(4);
    }
    return null;
};
 
const currencyFromText = (text) => text.match(/\(([A-Z]{3})\)/)?.[1] ?? text.trim();
 
// the export put a ' before names starting with = + - @ (Excel formula protection), so undo it
const cleanName = (text) => text.replace(/^'(?=[=+\-@])/, '');
 
// returns { transactions } or null if the file is not a valid CSV export
const parseCSVImport = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== ''); // \r\n is how Excel ends lines
    const dataLines = lines.slice(1); // the first line is the header
    if (dataLines.length === 0) return null;
 
    const transactions = dataLines.map(line => {
        const [date, name, typeText, catText, amountText, currencyText] = splitCSVLine(line);
        const type = typeFromText(typeText);
        if (currencyText === undefined || type === null) return null;
        const amount = parseAmount(amountText); // parseAmount accepts the decimal comma
        if (isNaN(amount)) return null;
        return {
            transactionName: cleanName(name),
            transactionDate: date,
            transactionType: type,
            transactionCat: catFromText(catText),
            transactionAmount: amount.toFixed(2),
            transactionCurrency: currencyFromText(currencyText)
        };
    }).filter(tr => tr !== null && isSafeTransaction(tr)); // drops the null lines and the unsafe ones
 
    if (transactions.length === 0) return null; // nothing usable, so the next step never wipes the user's data
    return { transactions };
};
 
const applyImport = async (data, format) => {
    // the confirm text depends on the format, and shows how many items are coming
    const message = format === 'json'
        ? t('confirm.importJSON').replace('{transactions}', data.transactions.length).replace('{budgets}', data.budgets.length)
        : t('confirm.importCSV').replace('{transactions}', data.transactions.length);
 
    const ok = await showConfirm(message);
    if (!ok) return; // user clicked Cancel, nothing changes
 
    saveTransactions(data.transactions);
    if (format === 'json') saveBudgets(data.budgets);
 
    await ensureAllRates();
    showToast(t('toast.importDone'), 4000, 'success');
};