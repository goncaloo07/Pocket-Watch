const fs = require("fs");
const path = require("path");

// gets the latest rates and saves them in data/rates.json
const run = async () => { 
    try {
        const dataDir = path.join(__dirname, "..", "data")
        fs.mkdirSync(dataDir, { recursive: true });
        const response = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR");
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = await response.json();
        const output = { date: data.date, base: "EUR", rates: { EUR: 1, ...data.rates } };
        const outputPath = path.join(dataDir, "rates.json");
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Rates updated and written to ${outputPath}`);
    } catch (error) {
        console.error("Could not update rates:", error.message);
        process.exit(1);
    }
};

run();