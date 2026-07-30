// DOM references 
const addTransactionBtn = document.getElementById('add-transaction-btn');
const transactionModal = document.getElementById('transaction-modal-overlay');
const closeTransactionModalBtn = document.getElementById('close-modal-btn');
const cancelTransactionModalBtn = document.getElementById('cancel-transaction-btn');
const transactionForm = document.getElementById('transaction-form');
const transactionsEmptyDiv = document.getElementById('transactions-empty');
const transactionsListEl = document.getElementById('transactions-list');
const transactionModalCatSpending = document.getElementById("transaction-category-spending");
const transactionModalCatReceiving = document.getElementById("transaction-category-receiving");
const balanceValue = document.getElementById("balance-value");
const balanceDiv = document.getElementById("balance-div");
const balanceEl = document.getElementById('balance-value');
const chartMode = document.querySelectorAll('[name="chart-mode"]');
const addBudgetBtn = document.getElementById("add-budget-btn");
const budgetModal = document.getElementById("budget-modal-overlay");
const closeBudgetModalBtn = document.getElementById("close-budget-modal-btn");
const cancelBudgetModalBtn = document.getElementById("cancel-budget-btn");
const budgetCategory = document.getElementById("budget-category-spending");
const budgetLimit = document.getElementById("budget-limit");
const budgetLimitInput = document.getElementById("budget-limit-input");
const budgetLimitValue = document.getElementById("budget-limit-value");
const budgetForm = document.getElementById("budget-form");
const budgetLimitError = document.getElementById("budget-limit-error");
const budgetEmpty = document.getElementById("budget-empty");
const budgetList = document.getElementById("budget-list");

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
    }
};

const toggleBudgetModal = () => { // opens and closes the modal
    const isOpen = budgetModal.classList.toggle("open");
    if (isOpen) {  // if its open, the categories will be built from the available categories that dont have a budget yet
        budgetCategory.innerHTML = "";
        const usedCats = getCats()
        for (const cat of CATEGORIES_SPENDING) {
            if (!usedCats.includes(cat)) {
                budgetCategory.innerHTML += `
                    <option value="${cat}">${cat}</option>
                `;
            }
        }
    }
}

// Initializing functions
document.addEventListener('header:loaded', initHeader);
document.addEventListener('menu:loaded', initMenu);
document.addEventListener("footer:loaded", initFooter);

addTransactionBtn.addEventListener('click', toggleTransactionModal);
closeTransactionModalBtn.addEventListener('click', toggleTransactionModal);
cancelTransactionModalBtn.addEventListener('click', toggleTransactionModal);
transactionForm.addEventListener('submit', addTransaction);
chartMode.forEach((mode => mode.addEventListener("change", renderChart)));
addBudgetBtn.addEventListener("click", toggleBudgetModal);
closeBudgetModalBtn.addEventListener("click", toggleBudgetModal);
cancelBudgetModalBtn.addEventListener("click", toggleBudgetModal);
budgetForm.addEventListener('submit', addBudget);

budgetLimitValue.addEventListener("click", () => { // if clicked, the value of the budget will turn into a input
    budgetLimitValue.classList.add("hidden");
    budgetLimitInput.classList.remove("hidden");
    budgetLimitInput.focus();
})

budgetLimitInput.addEventListener('blur', () => { // if the input is not hovered or written on, the slider will become the number that the user has wrote and the value too
    let value = parseFloat(budgetLimitInput.value);
    if (isNaN(value) || value < 0) { // if the value is not a number or below 0, it defaults to 0
        value = 0;
    }
    const sliderMax = parseFloat(budgetLimit.max);
    const sliderValue = Math.min(value, sliderMax); // if the number is above the max of the slider, the slider will default to the max number but the value will remain the one the user chose
    value = value.toFixed(2);
    budgetLimitValue.textContent = `${value}€`;
    budgetLimit.value = sliderValue;
    budgetLimitInput.value = parseFloat(value);
    budgetLimitInput.classList.add("hidden");
    budgetLimitValue.classList.remove("hidden");
});

budgetLimit.addEventListener("input", (e) => {
    if (parseFloat(e.target.value) > 0) { // if the number is no longer 0 it will remove the error
        budgetLimitError.classList.add('hidden');
        e.target.closest('.budget-slider-wrap').classList.remove('input-invalid');
    }
    budgetLimitInput.value = e.target.value;
    budgetLimitValue.textContent = e.target.value + "€"; // turns the value into the number the user has chosen
})

document.getElementById('transaction-amount').addEventListener('input', (e) => {
    if (parseFloat(e.target.value) > 0) { // if the number is no longer 0 it will remove the error
        document.getElementById('amount-error').classList.add('hidden');
        e.target.closest('.amount-input-wrap').classList.remove('input-invalid');
    }
});

renderTransactions();
renderSpendingReceiving();
renderBalance();
renderChart();
renderBudgets();