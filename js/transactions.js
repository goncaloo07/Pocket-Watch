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

let defaultDateFrom = ''; // the "oldest transaction" date last put in the "from" filter

// oldest transaction date or '' if there are no transactions
const getOldestTransactionDate = () => {
    const transactions = getTransactions();
    if (transactions.length === 0) return '';
    return transactions.reduce((oldest, t) =>
        t.transactionDate < oldest ? t.transactionDate : oldest
    , transactions[0].transactionDate);
};

const isValidTransaction = (t) => { // checks if the transaction object is valid, returns true or false
    return t
        && typeof t.transactionName === 'string'
        && typeof t.transactionDate === 'string'
        && (t.transactionType === 'spending' || t.transactionType === 'receiving')
        && typeof t.transactionCat === 'string'
        && !isNaN(parseFloat(t.transactionAmount));
};

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
    // only refresh what's actually visible
    if (window.location.pathname === '/transactions') {
        renderAllTransactions(); // this one updates the full list on the transactions page
        setupAmountFilter();
    } else {
        renderTransactions();
        renderSpendingReceiving();
        renderBalance();
        renderChart();
        renderBudgets();
    }
};

// reads transactions from localStorage, creating an empty list if none exist yet
const getTransactions = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem('transactions'));
        return (Array.isArray(parsed) ? parsed : []).filter(isValidTransaction);
    } catch {
        safeSetItem('transactions', '[]');
        return [];
    }
};

// saves transactions to localStorage
const saveTransactions = (transactions) => {
    safeSetItem('transactions', JSON.stringify(transactions));
};

const initTransactionsPage = () => {
    transactionsPageListEl = document.getElementById('transactions-list');
    transactionsPageEmptyDiv = document.getElementById('transactions-empty');
    transactionsPageListDiv = document.getElementById('transactions-list-div');
    transactionsPageAddTransactionBtn = document.getElementById('add-transaction-btn');
    transactionsPageAddTransactionBtnEmpty = document.getElementById('add-transaction-btn-empty');
    filterPanel = document.getElementById('filter-panel')
    filterToggleBtn = document.getElementById('filter-toggle-btn');
    filterMaxAmountNum = document.getElementById("filter-amount-max-value");
    filterMinAmountNum = document.getElementById("filter-amount-min-value");
    filterMaxAmount = document.getElementById("filter-amount-max");
    filterMinAmount = document.getElementById("filter-amount-min");
    transactionsNoResultsPage = document.getElementById("transactions-no-results");
    transactionFilterType = document.querySelectorAll("[name='filter-type'");
    transactionFilterCat = document.getElementById("filter-category");
    transactionFilterDateMin = document.getElementById("filter-date-from");
    transactionFilterDateMax = document.getElementById("filter-date-to");
    searchInput = document.getElementById("search-input");
    filterClearBtn = document.getElementById("filter-clear-btn");

    transactionFilterDateMax.max = getTodayISO()
    transactionFilterDateMin.max = getTodayISO()

    filterToggleBtn.addEventListener('click', toggleFilterPanel);
    transactionsPageAddTransactionBtn.addEventListener('click', () => {
        toggleTransactionModal();
    });
    transactionsPageAddTransactionBtnEmpty.addEventListener('click', () => {
        toggleTransactionModal();
     });
    transactionsPageListEl.addEventListener('click', (e) => {
        const row = e.target.closest('.transaction-row'); // finds the row that was clicked
        if (!row) return; // clicked outside a row
        openEditTransactionModal(Number(row.dataset.index)); // dataset is always text, so convert
    });
    filterMinAmount.addEventListener("input", () => {
        if (parseFloat(filterMinAmount.value) > parseFloat(filterMaxAmount.value)) {
            filterMinAmount.value = filterMaxAmount.value;
            filterMinAmountNum.textContent = filterMaxAmountNum.textContent;
        } else {
            filterMinAmountNum.textContent = `${filterMinAmount.value}€`;
        }
    });
    filterMaxAmount.addEventListener("input", () => {
        if (parseFloat(filterMaxAmount.value) < parseFloat(filterMinAmount.value)) {
            filterMaxAmount.value = filterMinAmount.value;
            filterMaxAmountNum.textContent = filterMinAmountNum.textContent;
        } else {
            filterMaxAmountNum.textContent = `${filterMaxAmount.value}€`;
        }
    });
    transactionFilterCat.addEventListener("change", renderAllTransactions);
    transactionFilterType.forEach((t) => t.addEventListener("change", renderAllTransactions));
    transactionFilterDateMin.addEventListener("change", renderAllTransactions);
    transactionFilterDateMax.addEventListener("change", renderAllTransactions);
    filterMaxAmount.addEventListener("input", renderAllTransactions);
    filterMinAmount.addEventListener("input", renderAllTransactions);
    searchInput.addEventListener("input", renderAllTransactions)
    filterClearBtn.addEventListener("click", clearFilters)
    renderAllTransactions();
    setupAmountFilter();
    fillFilterCats();
    getDefaultFilterDate();
};

const initEditTransactionModal = () => {
    editTransactionModal = document.getElementById('edit-transaction-modal-overlay');
    editTransactionForm = document.getElementById('edit-transaction-form');
    editNameInput = document.getElementById('edit-transaction-name');
    editTypeLabel = document.getElementById('edit-transaction-type');
    editAmountInput = document.getElementById('edit-transaction-amount');
    editAmountError = document.getElementById('edit-amount-error');
    editDateInput = document.getElementById('edit-transaction-date');
    editCategorySelect = document.getElementById('edit-transaction-category');
    deleteTransactionBtn = document.getElementById('delete-transaction-btn');
    editModeBtn = document.getElementById('edit-mode-btn');
    cancelEditBtn = document.getElementById('cancel-edit-btn');

    document.getElementById('close-edit-modal-btn').addEventListener('click', closeEditTransactionModal);
    editModeBtn.addEventListener('click', () => setEditMode(true));
    cancelEditBtn.addEventListener('click', cancelEdit);
    editTransactionForm.addEventListener('submit', saveEditedTransaction);
    deleteTransactionBtn.addEventListener('click', deleteTransaction);
};

// switches between view mode (fields locked) and edit mode (fields free)
const setEditMode = (isEditing) => {
    editTransactionForm.classList.toggle('editing', isEditing); // CSS uses this class to swap the buttons
    editTransactionForm.querySelectorAll('input, select').forEach(field => {
        field.disabled = !isEditing; // locked in view mode
    });
};

// goes back to view mode and puts the original values back in the fields
const cancelEdit = () => {
    openEditTransactionModal(editingIndex); // fills the fields with the original values and locks them again
};

const openEditTransactionModal = (index) => {
    editingIndex = index; // remembers which transaction is open
    const t = getTransactions()[index]; // the transaction itself
    editNameInput.value = t.transactionName;
    editTypeLabel.textContent = t.transactionType === 'spending' ? 'Spending' : 'Receiving';
    editAmountInput.value = Math.abs(t.transactionAmount);
    editDateInput.value = t.transactionDate;
    editDateInput.max = getTodayISO(); // can't edit to a future date
    // spending and receiving have different category lists
    const cats = t.transactionType === 'spending' ? CATEGORIES_SPENDING : CATEGORIES_RECEIVING;
    editCategorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    setEditMode(false); // fields start locked, only Edit unlocks them
    editTransactionModal.classList.add('open'); // shows the modal
};

const closeEditTransactionModal = () => {
    editTransactionModal.classList.remove('open');
    editingIndex = null; // no transaction open anymore
};

const saveEditedTransaction = (e) => {
    e.preventDefault();
    const transactions = getTransactions();
    const original = transactions[editingIndex]; // to know if it's spending or receiving
    const rawAmount = parseFloat(editAmountInput.value) || 0;
    if (rawAmount === 0) { // amount can't be 0
        editAmountInput.closest('.amount-input-wrap').classList.add('input-invalid');
        editAmountError.classList.remove('hidden');
        editAmountInput.focus();
        return;
    }
    const editedTransaction = {
        transactionName: editNameInput.value,
        transactionDate: editDateInput.value,
        transactionType: original.transactionType, // can't change type in edit mode
        transactionCat: editCategorySelect.value,
        transactionAmount: (original.transactionType === 'spending' ? -rawAmount : rawAmount).toFixed(2),
    };
    transactions[editingIndex] = editedTransaction;
    saveTransactions(transactions);
    closeEditTransactionModal();
    renderAllTransactions(); // refreshes the list on the transactions page
    setupAmountFilter();
}

const deleteTransaction = async () => {
    const ok = await showConfirm("Are you sure you want to delete this transaction? (This is irreversible)");
    if (!ok) return;
    const transactions = getTransactions();
    transactions.splice(editingIndex, 1); // removes the transaction at the editing index
    saveTransactions(transactions);
    closeEditTransactionModal();
    renderAllTransactions(); // refreshes the list on the transactions page
    setupAmountFilter();
}

const toggleFilterPanel = () => {
    filterPanel.classList.toggle('hidden');
}

const getMaxTransactionAmount = () => {
    const transactions = getTransactions();
    if (transactions.length === 0) return 1000;
    return transactions.reduce((max, t) => {
        const amount = Math.abs(parseFloat(t.transactionAmount));
        return amount > max ? amount : max;
    }, 0);
};

const setupAmountFilter = (curMin, curMax) => {
    const previousMax = parseFloat(filterMaxAmount.max) || 0; // the slider's max before this recalculation
    let maxAmount = getMaxTransactionAmount();
    const step = maxAmount < 50 ? 1 : 5;
    maxAmount = Math.ceil(maxAmount / step) * step;
    filterMaxAmount.step = step;
    filterMinAmount.step = step;
    filterMaxAmount.max = maxAmount;
    filterMinAmount.max = maxAmount;
    // if the slider was already at full range, keep following the new max automatically
    const newMax = (curMax === undefined || curMax >= previousMax) ? maxAmount : curMax;
    const newMin = curMin === undefined ? 0 : Math.min(curMin, newMax);
    filterMaxAmount.value = newMax;
    filterMinAmount.value = newMin;
    filterMaxAmountNum.textContent = `${newMax}€`;
    filterMinAmountNum.textContent = `${newMin}€`;
};

const fillFilterCats = (curCat = "all") => {
    const transactions = getTransactions();
    transactionFilterCat.innerHTML = '<option value="all">All categories</option>';
    const uniqueCats = new Set(transactions.map(t => t.transactionCat));
    uniqueCats.forEach(cat => {
        transactionFilterCat.innerHTML += `<option value="${cat}">${cat}</option>`
    });
    const option = transactionFilterCat.querySelector(`[value="${curCat}"]`);
    if (option) option.selected = true;
};

const getDefaultFilterDate = (minDate = 0, maxDate = 0) => {
    const transactions = getTransactions();
    if (minDate === 0 && maxDate === 0) {
        transactionFilterDateMax.value = getTodayISO();
        if (transactions.length > 0) { // avoid crashing when there are no transactions yet
            transactionFilterDateMin.value = transactions.reduce((oldest, t) => 
                t.transactionDate < oldest ? t.transactionDate : oldest
            , transactions[0].transactionDate);
        }
    } else {
        transactionFilterDateMax.value = maxDate
        transactionFilterDateMin.value = minDate;
    }
};

const clearFilters = () => {
    searchInput.value = "";
    document.getElementById("filter-type-all").checked = true;
    transactionFilterCat.value = "all";
    getDefaultFilterDate();
    setupAmountFilter();
    renderAllTransactions();
};