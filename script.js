document.getElementById("darkModeToggle").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
});

// Generate normally distributed random numbers
function randomNormal() {
    let u = Math.random(), v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Simulate stock prices with deposits
function simulateStockPrices(S0, mu, sigma, r, premium, N, dt, deposit, depositFreq) {
    let muAdjusted = r + premium;
    let stockPrices = [S0];
    let depositInterval = depositFreq === "daily" ? 1 : depositFreq === "monthly" ? 21 : 252; // Convert to daily steps

    for (let i = 1; i < N; i++) {
        let dW = Math.sqrt(dt) * randomNormal();
        let logReturn = (muAdjusted - 0.5 * sigma ** 2) * dt + sigma * dW;
        let newPrice = stockPrices[i - 1] * Math.exp(logReturn);

        if (i % depositInterval === 0) {
            newPrice += deposit;
        }

        stockPrices.push(newPrice);
    }
    return stockPrices;
}

// Generate stock paths and plot
function simulate() {
    let numStocks = parseInt(document.getElementById("numStocks").value);
    let T = parseFloat(document.getElementById("timePeriod").value);
    let S0 = parseFloat(document.getElementById("initialPrice").value);
    let mu = parseFloat(document.getElementById("mu").value);
    let sigma = parseFloat(document.getElementById("sigma").value);
    let r = parseFloat(document.getElementById("riskFreeRate").value);
    let premium = parseFloat(document.getElementById("premium").value);
    let deposit = parseFloat(document.getElementById("depositAmount").value);
    let depositFreq = document.getElementById("depositFrequency").value;

    let dt = 1 / 252;
    let N = Math.round(T / dt);
    let traces = [];
    let stockReturns = [];
    let currentYear = new Date().getFullYear();

    for (let i = 0; i < numStocks; i++) {
        let stockPath = simulateStockPrices(S0, mu, sigma, r, premium, N, dt, deposit, depositFreq);
        stockReturns.push(stockPath);

        let years = Array.from({ length: N }, (_, i) => currentYear + Math.floor(i / (252 * dt)));

        traces.push({ x: years, y: stockPath, type: "scatter", mode: "lines", line: { width: 1 }, opacity: 0.5 });
    }

    let layout = {
        title: "Simulated Stock Prices Over Time",
        xaxis: { title: "Year", type: "linear" },
        yaxis: { title: "Stock Price" },
        showlegend: false,
        template: document.body.classList.contains("dark-mode") ? "plotly_dark" : "plotly_white"
    };

    Plotly.newPlot("plot", traces, layout);

    updatePerformanceTable(stockReturns, T, currentYear);
}

// Update performance table
function updatePerformanceTable(stockReturns, years, startYear) {
    let tableBody = document.querySelector("#performanceTable tbody");
    tableBody.innerHTML = ""; // Clear table

    let yearlySteps = Math.round(stockReturns[0].length / years);
    
    for (let year = 0; year < years; year++) {
        let yearIndex = (year + 1) * yearlySteps - 1;
        let currentYear = startYear + year;
        
        let finalValues = stockReturns.map(path => path[yearIndex]);
        finalValues.sort((a, b) => a - b);

        let top10Index = Math.floor(finalValues.length * 0.9);
        let bottom10Index = Math.floor(finalValues.length * 0.1);

        let avgTop10 = finalValues.slice(top10Index).reduce((a, b) => a + b, 0) / (finalValues.length - top10Index);
        let avgBottom10 = finalValues.slice(0, bottom10Index).reduce((a, b) => a + b, 0) / bottom10Index;

        let row = `<tr><td>${currentYear}</td><td>€${Math.round(avgTop10)}</td><td>€${Math.round(avgBottom10)}</td></tr>`;
        tableBody.innerHTML += row;
    }
}

// Run on load
simulate();
