const getBudgets = () => { //if there is a localStorage item of budgets, it returns it, if there isn't it returns an empty array and creates the budgets item
    try {
        return JSON.parse(localStorage.getItem('budgets')) ?? [];
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

    const budgets = getBudgets();

    const budget = { //creates the budget object
        budgetCat: budgetCategory.value,
        budgetLimit : parseFloat(budgetLimitInput.value)
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

const getSpentByCat = (cat) => {
    const transactions = getTransactions(); // gets all the transactions
    const catTransactions = transactions.filter(transaction => transaction.transactionCat === cat && transaction.transactionType === 'spending')
                                        .reduce((a,b) => a + Math.abs(parseFloat(b.transactionAmount)), 0); // filters to see only the spending of said category and gets the total money spent
    return parseFloat(catTransactions.toFixed(2)); // returns the total as a string with 2 decimals
}