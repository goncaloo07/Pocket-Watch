let confirmResolve;

const showConfirm = (message) => {
    document.getElementById('confirm-modal-message').textContent = message;
    document.getElementById('confirm-modal-overlay').classList.add('open');
    // returns a Promise that stays "pending" until confirmResolve() is called
    return new Promise((resolve) => {
        confirmResolve = resolve;
    });
};

document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal-overlay').classList.remove('open');
    confirmResolve(true); // answers the Promise with "yes"
});

document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal-overlay').classList.remove('open');
    confirmResolve(false); // answers the Promise with "no"
});