const getBudgets = () => {
    try {
        return JSON.parse(localStorage.getItem('budgets')) ?? [];
    } catch {
        localStorage.setItem('budgets', '[]');
        return [];
    }
}

const getCats = () => {
    const budgets = getBudgets();
    const cats = budgets.map(budget => budget.budgetCat)
    return cats;
}

const addBudget = (e) => {
    e.preventDefault();

    if(parseFloat(budgetLimitInput.value) === 0) {
        budgetLimitInput.closest('.budget-slider-wrap').classList.add('input-invalid');
        budgetLimitError.classList.remove('hidden');
        budgetLimitInput.focus();
        return;
    }

    const budgets = getBudgets();

    const budget = {
        budgetCat: budgetCategory.value,
        budgetLimit : parseFloat(budgetLimitInput.value)
    };
    
    budgets.unshift(budget);
    saveBudgets(budgets)
    
    budgetForm.reset();
    toggleBudgetModal();
    renderBudgets();
}

const saveBudgets = (budgets) => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

const getSpentByCat = (cat) => {
    const transactions = getTransactions();
    const catTransactions = transactions.filter(transaction => transaction.transactionCat === cat && transaction.transactionType === 'spending').reduce((a,b) => a + Math.abs(parseFloat(b.transactionAmount)), 0);
    return parseFloat(catTransactions.toFixed(2));
}