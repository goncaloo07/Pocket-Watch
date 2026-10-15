let ratesCache = null; // loaded once, then reused
let pastRates = {};
const monthRequests = new Map(); // month -> its request, so each month is only asked once

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

const convertAmount = (amount, fromCurrency, toCurrency, date) => {
    if (fromCurrency === toCurrency) return amount;
    const rates = getRatesForDate(date); // rates of that day, or the latest ones if there is no date
    const fromRate = rates?.[fromCurrency];
    const toRate = rates?.[toCurrency];
    if (!fromRate || !toRate) return amount; // cannot convert, show the value as it is
    return amount / fromRate * toRate;
};

const formatAmount = (amount) => {
    const activeCurrency = getActiveCurrency();
    return `${parseFloat(amount).toFixed(2)}${getCurrencySymbol(activeCurrency)}`;
};

const toActive = (amount, currency, date) => {
    return convertAmount(parseFloat(amount), currency || "EUR", getActiveCurrency(), date);
};

const loadMonthRates = async (month) => { // month looks like "2026-06"
    try {
        const [year, monthNumber] = month.split('-').map(Number);
        // start: day 1 of the month minus 7 days
        const start = parseDateISO(`${month}-01`);
        start.setDate(start.getDate() - 7);
        // end: last day of the month, but never after today
        const lastDay = formatDateISO(new Date(year, monthNumber, 0)); // day 0 = last day of the previous month, so monthNumber gives this month's last day
        const end = lastDay > getTodayISO() ? getTodayISO() : lastDay;
        const url = `https://api.frankfurter.dev/v1/${formatDateISO(start)}..${end}?base=EUR`;
        // gives up after 5 seconds, so a slow API never leaves the page waiting for too long
        const response = await fetch(url, { cache: "force-cache", signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = await response.json();
        // save each day in pastRates, with EUR: 1 added
        Object.entries(data.rates).forEach(([date, rates]) => {
            pastRates[date] = { EUR: 1, ...rates };
        });
    } catch (error) {
        console.error('Could not load rates for', month, error);
    }
};

// the rates for a date: the closest day on or before it, or the latest rates if there is none
const getRatesForDate = (date) => {
    if (!ratesCache) return undefined; // rates.json did not load
    if (date >= ratesCache.date) return ratesCache.rates; // the latest rates day or later
    const days = Object.keys(pastRates).filter(d => d <= date).sort(); // loaded days on or before the date
    if (days.length === 0) return ratesCache.rates; // nothing loaded for that date
    return pastRates[days[days.length - 1]]; // the closest one
};

const loadMonthOnce = (month) => {
    if (!monthRequests.has(month)) monthRequests.set(month, loadMonthRates(month));
    return monthRequests.get(month);
};

// makes sure the rates of every month used by these dates are loaded
const ensureRatesFor = async (dates) => {
    if (!ratesCache) return; // rates.json did not load, nothing to compare with
    const months = new Set(
        dates
            .filter(date => date < ratesCache.date) // from the latest rates day onwards, rates.json is enough
            .map(date => date.slice(0, 7)) // "2026-06-05" -> "2026-06"
    );
    await Promise.all([...months].map(loadMonthOnce)); // all months at the same time
};

// loads the rates for every transaction and budget the app has
const ensureAllRates = () => ensureRatesFor([
    ...getTransactions().map(t => t.transactionDate),
    ...getBudgets().map(b => b.budgetCreatedAt)
]);

const getActiveSymbol = () => getCurrencySymbol(getActiveCurrency());