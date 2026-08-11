const calcBalance = () => {
    const transactions = getTransactions()
    let balance = 0
    transactions.forEach(transaction => {
        balance += parseFloat(transaction.transactionAmount) // gets the total balance, by summing all values together
    })
    return balance
};

const initBalancePage = () => {

};

const getBalanceHistory = (time) => {
    const transactions = getTransactions();
    const end = getTodayISO();
    const today = new Date();
    let balance = 0;
    let start;
    let result = [];
    switch (time) {
        case "7d": 
            start = new Date(today);
            start.setDate(today.getDate() - 6); // 7 days including today
            break;
        case "30d":
            start = new Date(today);
            start.setDate(today.getDate() - 29); // 30 days including today
            break;
        case "1y":
            start = new Date(today);
            start.setFullYear(today.getFullYear() - 1); // 1 year including today
            break;
        default:
            if (transactions.length === 0) {
                start = today;
            } else {
                const oldestDate = transactions.reduce((oldest, t) => 
                    t.transactionDate < oldest ? t.transactionDate : oldest
                , transactions[0].transactionDate);
                start = parseDateISO(oldestDate);
            }
            break;
    }
    let startISO = formatDateISO(start);
    balance = transactions.reduce((total, transaction) => transaction.transactionDate < startISO ? total + parseFloat(transaction.transactionAmount) : total, 0);
    do {
        const dailyTransactions = transactions.filter(t => t.transactionDate === startISO);
        dailyTransactions.forEach(transaction => {
            balance += parseFloat(transaction.transactionAmount);
        });
        result.push({ date: startISO, balance: balance.toFixed(2) });
        start.setDate(start.getDate() + 1);
        startISO = formatDateISO(start);
    } while (startISO <= end);
    return result;
};