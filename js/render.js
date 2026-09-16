const buildTransactionRow = ({ transactionName, transactionAmount, transactionDate, transactionCat }) => {
    const icon = CATEGORY_ICONS.get(transactionCat) || 'bi-three-dots';
    const amountClass = parseFloat(transactionAmount) >= 0 ? 'positive' : 'negative';
    const safeName = escapeHTML(transactionName);

    return `
        <li class="transaction-row">
            <div class="transaction-left">
                <div class="transaction-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                <div class="transaction-info">
                    <span class="transaction-name">${safeName}</span>
                    <span class="transaction-meta">${transactionCat} | <span class="transaction-date">${transactionDate}</span></span>
                </div>
            </div>
            <span class="transaction-amount ${amountClass}">${transactionAmount}€</span>
        </li>
    `;
};

const renderTransactions = () => {
    const transactions = getTransactions();

    if (transactions.length === 0) { //if there aren't any transactions, the empty message will show
        transactionsEmptyDiv.classList.remove('hidden');
    } else {
        transactionsEmptyDiv.classList.add('hidden');
    }
    transactionsListEl.innerHTML = transactions.slice(0, 3).map(buildTransactionRow).join(''); //sends all rows to a map, then joins it to build the code
};

const buildSpendingReceivingRow = ({ transactionName, transactionAmount, transactionDate, transactionCat }) => {
    const amountClass = parseFloat(transactionAmount) >= 0 ? 'positive' : 'negative'; //checks if its positive or negative
    const safeName = escapeHTML(transactionName);

    return `
        <li class="transaction-row">
            <div class="transaction-left">
                <div class="transaction-info">
                    <span class="transaction-name">${safeName}</span>
                    <span class="transaction-meta"><span class="transaction-date">${transactionDate}</span></span>
                </div>
            </div>
            <span class="transaction-amount ${amountClass}">${transactionAmount}€</span>
        </li>
    `;
};

const renderSpendingReceiving = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending").slice(0, 3); // gets last 3 spending transactions (LIFO)
    const receiving = transactions.filter(transaction => transaction.transactionType === "receiving").slice(0, 3); // gets last 3 receiving transactions (LIFO)
    
    noSpendingDiv.classList.toggle('hidden', spending.length > 0); // if spending has more than 0 transactions, it will show them
    spendingListEl.innerHTML = spending.map(buildSpendingReceivingRow).join('');

    noReceivingDiv.classList.toggle('hidden', receiving.length > 0); // if receiving has more than 0 transactions, it will show them
    receivingListEl.innerHTML = receiving.map(buildSpendingReceivingRow).join('');
}

const renderBalance = () => {
    const balance = calcBalance();
    balanceDiv.classList.toggle('negative', balance < 0); // if the balance is below 0, it will get the negative class
    animateBalance(balance);
};

// Animates the balance number counting up from 0 to the target value
const animateBalance = (targetValue, duration = 800) => {
    const start = 0;
    const startTime = performance.now(); 

    // step() runs on every animation frame (~60 times per second). 'now' is the current timestamp, passed automatically by requestAnimationFrame
    const step = (now) => {
        // How far through the animation we are, as a value from 0 to 1
        const progress = Math.min((now - startTime) / duration, 1);

        // Easing function: transforms linear progress into a "fast start, slow finish" curve. Without this, the count-up would look robotic/linear.
        const eased = 1 - Math.pow(1 - progress, 4);

        // Interpolate between start and targetValue using the eased progress
        const current = start + (targetValue - start) * eased;

        // Update the DOM with the current in-progress value, formatted to 2 decimals + € sign
        balanceEl.textContent = `${current.toFixed(2)}€`;

        if (progress < 1) {
            // Animation isn't done yet — schedule the next frame
            requestAnimationFrame(step);
        } else {
            // Animation finished — snap to the exact target value
            balanceEl.textContent = `${targetValue.toFixed(2)}€`;
        }
    };

    // Kick off the animation loop
    requestAnimationFrame(step);
};

const buildBudgetRow = (budget, totalSpent) => {
    const { budgetCat, budgetLimit } = budget;
    const displayName = budgetCat === GENERAL_BUDGET_CAT ? "General" : budgetCat;
    const icon = CATEGORY_ICONS.get(displayName) || 'bi-three-dots'; // gets the icon
    const perc = ((totalSpent / budgetLimit) * 100) // calculates the percentage of the limit spent

    const barClass = perc >= 100 ? 'over-limit' : perc >= 80 ? 'near-limit' : ''; // if its 80% through the budget, it gets the near-limit class, if its over the budget it gets the over-limit class

    const { start, end } = getPeriodRange(budget);
    const dateLabel = budget.budgetPeriod === "date" ? `Until ${formatDateShort(end)}` : `${formatDateShort(start)} - ${formatDateShort(end)}`; // get the start and end to the budget

    return `
        <li class="budget-row">
            <div class="budget-row-top">
                <div class="transaction-left">
                    <div class="transaction-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                    <div class="transaction-info">
                        <span class="transaction-name">${displayName}</span>
                        <span class="transaction-meta">${dateLabel}</span>
                    </div>
                </div>
                <span class="budget-amounts ${barClass}">${totalSpent.toFixed(2)}€ <span class="budget-amounts-sep">/</span> ${budgetLimit.toFixed(2)}€</span>
            </div>
            <div class="budget-bar-track">
                <div class="budget-bar-fill ${barClass}" style="width: ${perc > 100 ? 100 : perc}%;"></div>
            </div>
        </li>
    `
}

const renderBudgets = () => {
    const budgets = getBudgets(); // gets all the budgets
    if (budgets.length === 0) { // if there aren't any budgets, show the empty message
        budgetEmpty.classList.remove('hidden');
        budgetList.classList.add("hidden");
    } else {
        budgetEmpty.classList.add('hidden');
        budgetList.classList.remove("hidden");
    }

    const spentMap = new Map(budgets.map(b => [b, getSpentByCat(b)])); // calcula o gasto de cada budget uma única vez

    const sortedBudgets = [...budgets].sort((a, b) => {
        if (a.budgetCat === GENERAL_BUDGET_CAT) return -1;
        if (b.budgetCat === GENERAL_BUDGET_CAT) return 1;
        return (spentMap.get(b) / b.budgetLimit) - (spentMap.get(a) / a.budgetLimit);
    }); // sort the budgets from the most completed to the less completed (general always first)
    budgetList.innerHTML = sortedBudgets.slice(0,3).map(budget => buildBudgetRow(budget, spentMap.get(budget))).join('');
};

// Escapes HTML so user text can't run as code. Example: turns "<b>" into visible text, not bold.
const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// "Today" / "Yesterday" for recent dates, otherwise the normal DD-MM-YYYY format
const getRelativeDateLabel = (dateStr) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateStr === formatDateISO(today)) return "Today";
    if (dateStr === formatDateISO(yesterday)) return "Yesterday";
    return formatDateDMY(dateStr);
};

// builds one day's block: a small header (date + day total) followed by that day's rows
const buildDateGroup = (dateStr, dayTransactions, balanceAfter) => {
    const totalClass = balanceAfter >= 0 ? 'positive' : 'negative';

    return `
        <li class="transactions-date-group">
            <div class="transactions-date-header">
                <span class="transactions-date-label">${getRelativeDateLabel(dateStr)}</span>
                <span class="transactions-date-total ${totalClass}">${balanceAfter.toFixed(2)}€</span>
            </div>
            <ul class="transactions-date-rows">
                ${dayTransactions.map(buildTransactionRow).join('')}
            </ul>
        </li>
    `;
};

const renderAllTransactions = () => {
    const transactions = getTransactions();

    if (transactions.length === 0) {
        transactionsPageEmptyDiv.classList.remove('hidden');
        transactionsPageListDiv.classList.add('hidden');
        return;
    }
    transactionsPageEmptyDiv.classList.add('hidden');
    transactionsPageListDiv.classList.remove('hidden');

    // newest date first for display; same-day transactions keep their existing order
    const sorted = [...transactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

    // splits the sorted list into { "2026-09-15": [...], "2026-09-14": [...] } buckets
    const groups = new Map();
    sorted.forEach(t => {
        if (!groups.has(t.transactionDate)) groups.set(t.transactionDate, []);
        groups.get(t.transactionDate).push(t);
    });

    // walk the days oldest to newest, accumulating the balance up to (and including) each day
    const dayEntries = Array.from(groups.entries());
    const balanceByDate = new Map();
    let runningBalance = 0;
    for (let i = dayEntries.length - 1; i >= 0; i--) {
        const [date, dayTransactions] = dayEntries[i];
        const dayTotal = dayTransactions.reduce((sum, t) => sum + parseFloat(t.transactionAmount), 0);
        runningBalance += dayTotal;
        balanceByDate.set(date, runningBalance);
    }

    transactionsPageListEl.innerHTML = Array.from(groups, ([date, dayTransactions]) => buildDateGroup(date, dayTransactions, balanceByDate.get(date))).join('');
};