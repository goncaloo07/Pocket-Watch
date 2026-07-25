const calcBalance = () => {
    const transactions = getTransactions()
    let balance = 0
    transactions.forEach(transaction => {
        balance += parseFloat(transaction.transactionAmount)
    })
    return balance
}