const GENERAL_BUDGET_CAT = "__general__";

const getBudgets = () => { //if there is a localStorage item of budgets, it returns it, if there isn't it returns an empty array and creates the budgets item
    try {
        const budgets = JSON.parse(localStorage.getItem('budgets')) ?? [];
        const activeBudgets = budgets.filter(budget => !isBudgetExpired(budget)); // it also removes the expired budgets from the localStorage, so it only returns the active ones
        if (activeBudgets.length !== budgets.length) {
            saveBudgets(activeBudgets);
        }
        return activeBudgets;
    } catch {
        localStorage.setItem('budgets', '[]');
        return [];
    }
}

const getCats = () => { //gets the localStorage item budgets and turns it into a map for each category
    const budgets = getBudgets();
    const cats = budgets.map(budget => budget.budgetCat)
    return cats;
}

const addBudget = (e) => {
    e.preventDefault();

    if(parseFloat(budgetLimitInput.value) === 0) { // doesn't let the amount be 0
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
        budgetLimit: parseFloat(budgetLimitInput.value),
        budgetPeriod: periodType,
        budgetCreatedAt: getTodayISO(),
        ...(periodType === "recurring" ? { budgetUnit: unit } : { budgetEndDate: unit }),
    };
    
    budgets.unshift(budget); // puts it at the top of the budgets (LIFO)
    saveBudgets(budgets) // saves the budgets in localStorage
    
    budgetForm.reset();
    toggleBudgetModal();
    renderBudgets();
}

const saveBudgets = (budgets) => {
    safeSetItem('budgets', JSON.stringify(budgets)); // sets the budgets in localStorage
}

const getSpentByCat = (budget) => {
    const cat = budget.budgetCat;
    const {start, end} = getSpendPeriodRange(budget);
    const transactions = getTransactions(); // gets all the transactions
    const catTransactions = transactions.filter(transaction => 
        transaction.transactionType === 'spending'
        && (cat === GENERAL_BUDGET_CAT || transaction.transactionCat === cat)
        && transaction.transactionDate >= start
        && transaction.transactionDate <= end)
    .reduce((a,b) => a + Math.abs(parseFloat(b.transactionAmount)), 0); // filters to see only the spending of said category and gets the total money spent
    return parseFloat(catTransactions.toFixed(2)); // returns the total as a string with 2 decimals
}

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

const formatDateShort = (date) => { // returns the date like 
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const isBudgetExpired = (budget) => { // check if the budget is expired
    return budget.budgetPeriod === "date" && budget.budgetEndDate < getTodayISO();
};