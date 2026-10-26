const GENERAL_BUDGET_CAT = "__general__"; // special category for the budget that counts all spending

let budgetsCache = null;
let budgetsCacheDate = null; // the day the cache was built (YYYY-MM-DD)

const isValidBudget = (b) => { // checks if the budget object is valid, returns true or false
    return b
        && typeof b.budgetCat === 'string'
        && !isNaN(parseFloat(b.budgetLimit))
        && (b.budgetPeriod === 'recurring' || b.budgetPeriod === 'date')
        && typeof b.budgetCreatedAt === 'string'
        && ((b.budgetPeriod === 'recurring' && ['weekly', 'monthly', 'yearly'].includes(b.budgetUnit)) || (b.budgetPeriod === 'date' && typeof b.budgetEndDate === 'string'));
}

const getBudgets = () => { //if there is a localStorage item of budgets, it returns it, if there isn't it returns an empty array and creates the budgets item
    if (budgetsCache !== null && budgetsCacheDate === getTodayISO()) return budgetsCache; // the cache is only valid for today, so expired budgets disappear at midnight
    try {
        budgetsCache = (JSON.parse(localStorage.getItem('budgets')) ?? []).filter(isValidBudget).filter(budget => !isBudgetExpired(budget));
        budgetsCacheDate = getTodayISO();
        return budgetsCache;
    } catch {
        safeSetItem('budgets', '[]');
        return [];
    }
};

const removeExpiredBudgets = () => { // removes the expired budgets from localStorage 
    const budgets = (JSON.parse(localStorage.getItem('budgets')) ?? []).filter(isValidBudget); // gets the budgets from localStorage
    const activeBudgets = budgets.filter(budget => !isBudgetExpired(budget)); // gets only the active budgets
    if (activeBudgets.length !== budgets.length) { // if there are no expired budgets, it does nothing
        saveBudgets(activeBudgets); // saves the active budgets in localStorage
    }
};

const getCats = () => { //gets the localStorage item budgets and turns it into a map for each category
    const budgets = getBudgets();
    const cats = budgets.map(budget => budget.budgetCat)
    return cats;
};

// validates the "Add Budget" form, builds the budget and saves it
const addBudget = (e) => {
    e.preventDefault();

    if (!(parseAmount(budgetLimitInput.value) > 0)) { // doesn't let the amount be 0
        budgetLimitInput.closest('.budget-slider-wrap').classList.add('input-invalid');
        budgetLimitError.classList.remove('hidden');
        budgetLimitInput.focus();
        return;
    }

    const periodType = document.querySelector('input[name="budget-period"]:checked').value; // gets the date option
    let unit;

    if (periodType === "recurring") {
        unit = budgetRecurringUnit.value; // if its a recurring budget, gets the type of recurrence
    } else {
        unit = budgetEndDateInput.value
        if (unit <= getTodayISO()){ // if the date is today or before it gives an error
            budgetEndDateInput.classList.add("input-invalid");
            budgetEndDateError.classList.remove("hidden");
            budgetEndDateInput.focus();
            return;
        }
    };

    const budgets = getBudgets();

    const budget = { //creates the budget object
        budgetCat: budgetCategory.value,
        budgetLimit: parseAmount(budgetLimitInput.value),
        budgetPeriod: periodType,
        budgetCreatedAt: getTodayISO(),
        ...(periodType === "recurring" ? { budgetUnit: unit } : { budgetEndDate: unit }), // recurring keeps the unit, "until date" keeps the end date
        budgetCurrency: getActiveCurrency()
    };
    
    budgets.unshift(budget); // puts it at the top of the budgets (LIFO)
    saveBudgets(budgets) // saves the budgets in localStorage
    
    budgetForm.reset();
    toggleBudgetModal();
    renderBudgets();
};

// saves the budgets and clears the cache, so the next read gets fresh data
const saveBudgets = (budgets) => {
    budgetsCache = null;
    safeSetItem('budgets', JSON.stringify(budgets)); // sets the budgets in localStorage
};

// how much was spent inside this budget's period. Example: "Food" monthly -> all Food spending this month
const getSpentByCat = (budget) => {
    const cat = budget.budgetCat;
    const {start, end} = getSpendPeriodRange(budget);
    const transactions = getTransactions(); // gets all the transactions
    const catTransactions = transactions.filter(transaction => 
        transaction.transactionType === 'spending'
        && (cat === GENERAL_BUDGET_CAT || transaction.transactionCat === cat) // the general budget counts every category
        && transaction.transactionDate >= start
        && transaction.transactionDate <= end)
    .reduce((a,b) => a + Math.abs(toActive(b.transactionAmount, b.transactionCurrency, b.transactionDate)), 0); // filters to see only the spending of said category and gets the total money spent
    return parseFloat(catTransactions.toFixed(2)); // returns the total as a string with 2 decimals
};

const getPeriodRange = (budget) => { // gets the full start and end of the budget's period
    if (budget.budgetPeriod === "date") {
        return { start: parseDateISO(budget.budgetCreatedAt), end: parseDateISO(budget.budgetEndDate) };
    }

    const today = new Date(); // todays date
    let start, end; // start and end of the budget period

    if (budget.budgetUnit === "monthly") {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // day 0 = last day of previous month
    } else if (budget.budgetUnit === "weekly") {
        const day = today.getDay();
        const diff = (day === 0 ? 6 : day - 1); // days since most recent Monday
        start = new Date(today);
        start.setDate(today.getDate() - diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
    } else if (budget.budgetUnit === "yearly") {
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
    }

    return { start, end };
};

// spend-calculation range: clamps end at today so future transactions aren't counted, returns ISO strings
const getSpendPeriodRange = (budget) => {
    const { start, end } = getPeriodRange(budget);
    const today = new Date();
    const clampedEnd = end > today ? today : end;
    return { start: formatDateISO(start), end: formatDateISO(clampedEnd) };
};

const formatDateShort = (date) => { // returns a short date in the app language, like "5 Oct"
    return date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' });
};

const isBudgetExpired = (budget) => { // check if the budget is expired
    return budget.budgetPeriod === "date" && budget.budgetEndDate < getTodayISO();
};

// runs when the budgets page loads
const initBudgetsPage = () => {
    budgetList = document.getElementById("budget-list");
    budgetEmpty = document.getElementById("budget-empty");
    budgetListDiv = document.getElementById("budget-list-div");
    addBudgetBtn = document.getElementById("add-budget-btn");
    addBudgetBtnEmpty = document.getElementById("add-budget-btn-empty");

    addBudgetBtn.addEventListener("click", toggleBudgetModal);
    addBudgetBtnEmpty.addEventListener("click", toggleBudgetModal);

    // one listener on the list is enough, because the rows are rebuilt on every render
    budgetList.addEventListener('click', (e) => {
        const row = e.target.closest('.budget-row'); // finds the row that was clicked
        if (!row) return; // clicked outside a row
        openEditBudgetModal(Number(row.dataset.index)); // dataset is always text, so convert
    });

    renderBudgets();
};

// days until the end of the budget period, counting today. Example: today is the 30th and it ends on the 31st -> 2
const getDaysLeft = (end) => {
    const today = new Date().setHours(0, 0, 0, 0); // setHours(0...) removes the time, so only the day counts
    const newEnd = new Date(end).setHours(0, 0, 0, 0);
    return Math.round((newEnd - today) / (1000 * 60 * 60 * 24)) + 1
};

// fills the edit modal with a budget's values and opens it (fields start locked)
const openEditBudgetModal = (index) => {
    editingBudgetIndex = index; // remembers which budget is open
    const b = getBudgets()[index];

    editBudgetCategory.textContent = b.budgetCat === GENERAL_BUDGET_CAT ? t('budget.general') : b.budgetCat;
    editBudgetLimitInput.value = b.budgetLimit;
    document.getElementById('edit-budget-currency-symbol').textContent = getCurrencySymbol(b.budgetCurrency || 'EUR');
    // note shown only when the budget was made in another currency than the active one
    const limitNote = document.getElementById('edit-budget-limit-note');
    const differentCurrency = (b.budgetCurrency || 'EUR') !== getActiveCurrency();
    limitNote.classList.toggle('hidden', !differentCurrency);
    if (differentCurrency) {
        limitNote.textContent = t('budgetModal.originalLimit').replace('{amount}', formatAmount(getBudgetLimit(b)));
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    editBudgetEndDateInput.min = formatDateISO(tomorrow);

    // check the right radio and fill its value
    if (b.budgetPeriod === 'recurring') {
        editBudgetRecurringRadio.checked = true;
        editBudgetRecurringUnit.value = b.budgetUnit;
    } else {
        editBudgetDateRadio.checked = true;
        editBudgetEndDateInput.value = b.budgetEndDate;
    }

    // clear leftover errors from a previous open
    editBudgetLimitError.classList.add('hidden');
    editBudgetEndDateError.classList.add('hidden');

    setEditBudgetMode(false); // fields start locked
    editBudgetModal.classList.add('open');
};

// runs once: grabs the edit modal elements and connects its buttons
const initEditBudgetModal = () => {
    editBudgetModal = document.getElementById('edit-budget-modal-overlay');
    editBudgetForm = document.getElementById('edit-budget-form');
    editBudgetCategory = document.getElementById('edit-budget-category');
    editBudgetLimitInput = document.getElementById('edit-budget-limit');
    editBudgetLimitError = document.getElementById('edit-budget-limit-error');
    editBudgetRecurringRadio = document.getElementById('edit-budget-period-recurring');
    editBudgetDateRadio = document.getElementById('edit-budget-period-date');
    editBudgetRecurringUnit = document.getElementById('edit-budget-recurring-unit');
    editBudgetEndDateInput = document.getElementById('edit-budget-end-date');
    editBudgetEndDateError = document.getElementById('edit-budget-end-date-error');
    deleteBudgetBtn = document.getElementById('delete-budget-btn');
    editBudgetModeBtn = document.getElementById('edit-budget-mode-btn');
    cancelEditBudgetBtn = document.getElementById('cancel-edit-budget-btn');

    editBudgetLimitInput.closest('.amount-input-wrap').classList.remove('input-invalid');
    editBudgetEndDateInput.classList.remove('input-invalid');

    document.getElementById('close-edit-budget-modal-btn').addEventListener('click', closeEditBudgetModal);
    editBudgetModeBtn.addEventListener('click', () => setEditBudgetMode(true));
    cancelEditBudgetBtn.addEventListener('click', cancelEditBudget);
    editBudgetForm.addEventListener('submit', saveEditedBudget);
    deleteBudgetBtn.addEventListener('click', deleteBudget);
    limitToNumbers(editBudgetLimitInput);
    // hides the error as soon as the limit becomes valid
    editBudgetLimitInput.addEventListener('input', () => {
        if (parseAmount(editBudgetLimitInput.value) > 0) {
            editBudgetLimitError.classList.add('hidden');
            editBudgetLimitInput.closest('.amount-input-wrap').classList.remove('input-invalid');
        }
    });
    // same for the end date
    editBudgetEndDateInput.addEventListener('input', () => {
        if (editBudgetEndDateInput.value > getTodayISO()) {
            editBudgetEndDateError.classList.add('hidden');
            editBudgetEndDateInput.classList.remove('input-invalid');
        };
    });
};

const setEditBudgetMode = (isEditing) => {
    editBudgetForm.classList.toggle('editing', isEditing); // CSS swaps the buttons
    editBudgetForm.querySelectorAll('input, select').forEach(field => {
        field.disabled = !isEditing;
    });
};

// goes back to view mode with the original values
const cancelEditBudget = () => {
    openEditBudgetModal(editingBudgetIndex);
};

const closeEditBudgetModal = () => {
    editBudgetModal.classList.remove('open');
    editingBudgetIndex = null;
};

// validates the edit form and replaces the budget with the new values
const saveEditedBudget = (e) => {
    e.preventDefault();

    // limit can't be 0 (same idea as addBudget)
    const limit = parseAmount(editBudgetLimitInput.value) || 0;
    if (limit === 0) {
        editBudgetLimitInput.closest('.amount-input-wrap').classList.add('input-invalid');
        editBudgetLimitError.classList.remove('hidden');
        editBudgetLimitInput.focus();
        return;
    }

    // which radio is selected
    const periodType = document.querySelector('input[name="edit-budget-period"]:checked').value;

    // read the value of the selected type, and validate the date
    let unit;
    if (periodType === 'recurring') {
        unit = editBudgetRecurringUnit.value;
    } else {
        unit = editBudgetEndDateInput.value;
        if (unit <= getTodayISO()) {
            editBudgetEndDateError.classList.remove('hidden');
            editBudgetEndDateInput.classList.add('input-invalid');
            editBudgetEndDateInput.focus();
            return;
        };
    };

    // replace the budget in the array
    const budgets = getBudgets();
    const original = budgets[editingBudgetIndex];
    budgets[editingBudgetIndex] = {
        budgetCat: original.budgetCat,             // category can't change
        budgetLimit: limit,
        budgetPeriod: periodType,
        budgetCreatedAt: original.budgetCreatedAt, // keep the original creation date
        ...(periodType === 'recurring' ? { budgetUnit: unit } : { budgetEndDate: unit }),
        budgetCurrency: original.budgetCurrency    // keep the original currency
    };

    // save, close and redraw
    saveBudgets(budgets);
    closeEditBudgetModal();
    renderBudgets();
};

// asks for confirmation, then removes the open budget
const deleteBudget = async () => {
    const ok = await showConfirm(t('confirm.deleteBudget'));
    if (!ok) return; // user clicked Cancel
    const budgets = getBudgets();
    budgets.splice(editingBudgetIndex, 1); // removes the budget at the open position
    saveBudgets(budgets);
    closeEditBudgetModal();
    renderBudgets();
};

// the limit in the active currency, using the rate of the day the budget was created
const getBudgetLimit = (budget) => {
    return toActive(budget.budgetLimit, budget.budgetCurrency, budget.budgetCreatedAt); // converts the budget limit to the active currency
}