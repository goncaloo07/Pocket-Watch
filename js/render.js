// returns a new list sorted by date, newest first (the original list is not changed)
const sortByDateDesc = (transactions) => {
    return [...transactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
};

// builds the HTML of one transaction row (icon, name, category, date and amount)
const buildTransactionRow = ({ transactionName, transactionAmount, transactionDate, transactionCat, originalIndex, transactionCurrency }) => {
    const icon = CATEGORY_ICONS.get(transactionCat) || 'bi-three-dots';
    const amountClass = parseFloat(transactionAmount) >= 0 ? 'positive' : 'negative';
    const safeName = escapeHTML(transactionName); // the name is typed by the user, so it must be escaped
    const indexAttr = originalIndex !== undefined ? `data-index="${originalIndex}"` : ''; // lets the click handler know which transaction was clicked

    return `
        <li class="transaction-row" ${indexAttr}>
            <div class="transaction-left">
                <div class="transaction-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                <div class="transaction-info">
                    <span class="transaction-name">${safeName}</span>
                    <span class="transaction-meta">${tCat(transactionCat)} | <span class="transaction-date">${formatDateDMY(transactionDate)}</span></span>
                </div>
            </div>
            <span class="transaction-amount ${amountClass}">${formatAmount(toActive(transactionAmount, transactionCurrency, transactionDate))}</span>
        </li>
    `;
};

// the "Transactions" box on the home page: shows the 3 most recent ones
const renderTransactions = () => {
    const transactions = sortByDateDesc(getTransactions()); // sorted by transaction date, not by when it was added

    if (transactions.length === 0) { //if there aren't any transactions, the empty message will show
        transactionsEmptyDiv.classList.remove('hidden');
    } else {
        transactionsEmptyDiv.classList.add('hidden');
    }
    transactionsListEl.innerHTML = transactions.slice(0, 3).map(buildTransactionRow).join(''); //sends all rows to a map, then joins it to build the code
};

// smaller row used in the Spending and Receiving boxes of the home page
const buildSpendingReceivingRow = ({ transactionName, transactionAmount, transactionDate, transactionCat, transactionCurrency }) => {
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
            <span class="transaction-amount ${amountClass}">${formatAmount(toActive(transactionAmount, transactionCurrency, transactionDate))}</span>
        </li>
    `;
};

// fills the Spending and Receiving boxes of the home page with the last 3 of each
const renderSpendingReceiving = () => {
    const transactions = sortByDateDesc(getTransactions());
    const spending = transactions.filter(transaction => transaction.transactionType === "spending").slice(0, 3); // gets last 3 spending transactions (LIFO)
    const receiving = transactions.filter(transaction => transaction.transactionType === "receiving").slice(0, 3); // gets last 3 receiving transactions (LIFO)
    
    noSpendingDiv.classList.toggle('hidden', spending.length > 0); // if spending has more than 0 transactions, it will show them
    spendingListEl.innerHTML = spending.map(buildSpendingReceivingRow).join('');

    noReceivingDiv.classList.toggle('hidden', receiving.length > 0); // if receiving has more than 0 transactions, it will show them
    receivingListEl.innerHTML = receiving.map(buildSpendingReceivingRow).join('');
}

// shows the current balance on the home page card
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
        balanceEl.textContent = `${formatAmount(current)}`;

        if (progress < 1) {
            // Animation isn't done yet — schedule the next frame
            requestAnimationFrame(step);
        } else {
            // Animation finished — snap to the exact target value
            balanceEl.textContent = `${formatAmount(targetValue)}`;
        }
    };

    // Kick off the animation loop
    requestAnimationFrame(step);
};

// builds one budget row for the home page (name, period, spent / limit and a progress bar)
const buildBudgetRow = (budget, totalSpent) => {
    const { budgetCat } = budget;
    const limit = getBudgetLimit(budget);
    const icon = CATEGORY_ICONS.get(budgetCat) || 'bi-three-dots'; // budgetCat is "__general__" or the category name
    const label = tCat(budgetCat);
    const perc = ((totalSpent / limit) * 100) // calculates the percentage of the limit spent

    const barClass = perc >= 100 ? 'over-limit' : perc >= 80 ? 'near-limit' : ''; // if its 80% through the budget, it gets the near-limit class, if its over the budget it gets the over-limit class

    const { start, end } = getPeriodRange(budget);
    const dateLabel = budget.budgetPeriod === "date" ? `${t('budget.until')} ${formatDateShort(end)}` : `${formatDateShort(start)} - ${formatDateShort(end)}`; // get the start and end to the budget

    return `
        <li class="budget-row">
            <div class="budget-row-top">
                <div class="transaction-left">
                    <div class="transaction-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                    <div class="transaction-info">
                        <span class="transaction-name">${label}</span>
                        <span class="transaction-meta">${dateLabel}</span>
                    </div>
                </div>
                <span class="budget-amounts ${barClass}">${formatAmount(totalSpent)} <span class="budget-amounts-sep">/</span> ${formatAmount(limit)}</span>
            </div>
            <div class="budget-bar-track">
                <div class="budget-bar-fill ${barClass}" style="width: ${perc > 100 ? 100 : perc}%;"></div>
            </div>
        </li>
    `
}

// draws the budget list. Home page shows 3 short rows, the budgets page shows all with details
const renderBudgets = () => {
    const budgets = getBudgets(); // gets all the budgets
    const isBudgetsPage = window.location.pathname === '/budgets';
    if (isBudgetsPage) budgetListDiv.classList.toggle('hidden', budgets.length === 0);
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
        return (spentMap.get(b) / getBudgetLimit(b)) - (spentMap.get(a) / getBudgetLimit(a));
    }); // sort the budgets from the most completed to the less completed (general always first)
    const budgetsToShow = isBudgetsPage ? sortedBudgets : sortedBudgets.slice(0, 3);
    const buildRow = isBudgetsPage ? buildBudgetDetailRow : buildBudgetRow;
    budgetList.innerHTML = budgetsToShow.map(budget => buildRow(budget, spentMap.get(budget), budgets.indexOf(budget))).join(''); // indexOf gives the position in the saved list, used when a row is clicked
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

    if (dateStr === formatDateISO(today)) return t('date.today');
    if (dateStr === formatDateISO(yesterday)) return t('date.yesterday');
    return formatDateDMY(dateStr);
};

// builds one day's block: a small header (date + day total) followed by that day's rows
const buildDateGroup = (dateStr, dayTransactions, balanceAfter) => {
    const totalClass = balanceAfter >= 0 ? 'positive' : 'negative';

    return `
        <li class="transactions-date-group">
            <div class="transactions-date-header">
                <span class="transactions-date-label">${getRelativeDateLabel(dateStr)}</span>
                <span class="transactions-date-total ${totalClass}">${formatAmount(balanceAfter)}</span>
            </div>
            <ul class="transactions-date-rows">
                ${dayTransactions.map(buildTransactionRow).join('')}
            </ul>
        </li>
    `;
};

// draws the transactions page: applies every filter, groups by day and shows the visible days
const renderAllTransactions = () => {
    const transactions = getTransactions();
    totalGroups = 0;
    const selectedType = document.querySelector('input[name="filter-type"]:checked').value
    const selectedCat = transactionFilterCat.value;
    fillFilterCats(selectedCat)
    const oldestDate = getOldestTransactionDate();
    // if the "from" date was still the default, it follows the oldest transaction (which may have changed)
    const dateFrom = transactionFilterDateMin.value === defaultDateFrom ? oldestDate : transactionFilterDateMin.value;
    defaultDateFrom = oldestDate; // remember the default for the next render
    const dateTo = transactionFilterDateMax.value;
    getDefaultFilterDate(dateFrom, dateTo);
    setupAmountFilter(parseFloat(filterMinAmount.value), parseFloat(filterMaxAmount.value));
    const amountMin = parseFloat(filterMinAmount.value);
    const amountMax = parseFloat(filterMaxAmount.value);

    if (transactions.length === 0) {
        transactionsPageEmptyDiv.classList.remove('hidden');
        transactionsPageListDiv.classList.add('hidden');
        return;
    }
    // remember each transaction's position before sorting
    const indexed = transactions.map((t, i) => ({ ...t, originalIndex: i }));
    const filtered = indexed.filter(t => selectedType === 'all' || t.transactionType === selectedType)
                                .filter(t => selectedCat === 'all' || t.transactionCat === selectedCat)
                                .filter(t => (dateFrom === '' || t.transactionDate >= dateFrom) && (dateTo === '' || t.transactionDate <= dateTo))
                                .filter(t => {
                                    const amount = Math.abs(toActive(t.transactionAmount, t.transactionCurrency, t.transactionDate)); // in the active currency
                                    return amount >= amountMin && amount <= amountMax;
                                })
                                .filter(matchesSearch);
    transactionsPageEmptyDiv.classList.add('hidden');
    transactionsNoResultsPage.classList.add("hidden");
    transactionsPageListDiv.classList.remove('hidden');
    if (filtered.length === 0) { // there are transactions, but none match the filters
        transactionsPageEmptyDiv.classList.add('hidden');
        transactionsNoResultsPage.classList.remove("hidden");
        transactionsPageListEl.classList.add('hidden');
        return;
    }
    transactionsPageListEl.classList.remove("hidden");

    // newest date first for display; same-day transactions keep their existing order
    const sorted = [...filtered].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

    // splits the sorted list into { "2026-09-15": [...], "2026-09-14": [...] } buckets
    const groups = new Map();
    sorted.forEach(t => {
        if (!groups.has(t.transactionDate)) groups.set(t.transactionDate, []);
        groups.get(t.transactionDate).push(t);
    });

    // walk the days oldest to newest, accumulating the balance up to (and including) each day
    const dayEntries = Array.from(groups.entries());
    totalGroups = dayEntries.length;
    const balanceByDate = new Map();
    let runningBalance = 0;
    for (let i = dayEntries.length - 1; i >= 0; i--) {
        const [date, dayTransactions] = dayEntries[i];
        const dayTotal = dayTransactions.reduce((sum, t) => sum + toActive(t.transactionAmount, t.transactionCurrency, t.transactionDate), 0);
        runningBalance += dayTotal;
        balanceByDate.set(date, runningBalance);
    }

    // only the first "visibleGroups" days are drawn. More appear when the user scrolls down
    transactionsPageListEl.innerHTML = dayEntries.slice(0, visibleGroups).map(([date, dayTransactions]) => buildDateGroup(date, dayTransactions, balanceByDate.get(date))).join('')
    renderActiveFilters();
};

// true if the transaction name contains what is typed in the search box (ignores capital letters)
const matchesSearch = (t) => {
    const query = searchInput.value.trim().toLowerCase();
    return t.transactionName.toLowerCase().includes(query);
};

// checks each filter against its default value and returns only the active ones
const getActiveFilters = () => {
    const active = [];
    const selectedType = document.querySelector('input[name="filter-type"]:checked').value;
    if (selectedType !== 'all') {
        active.push({ key: 'type', label: t(selectedType === 'spending' ? 'common.spending' : 'common.receiving') });
    }
    const selectedCat = transactionFilterCat.value;
    if (selectedCat !== 'all') {
        active.push({ key: 'category', label: tCat(selectedCat) });
    }
    const selectedDateStart = transactionFilterDateMin.value;
    const selectedDateEnd = transactionFilterDateMax.value;
    let date1 = "", date2 = "";
    if(selectedDateStart !== getOldestTransactionDate()) {
        date1 = `${t('filters.from')} ${formatDateDMY(selectedDateStart)}`;
    };
    if (selectedDateEnd !== getTodayISO()) {
        date2 = `${t('filters.until')} ${formatDateDMY(selectedDateEnd)}`;
    };
    if (date1 || date2) {
        const selectedDate = [date1, date2].filter(Boolean).join(' '); // Boolean removes the empty ones
        active.push({ key: 'date', label: selectedDate});
    }
    const minValue = parseFloat(filterMinAmount.value);
    const maxValue = parseFloat(filterMaxAmount.value);
    let value1 = "", value2 = "";
    if (minValue > 0) value1 = `>${minValue}${getActiveSymbol()}`;
    if (maxValue < parseFloat(filterMaxAmount.max)) value2 = `<${maxValue}${getActiveSymbol()}`;
    if (value1 || value2) {
        const selectedValues = [value1, value2].filter(Boolean).join(' ');
        active.push({ key: 'value', label: selectedValues});
    }
    return active;
};

// builds the chip HTML and shows/hides the active-filters bar
const renderActiveFilters = () => {
    const active = getActiveFilters();
    // only show when there are active filters AND the panel is closed
    const shouldShow = active.length > 0 && filterPanel.classList.contains('hidden');
    if (!shouldShow) {
        activeFiltersDiv.classList.add('hidden')
        return;
    }
    activeFiltersDiv.classList.remove('hidden');
    activeFiltersDiv.innerHTML = active.map(a => `
        <span class="active-filter-chip" data-key="${a.key}"><i class="bi bi-x"></i>${a.label}</span>
    `).join('');
};

// builds one budget row for the budgets page (same as the home one, plus % and a footer with details)
const buildBudgetDetailRow = (budget, totalSpent, originalIndex) => {
    const { budgetCat, budgetPeriod } = budget;
    const icon = CATEGORY_ICONS.get(budgetCat) || 'bi-three-dots'; // budgetCat is "__general__" or the category name
    const label = tCat(budgetCat);
    const { end } = getPeriodRange(budget);

    const limit = getBudgetLimit(budget); // limit in the active currency, same as totalSpent
    const left = limit - totalSpent; // negative means over the limit
    const perc = Math.round((totalSpent / limit) * 100);
    const daysLeft = getDaysLeft(end);
    const perDay = left > 0 ? left / daysLeft : 0; // nothing left to spend if over the limit. Example: 60€ left and 3 days left -> 20€ per day
    const isOver = left < 0;
    const barClass = perc >= 100 ? 'over-limit' : perc >= 80 ? 'near-limit' : '';

    // "Monthly", "Weekly", "Yearly" or "Until 31 Oct"
    const budgetType = budgetPeriod === 'recurring'
        ? t('budget.' + budget.budgetUnit)
        : t('budget.until') + " " + formatDateShort(end);

    return `
        <li class="budget-row" data-index="${originalIndex}">
            <div class="budget-row-top">
                <div class="transaction-left">
                    <div class="transaction-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                    <div class="transaction-info">
                        <span class="transaction-name">${label}</span>
                        <span class="transaction-meta">${budgetType}</span>
                    </div>
                </div>
                <span class="budget-amounts ${barClass}">${formatAmount(totalSpent)} <span class="budget-amounts-sep">/</span> ${formatAmount(limit)}</span>
            </div>
            <div class="budget-bar-row">
                <div class="budget-bar-track">
                    <div class="budget-bar-fill ${barClass}" style="width: ${perc > 100 ? 100 : perc}%;"></div>
                </div>
                <span class="budget-perc">${perc}%</span>
            </div>
            <div class="budget-detail-footer">
                <span class="${isOver ? 'over' : ''}">
                    ${isOver ? `${formatAmount(Math.abs(left))} ${t('budget.over')}` : `${formatAmount(left)} ${t('budget.left')}`}
                </span>
                <span>${daysLeft} ${t(daysLeft === 1 ? 'budget.day' : 'budget.days')}</span>
                <span>${t('budget.canSpend')} ${formatAmount(perDay)} ${t('budget.perDay')}</span>
            </div>
        </li>
    `;
};