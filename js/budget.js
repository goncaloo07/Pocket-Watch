const getBudgets = () => { //if there is a localStorage item of budgets, it returns it, if there isn't it returns an empty array and creates the budgets item
    try {
        const budgets = JSON.parse(localStorage.getItem('budgets')) ?? [];
        const activeBudgets = budgets.filter(budget => !isBudgetExpired(budget));
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
    localStorage.setItem('budgets', JSON.stringify(budgets)); // sets the budgets in localStorage
}

const getSpentByCat = (budget) => {
    const cat = budget.budgetCat;
    const {start, end} = getPeriodRange(budget);
    const transactions = getTransactions(); // gets all the transactions
    const catTransactions = transactions.filter(transaction => transaction.transactionCat === cat 
                                                && transaction.transactionType === 'spending'
                                                && transaction.transactionDate >= start
                                                && transaction.transactionDate <= end)
                                        .reduce((a,b) => a + Math.abs(parseFloat(b.transactionAmount)), 0); // filters to see only the spending of said category and gets the total money spent
    return parseFloat(catTransactions.toFixed(2)); // returns the total as a string with 2 decimals
}

const getPeriodRange = (budget) => { // gets the start and end of the budget
    if (budget.budgetPeriod === "date") {
        return { start: budget.budgetCreatedAt, end: budget.budgetEndDate };
    }

    const today = new Date(); // todays date
    let start; // start of them budget

    if (budget.budgetUnit === "monthly") {
        start = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (budget.budgetUnit === "weekly") {
        const day = today.getDay();
        const diff = (day === 0 ? 6 : day - 1); // days since most recent Monday
        start = new Date(today);
        start.setDate(today.getDate() - diff);
    } else if (budget.budgetUnit === "yearly") {
        start = new Date(today.getFullYear(), 0, 1)
    }

    return { start: formatDateISO(start), end: getTodayISO() };
};

const isBudgetExpired = (budget) => { // check if the budget is expired
    return budget.budgetPeriod === "date" && budget.budgetEndDate < getTodayISO();
};