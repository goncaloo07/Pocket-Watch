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
const CHART_PALETTE = ['#3a8c63', '#5b9bd5', '#e0a72e', '#c1666b', '#7d5ba6', '#4fb0a5'];

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
        .map(([key, value], index) => ({label: key, value, color: CHART_PALETTE[index % CHART_PALETTE.length]}))
        .sort((a,b) => b.value - a.value);
    return spendingArr;
}

const getTypeTotals = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending").reduce((a,b) => a + parseFloat(b.transactionAmount), 0);
    const receiving = transactions.filter(transaction => transaction.transactionType === "receiving").reduce((a,b) => a + parseFloat(b.transactionAmount), 0);
    const transactionsArr = [{label: 'Spending', value: Math.abs(spending), color: 'var(--negative-color)'}, {label: 'Receiving', value: Math.abs(receiving), color: 'var(--positive-color)'}];
    return transactionsArr;
}

const getChartData = () => {
    const type = document.querySelector('input[name="chart-mode"]:checked').value;
    return type === 'category' ? getCategoryTotals() : getTypeTotals();
}

const renderSegments = (items) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    const segmentsHTML = items.map((item, index) => {
        const fraction = item.value / total;
        const dash = fraction * CHART_CIRCUMFERENCE;
        const gap = CHART_CIRCUMFERENCE - dash;
        const offset = -cumulative * CHART_CIRCUMFERENCE;
        cumulative += fraction;

        return `
        <circle
            data-index="${index}"
            cx="100" cy="100" r="${CHART_RADIUS}"
            fill="none"
            stroke="${item.color}"
            stroke-width="28"
            stroke-dasharray="0 ${CHART_CIRCUMFERENCE}"
            data-dash="${dash}"
            data-gap="${gap}"
            stroke-dashoffset="${offset}"
            class="chart-segment"
        ></circle>
        `; 
    });

    chartSegmentsG.innerHTML = segmentsHTML.join('');

    const circles = chartSegmentsG.querySelectorAll(".chart-segment");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            circles.forEach((circle) => {
                const dash = circle.dataset.dash;
                const gap = circle.dataset.gap;
                circle.setAttribute("stroke-dasharray", `${dash} ${gap}`);
            });
        });
    });
}

const renderLegend = (items) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    const legend = items.map((item, index) => {
        const percent = Math.round((item.value / total) * 100);

        return `
            <li class="chart-legend-item" data-index="${index}">
                <div class="chart-legend-left">
                    <span class="chart-legend-dot" style="background-color: ${item.color}"></span>
                    <span class="chart-legend-name">${item.label}</span>
                </div>
                <span class="chart-legend-amount">${item.value.toFixed(2)}€ (${percent}%)</span>
            </li>
        `;
    })

    chartLegend.innerHTML = legend.join('')
}

const attachChartInteractions = () => {
    const segments = chartSegmentsG.querySelectorAll(".chart-segment")
    const legendItems = chartLegend.querySelectorAll(".chart-legend-item")

    const highlight = (index) => {
        segments.forEach(s => s.classList.toggle("dimmed", s.dataset.index !== String(index)))
        legendItems.forEach(l => l.classList.toggle("active", l.dataset.index === String(index)))
    }

    const clearHighlight = () => {
        segments.forEach(s => s.classList.remove("dimmed"))
        legendItems.forEach(l => l.classList.remove("active"))
    }

    segments.forEach((s) => {
        s.addEventListener("mouseenter", () => highlight(s.dataset.index));
        s.addEventListener("mouseleave", clearHighlight);
    });

    legendItems.forEach((l) => {
        l.addEventListener("mouseenter", () => highlight(l.dataset.index));
        l.addEventListener("mouseleave", clearHighlight);
    });
}

const renderChart = () => {
    const data = getChartData()
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (!data || !data.length || total === 0) {
        chartEmpty.classList.remove("hidden");
        chartContent.classList.add("hidden");
        return;
    }
    chartEmpty.classList.add("hidden");
    chartContent.classList.remove("hidden");
    renderSegments(data)
    renderLegend(data)
    attachChartInteractions()
    chartCenterLabel.textContent = document.querySelector('input[name="chart-mode"]:checked').value === 'category' ? "Total Spent" : "Total Activity"
    chartCenterValue.textContent = `${total.toFixed(2)}€`
}