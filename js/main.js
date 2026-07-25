// DOM references 
const addTransactionBtn = document.getElementById('add-transaction-btn');
const transactionModal = document.getElementById('transaction-modal-overlay');
const closeTransactionModalBtn = document.getElementById('close-modal-btn');
const cancelTransactionModalBtn = document.getElementById('cancel-transaction-btn');
const transactionForm = document.getElementById('transaction-form');
const transactionsEmptyDiv = document.getElementById('transactions-empty');
const transactionsListEl = document.getElementById('transactions-list');
const balanceValue = document.getElementById("balance-value");
const balanceDiv = document.getElementById("balance-div");
const balanceEl = document.getElementById('balance-value');

const toggleTransactionModal = () => { //opens and closes the modal and gets the default date for the date input
    const isOpen = transactionModal.classList.toggle('open');
    if (isOpen) {
        document.getElementById('transaction-date').value = getTodayISO();
    }
};

// Initializing functions
document.addEventListener('header:loaded', initHeader);
document.addEventListener('menu:loaded', initMenu);

addTransactionBtn.addEventListener('click', toggleTransactionModal);
closeTransactionModalBtn.addEventListener('click', toggleTransactionModal);
cancelTransactionModalBtn.addEventListener('click', toggleTransactionModal);
transactionForm.addEventListener('submit', addTransaction);

document.getElementById('transaction-amount').addEventListener('input', (e) => {
    if (parseFloat(e.target.value) > 0) {
        document.getElementById('amount-error').classList.add('hidden');
        e.target.closest('.amount-input-wrap').classList.remove('input-invalid');
    }
});

renderTransactions();
renderSpendingReceiving();
renderBalance();