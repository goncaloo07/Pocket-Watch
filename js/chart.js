const chartSegmentsG = document.getElementById('chart-segments');
const chartLegend = document.getElementById("chart-legend");
const chartEmpty = document.getElementById("chart-empty");
const chartContent = document.getElementById("chart-content");
const chartCenterValue = document.getElementById("chart-center-value");
const chartCenterLabel = document.getElementById("chart-center-label");
const chartToolTip = document.getElementById("chart-tooltip");
const chartSVGWrap = document.querySelector(".chart-svg-wrap");

    const CHART_RADIUS = 80;
    const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;

const getCategoryTotals = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending");
    const spendingMap = new Map();

    spending.forEach(transaction => {
        if (spendingMap.has(transaction.transactionCat)) {
            spendingMap.set(transaction.transactionCat, Math.abs(parseFloat(transaction.transactionAmount)) + spendingMap.get(transaction.transactionCat));
        } else {
            spendingMap.set(transaction.transactionCat, Math.abs(parseFloat(transaction.transactionAmount)));
        }
    })

    const spendingArr = Array.from(spendingMap)
        .map(([key, value]) => ({label: key, value}))
        .sort((a,b) => b.value - a.value);
    return spendingArr;
}

const getTypeTotals = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending").reduce((a,b) => a + parseFloat(b.transactionAmount), 0);
    const receiving = transactions.filter(transaction => transaction.transactionType === "receiving").reduce((a,b) => a + parseFloat(b.transactionAmount), 0);
    const transactionsArr = [{label: 'Spending', value: Math.abs(spending)}, {label: 'Receiving', value: Math.abs(receiving)}];
    return transactionsArr;
}

const getChartData = () => {
    const type = document.querySelector('input[name="chart-mode"]:checked').value;
    return type === 'category' ? getCategoryTotals() : getTypeTotals();
}

const buildSegments = (items) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    items.forEach((item) => {
        const fraction = item.value / total;
        const dash = fraction * CHART_CIRCUMFERENCE;                 
        const gap = CHART_CIRCUMFERENCE - dash                   
        const offset = -cumulative * CHART_CIRCUMFERENCE;       

        console.log(item.label, { dash, gap, offset });

        cumulative += fraction;
    });
}