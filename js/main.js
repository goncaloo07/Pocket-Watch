// DOM references 
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
    budgetEndDateError;

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

const CATEGORIES_RECEIVING = [
    "Other",
    "Salary",
    "Gift",
    "Investment",
    "Loan",
    "Refund",
    "Freelance"
];

const toggleTransactionModal = () => { //opens and closes the modal and gets the default date for the date input
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
        transactionForm.reset();
        document.getElementById('transaction-amount').closest('.amount-input-wrap').classList.remove('input-invalid');
        document.getElementById('amount-error').classList.add('hidden');
    }
};

const toggleBudgetModal = () => { // opens and closes the modal
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
        document.getElementById("budget-period-recurring").checked = true;
        budgetRecurringUnit.value = 'monthly';
        budgetEndDateInput.value = getTodayISO();
    } else {
        budgetForm.reset();
        budgetLimitValue.textContent = `${budgetLimit.value}€`;
        budgetLimitInput.value = budgetLimit.value;
        budgetLimitInput.closest('.budget-slider-wrap').classList.remove('input-invalid');
        budgetLimitError.classList.add('hidden');
        budgetEndDateInput.classList.remove('input-invalid');
        budgetEndDateError.classList.add('hidden');
    }
}

const initHomePage = () => {
    initChart();
    
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

    addTransactionBtn.addEventListener('click', toggleTransactionModal);
    closeTransactionModalBtn.addEventListener('click', toggleTransactionModal);
    cancelTransactionModalBtn.addEventListener('click', toggleTransactionModal);
    transactionForm.addEventListener('submit', addTransaction);
    chartMode.forEach((mode => mode.addEventListener("change", renderChart)));
    addBudgetBtn.addEventListener("click", toggleBudgetModal);
    closeBudgetModalBtn.addEventListener("click", toggleBudgetModal);
    cancelBudgetModalBtn.addEventListener("click", toggleBudgetModal);
    budgetForm.addEventListener('submit', addBudget);

    budgetLimitValue.addEventListener("click", () => {
        budgetLimitValue.classList.add("hidden");
        budgetLimitInput.classList.remove("hidden");
        budgetLimitInput.focus();
    });

    budgetLimitInput.addEventListener('blur', () => {
        let value = parseFloat(budgetLimitInput.value);
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        const sliderMax = parseFloat(budgetLimit.max);
        const sliderValue = Math.min(value, sliderMax);
        value = value.toFixed(2);
        budgetLimitValue.textContent = `${value}€`;
        budgetLimit.value = sliderValue;
        budgetLimitInput.value = parseFloat(value);
        budgetLimitInput.classList.add("hidden");
        budgetLimitValue.classList.remove("hidden");
    });

    budgetLimit.addEventListener("input", (e) => {
        if (parseFloat(e.target.value) > 0) {
            budgetLimitError.classList.add('hidden');
            e.target.closest('.budget-slider-wrap').classList.remove('input-invalid');
        }
        budgetLimitInput.value = e.target.value;
        budgetLimitValue.textContent = e.target.value + "€";
    });

    budgetEndDateInput.addEventListener('input', () => {
        budgetEndDateError.classList.add('hidden');
        budgetEndDateInput.classList.remove('input-invalid');
    });

    document.getElementById('transaction-amount').addEventListener('input', (e) => {
        if (parseFloat(e.target.value) > 0) {
            document.getElementById('amount-error').classList.add('hidden');
            e.target.closest('.amount-input-wrap').classList.remove('input-invalid');
        }
    });

    renderTransactions();
    renderSpendingReceiving();
    renderBalance();
    renderChart();
    renderBudgets();
};

// Initializing functions
document.addEventListener('header:loaded', initHeader);
document.addEventListener('menu:loaded', initMenu);
document.addEventListener("footer:loaded", initFooter);
document.addEventListener('page:loaded', (e) => {
    if (e.detail.path === '/') initHomePage();
    if (e.detail.path === '/balance') initBalancePage();
});