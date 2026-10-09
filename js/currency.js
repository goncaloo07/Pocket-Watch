let ratesCache = null; // loaded once, then reused

// reads data/rates.json, returns { date, base, rates } or null if it fails
const loadRates = async () => {
    if (ratesCache) return ratesCache;
    try {
        const response = await fetch("/data/rates.json");
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = await response.json();
        ratesCache = data;
        return data;
    } catch (error) {
        console.error('Could not load rates:', error);
        return null;
    }
};

// "USD" -> "US Dollar ($)"
const getCurrencyLabel = (code) => {
    const name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code);
    const symbol = getCurrencySymbol(code);
    return `${name} (${symbol})`;
};

const getCurrencySymbol = (code) => {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0).find(part => part.type === 'currency').value;
};

const getActiveCurrency = () => {
    const savedCurrency = localStorage.getItem('currency');
    return ratesCache?.rates[savedCurrency] ? savedCurrency : 'EUR';
}

const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!ratesCache) {
        console.error('Rates not loaded yet');
        return null;
    }
    const fromRate = ratesCache?.rates[fromCurrency];
    const toRate = ratesCache?.rates[toCurrency];
    if (!fromRate || !toRate) return amount;
    const baseAmount = amount / fromRate;
    return baseAmount * toRate;
};

const formatAmount = (amount) => {
    const activeCurrency = getActiveCurrency();
    return `${parseFloat(amount).toFixed(2)}${getCurrencySymbol(activeCurrency)}`;
};

const toActive = (amount, currency) => {
    const activeCurrency = getActiveCurrency();
    const converted = convertAmount(parseFloat(amount), currency || "EUR", activeCurrency);
    return converted;
}   