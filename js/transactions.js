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
]) //icon for each category

const formatDateISO = (date) => { // formats the date
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getTodayISO = () => formatDateISO(new Date()); // gets todays date, formatted

const addTransaction = (e) => {
    e.preventDefault();

    const isSpending = document.getElementById('type-spending').checked; //checks if its spending or receiving
    const rawAmount = parseFloat(document.getElementById('transaction-amount').value) || 0; //gets the amount of the transaction
    const amountInput = document.getElementById('transaction-amount');
    const amountError = document.getElementById('amount-error');

    if (rawAmount === 0) { // doesn't let the amount of a transaction be 0
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
        transactionAmount: (isSpending ? -rawAmount : rawAmount).toFixed(2),
    };

    const transactions = getTransactions();
    transactions.unshift(transaction);
    saveTransactions(transactions); //adds the transaction to the localStorage

    transactionForm.reset();
    toggleTransactionModal();
    renderTransactions();
    renderSpendingReceiving();
    renderBalance();
    renderChart();
    renderBudgets();
};

const getTransactions = () => { //if there is a transactions in localStorage, it will return it, if not it will create it
    try {
        return JSON.parse(localStorage.getItem('transactions')) ?? [];
    } catch {
        localStorage.setItem('transactions', '[]');
        return [];
    }
};

const saveTransactions = (transactions) => {
    localStorage.setItem('transactions', JSON.stringify(transactions)); //sends the transactions to localStorage
};