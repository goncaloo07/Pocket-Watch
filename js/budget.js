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
    const cats = budgets.map(budget => budget.budgetCats)
    return cats;
}

const saveBudget = (budgets) => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}