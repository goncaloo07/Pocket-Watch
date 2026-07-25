const buildTransactionRow = ({ transactionName, transactionAmount, transactionDate, transactionCat }) => {
    const icon = CATEGORY_ICONS.get(transactionCat) || 'bi-three-dots'; //gets the icon for the transaction
    const amountClass = parseFloat(transactionAmount) >= 0 ? 'positive' : 'negative'; //checks if its positive or negative

    return `
        <li class="transaction-row">
            <div class="transaction-left">
                <div class="transaction-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                <div class="transaction-info">
                    <span class="transaction-name">${transactionName}</span>
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

    return `
        <li class="transaction-row">
            <div class="transaction-left">
                <div class="transaction-info">
                    <span class="transaction-name">${transactionName}</span>
                    <span class="transaction-meta"><span class="transaction-date">${transactionDate}</span></span>
                </div>
            </div>
            <span class="transaction-amount ${amountClass}">${transactionAmount}€</span>
        </li>
    `;
};

const renderSpendingReceiving = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending").slice(0, 3);
    const receiving = transactions.filter(transaction => transaction.transactionType === "receiving").slice(0, 3);
    
    document.getElementById('no-spending').classList.toggle('hidden', spending.length > 0);
    document.getElementById('spending-list').innerHTML = spending.map(buildSpendingReceivingRow).join('');

    document.getElementById('no-receiving').classList.toggle('hidden', receiving.length > 0);
    document.getElementById('receiving-list').innerHTML = receiving.map(buildSpendingReceivingRow).join('');
}

const renderBalance = () => {
    const balance = calcBalance();
    balanceDiv.classList.toggle('negative', balance < 0);
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