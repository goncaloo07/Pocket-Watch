// icon for each category, shown next to transactions
const CATEGORY_ICONS = new Map([
    ["Other", "bi-three-dots"],
    ["Food", "bi-cup-straw"],
    ["Groceries", "bi-basket"],
    ["Transport", "bi-car-front"],
    ["Housing", "bi-house-door"],
    ["Bills & Utilities", "bi-lightning-charge"],
    ["Health", "bi-heart-pulse"],
    ["Shopping", "bi-bag"],
    ["Entertainment", "bi-film"],
    ["Education", "bi-mortarboard"],
    ["Salary", "bi-briefcase"],
    ["Gift", "bi-gift"],
    ["Investment", "bi-graph-up-arrow"],
    ["Loan", "bi-cash-coin"],
    ["Refund", "bi-arrow-counterclockwise"],
    ["Freelance", "bi-laptop"],
    ["__general__", "bi-wallet2"]
])

// Date -> "YYYY-MM-DD"
const formatDateISO = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// "YYYY-MM-DD" -> Date, as local time (avoids the UTC-midnight shift of new Date(str))
const parseDateISO = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// today's date, formatted
const getTodayISO = () => formatDateISO(new Date());

// "2026-08-23" -> "23-08-2026"
const formatDateDMY = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

// validates and saves a new transaction from the form, then re-renders the whole page
const addTransaction = (e) => {
    e.preventDefault();

    const isSpending = document.getElementById('type-spending').checked; // spending or receiving
    const rawAmount = parseFloat(document.getElementById('transaction-amount').value) || 0;
    const amountInput = document.getElementById('transaction-amount');
    const amountError = document.getElementById('amount-error');

    if (rawAmount === 0) { // amount can't be 0
        amountInput.closest('.amount-input-wrap').classList.add('input-invalid');
        amountError.classList.remove('hidden');
        amountInput.focus();
        return;
    }

    amountInput.classList.remove('input-invalid');
    amountError.classList.add('hidden');

    const transaction = {
        transactionName: document.getElementById('transaction-name').value,
        transactionDate: document.getElementById('transaction-date').value,
        transactionType: isSpending ? 'spending' : 'receiving',
        transactionCat: document.getElementById(
            isSpending ? 'transaction-category-spending' : 'transaction-category-receiving'
        ).value,
        transactionAmount: (isSpending ? -rawAmount : rawAmount).toFixed(2), // spending is stored as negative
    };

    const transactions = getTransactions();
    transactions.unshift(transaction); // newest first
    saveTransactions(transactions);

    transactionForm.reset();
    toggleTransactionModal();
    // refresh every part of the UI that depends on transactions
    renderTransactions();
    renderSpendingReceiving();
    renderBalance();
    renderChart();
    renderBudgets();
};

// reads transactions from localStorage, creating an empty list if none exist yet
const getTransactions = () => {
    try {
        return JSON.parse(localStorage.getItem('transactions')) ?? [];
    } catch {
        localStorage.setItem('transactions', '[]');
        return [];
    }
};

// saves transactions to localStorage
const saveTransactions = (transactions) => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
};