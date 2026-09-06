// DOM references, filled in later inside initHomePage() once the home page's
// HTML actually exists in the page (can't grab elements that aren't loaded yet)
let addTransactionBtn,
    transactionModal,
    closeTransactionModalBtn,
    cancelTransactionModalBtn,
    transactionForm,
    transactionsEmptyDiv,
    transactionsListEl,
    transactionModalCatSpending,
    transactionModalCatReceiving,
    balanceValue,
    balanceDiv,
    balanceEl,
    chartMode,
    noSpendingDiv,
    spendingListEl,
    noReceivingDiv,
    receivingListEl,
    addBudgetBtn,
    budgetModal,
    closeBudgetModalBtn,
    cancelBudgetModalBtn,
    budgetCategory,
    budgetLimit,
    budgetLimitInput,
    budgetLimitValue,
    budgetForm,
    budgetLimitError,
    budgetEmpty,
    budgetList,
    budgetPeriodInputs,
    budgetRecurringUnit,
    budgetEndDateInput,
    budgetEndDateError,
    balanceChartDiv,
    balanceSummaryDiv,
    balancePeriodInputs,
    balancePoints,
    balanceTooltip,
    balanceHoverPoints;

let toastEl = document.getElementById("toast"); // the toast notification that pops up in the bottom right corner
let toastTimeout;

// list of categories shown in the "Category" dropdown when adding a spending transaction
// (or a budget, since budgets are always tied to a spending category)
const CATEGORIES_SPENDING = [
    "Other",
    "Food",
    "Groceries",
    "Transport",
    "Housing",
    "Bills & Utilities",
    "Health",
    "Shopping",
    "Entertainment",
    "Education"
];

// same idea but for receiving (income) transactions
const CATEGORIES_RECEIVING = [
    "Other",
    "Salary",
    "Gift",
    "Investment",
    "Loan",
    "Refund",
    "Freelance"
];

// opens/closes the "Add Transaction" modal. When opening, resets the form to
// today's date and rebuilds the category dropdowns from scratch
const toggleTransactionModal = () => {
    const isOpen = transactionModal.classList.toggle('open');
    if (isOpen) { // if its open, the date will be defaulted to the real date and the categories will be built from the available categories
        transactionModalCatSpending.innerHTML = "";
        transactionModalCatReceiving.innerHTML = "";
        document.getElementById('transaction-date').value = getTodayISO();
        CATEGORIES_SPENDING.forEach(category => {
            transactionModalCatSpending.innerHTML += `
                <option value="${category}">${category}</option>
            `;
        })
        CATEGORIES_RECEIVING.forEach(category => {
            transactionModalCatReceiving.innerHTML += `
                <option value="${category}">${category}</option>
            `;
        })
    } else {
        // closing: reset the form and clear any leftover "amount can't be 0" error
        transactionForm.reset();
        document.getElementById('transaction-amount').closest('.amount-input-wrap').classList.remove('input-invalid');
        document.getElementById('amount-error').classList.add('hidden');
    }
};

// opens/closes the "Add Budget" modal. When opening, only shows categories that
// don't already have a budget (e.g. if "Food" already has a budget, it won't show up again)
const toggleBudgetModal = () => {
    const isOpen = budgetModal.classList.toggle("open");
    if (isOpen) {  // if its open, the categories will be built from the available categories that dont have a budget yet
        budgetCategory.innerHTML = "";
        const usedCats = getCats()
        if (!usedCats.includes(GENERAL_BUDGET_CAT)) {
            budgetCategory.innerHTML += `<option value="${GENERAL_BUDGET_CAT}">General</option>`;
        }
        for (const cat of CATEGORIES_SPENDING) {
            if (!usedCats.includes(cat)) {
                budgetCategory.innerHTML += `
                    <option value="${cat}">${cat}</option>
                `;
            }
        }
        // reset the "renews" section back to its default: recurring, monthly
        document.getElementById("budget-period-recurring").checked = true;
        budgetRecurringUnit.value = 'monthly';

        // the "until date" option can't be today or earlier, so default it to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        budgetEndDateInput.value = formatDateISO(tomorrow);
        budgetEndDateInput.min = formatDateISO(tomorrow);
    } else {
        // closing: reset the form and clear any leftover validation errors
        budgetForm.reset();
        budgetLimitValue.textContent = `${budgetLimit.value}€`;
        budgetLimitInput.value = budgetLimit.value;
        budgetLimitInput.closest('.budget-slider-wrap').classList.remove('input-invalid');
        budgetLimitError.classList.add('hidden');
        budgetEndDateInput.classList.remove('input-invalid');
        budgetEndDateError.classList.add('hidden');
    }
}

// runs once when the home page loads. Grabs all the DOM refs (now that the
// home page HTML actually exists), wires up every button/input, and does the first render
const initHomePage = () => {
    initChart();
    
    // grab every element we'll need to read from or update later
    addTransactionBtn = document.getElementById('add-transaction-btn');
    transactionModal = document.getElementById('transaction-modal-overlay');
    closeTransactionModalBtn = document.getElementById('close-modal-btn');
    cancelTransactionModalBtn = document.getElementById('cancel-transaction-btn');
    transactionForm = document.getElementById('transaction-form');
    transactionsEmptyDiv = document.getElementById('transactions-empty');
    transactionsListEl = document.getElementById('transactions-list');
    transactionModalCatSpending = document.getElementById("transaction-category-spending");
    transactionModalCatReceiving = document.getElementById("transaction-category-receiving");
    balanceValue = document.getElementById("balance-value");
    balanceDiv = document.getElementById("balance-div");
    balanceEl = document.getElementById('balance-value');
    chartMode = document.querySelectorAll('[name="chart-mode"]');
    noSpendingDiv = document.getElementById('no-spending');
    spendingListEl = document.getElementById('spending-list');
    noReceivingDiv = document.getElementById('no-receiving');
    receivingListEl = document.getElementById('receiving-list');
    addBudgetBtn = document.getElementById("add-budget-btn");
    budgetModal = document.getElementById("budget-modal-overlay");
    closeBudgetModalBtn = document.getElementById("close-budget-modal-btn");
    cancelBudgetModalBtn = document.getElementById("cancel-budget-btn");
    budgetCategory = document.getElementById("budget-category-spending");
    budgetLimit = document.getElementById("budget-limit");
    budgetLimitInput = document.getElementById("budget-limit-input");
    budgetLimitValue = document.getElementById("budget-limit-value");
    budgetForm = document.getElementById("budget-form");
    budgetLimitError = document.getElementById("budget-limit-error");
    budgetEmpty = document.getElementById("budget-empty");
    budgetList = document.getElementById("budget-list");
    budgetPeriodInputs = document.querySelectorAll('[name="budget-period"]');
    budgetRecurringUnit = document.getElementById("budget-recurring-unit");
    budgetEndDateInput = document.getElementById("budget-end-date");
    budgetEndDateError = document.getElementById("budget-end-date-error");

    // wire up the transaction modal's open/close/save buttons
    addTransactionBtn.addEventListener('click', toggleTransactionModal);
    closeTransactionModalBtn.addEventListener('click', toggleTransactionModal);
    cancelTransactionModalBtn.addEventListener('click', toggleTransactionModal);
    transactionForm.addEventListener('submit', addTransaction);
    chartMode.forEach((mode => mode.addEventListener("change", renderChart))); // switching "By Category" / "Spending vs Receiving" redraws the chart
    addBudgetBtn.addEventListener("click", toggleBudgetModal);
    closeBudgetModalBtn.addEventListener("click", toggleBudgetModal);
    cancelBudgetModalBtn.addEventListener("click", toggleBudgetModal);
    budgetForm.addEventListener('submit', addBudget);

    // clicking the "100€" text swaps it for an editable number input, so the
    // user can type an exact value instead of only dragging the slider
    budgetLimitValue.addEventListener("click", () => {
        budgetLimitValue.classList.add("hidden");
        budgetLimitInput.classList.remove("hidden");
        budgetLimitInput.focus();
    });

    // when the user finishes typing in that number input (clicks away), validate
    // it, sync it back to the slider, and swap back to the plain text display
    budgetLimitInput.addEventListener('blur', () => {
        let value = parseFloat(budgetLimitInput.value);
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        const sliderMax = parseFloat(budgetLimit.max);
        const sliderValue = Math.min(value, sliderMax); // slider can't go higher than its own max, e.g. typing 5000€ still caps the slider at 1000€
        value = value.toFixed(2);
        budgetLimitValue.textContent = `${value}€`;
        budgetLimit.value = sliderValue;
        budgetLimitInput.value = parseFloat(value);
        budgetLimitInput.classList.add("hidden");
        budgetLimitValue.classList.remove("hidden");
    });

    // don't let the number input go negative while typing
    budgetLimitInput.addEventListener('input', () => {
        if (budgetLimitInput.value < 0) {
            budgetLimitInput.value = 0;
        }
    });

    // dragging the slider keeps the number input and its text label in sync,
    // and clears the "must be greater than 0€" error as soon as it's fixed
    budgetLimit.addEventListener("input", (e) => {
        if (parseFloat(e.target.value) > 0) {
            budgetLimitError.classList.add('hidden');
            e.target.closest('.budget-slider-wrap').classList.remove('input-invalid');
        }
        budgetLimitInput.value = e.target.value;
        budgetLimitValue.textContent = e.target.value + "€";
    });

    // clears the "end date must be after today" error as soon as the user picks a new date
    budgetEndDateInput.addEventListener('input', () => {
        budgetEndDateError.classList.add('hidden');
        budgetEndDateInput.classList.remove('input-invalid');
    });

    // clears the "amount must be greater than 0€" error as soon as a valid amount is typed
    document.getElementById('transaction-amount').addEventListener('input', (e) => {
        if (parseFloat(e.target.value) > 0) {
            document.getElementById('amount-error').classList.add('hidden');
            e.target.closest('.amount-input-wrap').classList.remove('input-invalid');
        }
    });

    // first render of the home page, using whatever is already saved in localStorage
    renderTransactions();
    renderSpendingReceiving();
    renderBalance();
    renderChart();
    renderBudgets();
};

const showToast = (message, duration = 4000) => {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.add("hidden");
    }, duration);
};

const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        showToast("Error saving data. Your changes may not be saved.", 6000);
        console.error("Error saving to localStorage:", e);
        return false;
    }
}

removeExpiredBudgets(); // removes expired budgets from localStorage on first load, so the user doesn't see them anymore

// fires every time the router swaps in a new page (including on first load),
// so this decides which page's init function to run based on the current path
document.addEventListener('page:loaded', (e) => {
    if (e.detail.path === '/') initHomePage();
    if (e.detail.path === '/balance') initBalancePage();
});