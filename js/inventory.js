let demandData = [];
let leadTimeData = [];
let pendingOrders = [];
let currentStep = 1;
let randomMethod = 'manual';
let autoDemandRandoms = [];
let autoLeadRandoms = [];
let lcgDemandRandoms = [];
let lcgLeadTimeRandoms = [];
let midSquareDemandRandoms = [];
let midSquareLeadTimeRandoms = [];

function init() {
    demandData = [
        {demand: 0, prob: 0.10},
        {demand: 1, prob: 0.25},
        {demand: 2, prob: 0.35},
        {demand: 3, prob: 0.20},
        {demand: 4, prob: 0.10}
    ];
    
    leadTimeData = [
        {leadTime: 1, prob: 0.30},
        {leadTime: 2, prob: 0.50},
        {leadTime: 3, prob: 0.20}
    ];

    updateDemandTable();
    updateLeadTimeTable();
}

function showError(message) {
    const box = document.getElementById('errorBox');
    if (box) {
        box.textContent = message;
        box.classList.remove('hidden');
    } else {
        alert(message);
    }
}

function clearError() {
    const box = document.getElementById('errorBox');
    if (box) {
        box.textContent = '';
        box.classList.add('hidden');
    }
}

function getDecimalPlaces(data) {
    let maxDecimals = 0;
    data.forEach(item => {
        const probStr = (item.prob ?? '').toString();
        if (probStr.includes('.')) {
            const decimals = probStr.split('.')[1].length;
            maxDecimals = Math.max(maxDecimals, decimals);
        }
    });
    return maxDecimals || 2;
}

function validateBasics() {
    const requiredIds = ['stdInventory', 'reviewLength', 'numCycles', 'startInventory'];
    for (const id of requiredIds) {
        const el = document.getElementById(id);
        if (!el || el.value === '') {
            showError('All basic inputs are required before continuing.');
            return false;
        }
    }
    clearError();
    return true;
}

function validateProbabilitySum(data) {
    const total = data.reduce((sum, item) => sum + (parseFloat(item.prob) || 0), 0);
    if (total > 1.000001 || Math.abs(total - 1) > 0.0001) {
        showError(`Service probabilities must sum to 1. Current total = ${total.toFixed(4)}. Please adjust the probabilities.`);
        return false;
    }
    return true;
}

function goToStep(step) {
    if (step > currentStep) {
        if (currentStep === 1 && !validateBasics()) return;
        if (currentStep === 2) {
            if (!validateProbabilitySum(demandData)) return;
            if (!validateProbabilitySum(leadTimeData)) return;
        }
        
    }
    clearError();
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`step${i}`).classList.remove('active');
        document.getElementById(`tabBtn${i}`).classList.remove('active');
    }
    document.getElementById(`step${step}`).classList.add('active');
    document.getElementById(`tabBtn${step}`).classList.add('active');
    currentStep = step;
}

function addPendingOrder() {
    const container = document.getElementById('pendingOrdersList');
    const index = pendingOrders.length;
    
    const div = document.createElement('div');
    div.className = 'pending-order-row';
    div.innerHTML = `
        <label>Units:</label>
        <input type="number" class="random-input" id="pendingUnits${index}" value="0" min="0">
        <label>Days Until Arrival:</label>
        <input type="number" class="random-input" id="pendingDays${index}" value="1" min="1">
        <button class="btn btn-secondary" onclick="removePendingOrder(${index})">Remove</button>
    `;
    container.appendChild(div);
    pendingOrders.push({ index: index });
}

function removePendingOrder(index) {
    pendingOrders = pendingOrders.filter(o => o.index !== index);
    const container = document.getElementById('pendingOrdersList');
    Array.from(container.children).forEach(child => {
        if (child.querySelector(`#pendingUnits${index}`)) {
            child.remove();
        }
    });
}

function addDemandRow() {
    demandData.push({ demand: demandData.length, prob: 0 });
    updateDemandTable();
}

function addMultipleDemandRows() {
    const count = parseInt(document.getElementById('demandRowCount').value) || 1;
    if (count < 1 || count > 100) {
        showError('Please enter a valid number between 1 and 100.');
        return;
    }
    for (let i = 0; i < count; i++) {
        demandData.push({ demand: demandData.length, prob: 0 });
    }
    updateDemandTable();
    clearError();
}

function removeDemandRow(index) {
    demandData.splice(index, 1);
    updateDemandTable();
}

function addLeadTimeRow() {
    leadTimeData.push({ leadTime: leadTimeData.length, prob: 0 });
    updateLeadTimeTable();
}

function addMultipleLeadTimeRows() {
    const count = parseInt(document.getElementById('leadTimeRowCount').value) || 1;
    if (count < 1 || count > 100) {
        showError('Please enter a valid number between 1 and 100.');
        return;
    }
    for (let i = 0; i < count; i++) {
        leadTimeData.push({ leadTime: leadTimeData.length, prob: 0 });
    }
    updateLeadTimeTable();
    clearError();
}

function removeLeadTimeRow(index) {
    leadTimeData.splice(index, 1);
    updateLeadTimeTable();
}

function updateDemandTable() {
    const tbody = document.getElementById('demandTableBody');
    tbody.innerHTML = '';
    
    const decimalPlaces = getDecimalPlaces(demandData);
    const multiplier = Math.pow(10, decimalPlaces);
    
    let cumProb = 0;
    demandData.forEach((item, index) => {
        const prevCum = cumProb;
        cumProb += parseFloat(item.prob) || 0;
        
        let rangeStart = Math.round(prevCum * multiplier);
        let rangeEnd = Math.round(cumProb * multiplier);
        
        rangeStart = index === 0 ? 1 : Math.round(prevCum * multiplier) + 1;
        if (index === demandData.length - 1) {
            rangeEnd = multiplier;
        }
        
        let assignment = '';
        if (rangeStart <= rangeEnd) {
            const padLength = decimalPlaces;
            const startStr = String(rangeStart).padStart(padLength, '0');
            let endStr;
            if (index === demandData.length - 1 && rangeEnd === multiplier) {
                endStr = '0'.repeat(padLength);
            } else {
                endStr = String(rangeEnd).padStart(padLength, '0');
            }
            assignment = `${startStr}-${endStr}`;
        }
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="number" value="${item.demand}" onchange="demandData[${index}].demand = parseFloat(this.value); updateDemandTable()"></td>
            <td><input type="number" step="0.01" value="${item.prob}" onchange="demandData[${index}].prob = parseFloat(this.value); updateDemandTable()"></td>
            <td>${cumProb.toFixed(2)}</td>
            <td>${assignment}</td>
            <td><button class="btn btn-secondary" onclick="removeDemandRow(${index})">Remove</button></td>
        `;
    });
}

function updateLeadTimeTable() {
    const tbody = document.getElementById('leadTimeTableBody');
    tbody.innerHTML = '';
    
    const decimalPlaces = getDecimalPlaces(leadTimeData);
    const multiplier = Math.pow(10, decimalPlaces);
    
    let cumProb = 0;
    leadTimeData.forEach((item, index) => {
        const prevCum = cumProb;
        cumProb += parseFloat(item.prob) || 0;
        
        let rangeStart = Math.round(prevCum * multiplier);
        let rangeEnd = Math.round(cumProb * multiplier);
        
        rangeStart = index === 0 ? 1 : Math.round(prevCum * multiplier) + 1;
        if (index === leadTimeData.length - 1) {
            rangeEnd = multiplier;
        }
        
        let assignment = '';
        if (rangeStart <= rangeEnd) {
            const padLength = decimalPlaces;
            const startStr = String(rangeStart).padStart(padLength, '0');
            let endStr;
            if (index === leadTimeData.length - 1 && rangeEnd === multiplier) {
                endStr = '0'.repeat(padLength);
            } else {
                endStr = String(rangeEnd).padStart(padLength, '0');
            }
            assignment = `${startStr}-${endStr}`;
        }
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="number" value="${item.leadTime}" onchange="leadTimeData[${index}].leadTime = parseFloat(this.value); updateLeadTimeTable()"></td>
            <td><input type="number" step="0.01" value="${item.prob}" onchange="leadTimeData[${index}].prob = parseFloat(this.value); updateLeadTimeTable()"></td>
            <td>${cumProb.toFixed(2)}</td>
            <td>${assignment}</td>
            <td><button class="btn btn-secondary" onclick="removeLeadTimeRow(${index})">Remove</button></td>
        `;
    });
}

function generateRandomInputs() {
    if (randomMethod !== 'manual') return;
    const numDemand = parseInt(document.getElementById('numDemandRandoms').value);
    const numLeadTime = parseInt(document.getElementById('numLeadTimeRandoms').value);
    
    const demandContainer = document.getElementById('demandRandoms');
    const leadTimeContainer = document.getElementById('leadTimeRandoms');
    
    demandContainer.innerHTML = '';
    leadTimeContainer.innerHTML = '';
    
    for (let i = 0; i < numDemand; i++) {
        demandContainer.innerHTML += `<input type="number" class="random-input" id="demandRand${i}" min="0" max="99" placeholder="00">`;
    }
    
    for (let i = 0; i < numLeadTime; i++) {
        leadTimeContainer.innerHTML += `<input type="number" class="random-input" id="leadTimeRand${i}" min="0" max="99" placeholder="00">`;
    }
}

function switchRandomMethod(method) {
    randomMethod = method;
    document.querySelectorAll('.method-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.method-section').forEach(sec => sec.classList.remove('active'));
    if (method === 'manual') {
        document.getElementById('tabManual').classList.add('active');
        document.getElementById('manualRandomSection').classList.add('active');
    } else if (method === 'LCG') {
        document.getElementById('tabLCG').classList.add('active');
        document.getElementById('lcgRandomSection').classList.add('active');
    } else if (method === 'MidSquare') {
        document.getElementById('tabMidSquare').classList.add('active');
        document.getElementById('midSquareRandomSection').classList.add('active');
    }
}

function generateLCGDetailed(a, c, m, initialZ, count) {
    const results = [];
    let z = initialZ;
    
    for (let i = 0; i < count; i++) {
        z = (a * z + c) % m;
        const u = z / m;
        results.push({ i: i + 1, z: z, u: u });
    }
    
    return results;
}

function generateLCGRandoms() {
    const a = parseFloat(document.getElementById('lcgA').value);
    const c = parseFloat(document.getElementById('lcgC').value);
    const m = parseFloat(document.getElementById('lcgM').value);
    const seed = parseFloat(document.getElementById('lcgSeed').value);
    const demandCount = parseInt(document.getElementById('lcgDemandCount').value) || 0;
    const leadTimeCount = parseInt(document.getElementById('lcgLeadTimeCount').value) || 0;
    
    if (isNaN(a) || isNaN(c) || isNaN(m) || isNaN(seed)) {
        showError('Please enter all LCG parameters.');
        return;
    }
    
    if (demandCount <= 0 || leadTimeCount <= 0) {
        showError('Please enter positive counts for random numbers.');
        return;
    }
    
    // Generate detailed data for display (raw values for table)
    const demandDetailed = generateLCGDetailed(a, c, m, seed, demandCount);
    const leadTimeDetailed = generateLCGDetailed(a, c, m, seed + demandCount, leadTimeCount);
    
    // Generate actual random numbers using original function (with approximation logic)
    const demandRandoms = generateLCG(a, c, m, seed, demandCount);
    const leadTimeRandoms = generateLCG(a, c, m, seed + demandCount, leadTimeCount);
    
    // Convert 0-100 range (from approximation) to 1-100 range for simulation
    lcgDemandRandoms = demandRandoms.map(n => Math.floor(n) + 1);
    lcgLeadTimeRandoms = leadTimeRandoms.map(n => Math.floor(n) + 1);
    
    // Display detailed tables
    displayLCGTable('lcgDemandPreview', demandDetailed, seed);
    displayLCGTable('lcgLeadTimePreview', leadTimeDetailed, seed + demandCount);
    
    document.getElementById('lcgResults').classList.remove('hidden');
    clearError();
}

function displayLCGTable(containerId, data, initialSeed) {
    const container = document.getElementById(containerId);
    let html = '<div style="overflow-x: auto;"><table style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    html += '<thead><tr style="background-color: #f0f0f0;"><th style="border: 1px solid #ddd; padding: 8px;">i</th><th style="border: 1px solid #ddd; padding: 8px;">Z<sub>i</sub></th><th style="border: 1px solid #ddd; padding: 8px;">U<sub>i</sub></th></tr></thead>';
    html += '<tbody>';
    
    // Add seed row (i=0)
    html += `<tr><td style="border: 1px solid #ddd; padding: 8px;">0</td><td style="border: 1px solid #ddd; padding: 8px;">${initialSeed}</td><td style="border: 1px solid #ddd; padding: 8px;">-</td></tr>`;
    
    // Add generated rows
    data.forEach(item => {
        html += `<tr><td style="border: 1px solid #ddd; padding: 8px;">${item.i}</td><td style="border: 1px solid #ddd; padding: 8px;">${item.z}</td><td style="border: 1px solid #ddd; padding: 8px;">${item.u.toFixed(4)}</td></tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function generateMidSquareDetailed(seed, count) {
    const results = [];
    let current = seed;
    
    for (let i = 0; i < count; i++) {
        // Square the current Z_i
        const zSquared = current * current;
        const squaredStr = zSquared.toString().padStart(8, '0');
        const middle = squaredStr.substring(2, 6);
        let nextZ = parseInt(middle, 10);
        
        // If we get 0, use a fallback seed
        if (nextZ === 0) {
            nextZ = (seed + i + 1) % 10000;
            if (nextZ === 0) nextZ = 1; // Ensure non-zero
        }
        
        const u = nextZ / 10000;
        results.push({ i: i + 1, z: nextZ, u: u, zSquared: zSquared });
        current = nextZ;
    }
    
    return results;
}

function generateMidSquareRandoms() {
    const seed = parseInt(document.getElementById('midSquareSeed').value);
    const demandCount = parseInt(document.getElementById('midSquareDemandCount').value) || 0;
    const leadTimeCount = parseInt(document.getElementById('midSquareLeadTimeCount').value) || 0;
    
    if (isNaN(seed) || seed < 1000 || seed > 9999) {
        showError('Please enter a valid 4-digit seed (1000-9999).');
        return;
    }
    
    if (demandCount <= 0 || leadTimeCount <= 0) {
        showError('Please enter positive counts for random numbers.');
        return;
    }
    
    // Generate detailed data for display (raw values for table)
    const demandDetailed = generateMidSquareDetailed(seed, demandCount);
    const leadTimeDetailed = generateMidSquareDetailed(seed + 1000, leadTimeCount);
    
    // Generate actual random numbers using original function (with approximation logic)
    const demandRandoms = generateMidSquare(seed, demandCount);
    const leadTimeRandoms = generateMidSquare(seed + 1000, leadTimeCount);
    
    // Convert 0-100 range (from approximation) to 1-100 range for simulation
    midSquareDemandRandoms = demandRandoms.map(n => Math.floor(n) + 1);
    midSquareLeadTimeRandoms = leadTimeRandoms.map(n => Math.floor(n) + 1);
    
    // Display detailed tables
    displayMidSquareTable('midSquareDemandPreview', demandDetailed, seed);
    displayMidSquareTable('midSquareLeadTimePreview', leadTimeDetailed, seed + 1000);
    
    document.getElementById('midSquareResults').classList.remove('hidden');
    clearError();
}

function displayMidSquareTable(containerId, data, initialSeed) {
    const container = document.getElementById(containerId);
    let html = '<div style="overflow-x: auto;"><table style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    html += '<thead><tr style="background-color: #f0f0f0;"><th style="border: 1px solid #ddd; padding: 8px;">i</th><th style="border: 1px solid #ddd; padding: 8px;">Z<sub>i</sub></th><th style="border: 1px solid #ddd; padding: 8px;">U<sub>i</sub></th><th style="border: 1px solid #ddd; padding: 8px;">Z<sub>i</sub><sup>2</sup></th></tr></thead>';
    html += '<tbody>';
    
    // Add seed row (i=0)
    const seedSquared = initialSeed * initialSeed;
    html += `<tr><td style="border: 1px solid #ddd; padding: 8px;">0</td><td style="border: 1px solid #ddd; padding: 8px;">${initialSeed}</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px;">${seedSquared.toLocaleString()}</td></tr>`;
    
    // Add generated rows
    data.forEach(item => {
        // Z_i^2 is the square of Z_i (which will be used to generate the next Z)
        const zSquared = item.z * item.z;
        html += `<tr><td style="border: 1px solid #ddd; padding: 8px;">${item.i}</td><td style="border: 1px solid #ddd; padding: 8px;">${item.z}</td><td style="border: 1px solid #ddd; padding: 8px;">${item.u.toFixed(4)}</td><td style="border: 1px solid #ddd; padding: 8px;">${zSquared.toLocaleString()}</td></tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function useLCGNumbers() {
    if (lcgDemandRandoms.length === 0 || lcgLeadTimeRandoms.length === 0) {
        showError('Please generate numbers first.');
        return;
    }
    
    // Populate manual input fields
    document.getElementById('numDemandRandoms').value = lcgDemandRandoms.length;
    document.getElementById('numLeadTimeRandoms').value = lcgLeadTimeRandoms.length;
    generateRandomInputs();
    
    // Fill in the values
    lcgDemandRandoms.forEach((num, i) => {
        const el = document.getElementById(`demandRand${i}`);
        if (el) el.value = num;
    });
    
    lcgLeadTimeRandoms.forEach((num, i) => {
        const el = document.getElementById(`leadTimeRand${i}`);
        if (el) el.value = num;
    });
    
    // Switch to manual tab
    switchRandomMethod('manual');
    clearError();
}

function useMidSquareNumbers() {
    if (midSquareDemandRandoms.length === 0 || midSquareLeadTimeRandoms.length === 0) {
        showError('Please generate numbers first.');
        return;
    }
    
    // Populate manual input fields
    document.getElementById('numDemandRandoms').value = midSquareDemandRandoms.length;
    document.getElementById('numLeadTimeRandoms').value = midSquareLeadTimeRandoms.length;
    generateRandomInputs();
    
    // Fill in the values
    midSquareDemandRandoms.forEach((num, i) => {
        const el = document.getElementById(`demandRand${i}`);
        if (el) el.value = num;
    });
    
    midSquareLeadTimeRandoms.forEach((num, i) => {
        const el = document.getElementById(`leadTimeRand${i}`);
        if (el) el.value = num;
    });
    
    // Switch to manual tab
    switchRandomMethod('manual');
    clearError();
}

function convertRandomToDigits(random) {
    if (random >= 0 && random < 1) {
        const str = random.toString();
        if (str.includes('.')) {
            const decimals = str.split('.')[1];
            if (decimals.length >= 2) {
                return parseInt(decimals.substring(0, 2));
            } else {
                return parseInt(decimals.substring(0, 1));
            }
        }
        return 0;
    }
    return Math.round(random);
}

function mapDigitsToValue(digits, distribution, isDemand) {
    const decimalPlaces = getDecimalPlaces(distribution);
    const multiplier = Math.pow(10, decimalPlaces);
    
    let cumProb = 0;
    for (let i = 0; i < distribution.length; i++) {
        const prevCum = cumProb;
        cumProb += distribution[i].prob;
        
        let rangeStart = Math.round(prevCum * multiplier);
        let rangeEnd = Math.round(cumProb * multiplier);
        
        rangeStart = i === 0 ? 1 : Math.round(prevCum * multiplier) + 1;
        if (i === distribution.length - 1) {
            rangeEnd = multiplier;
        }
        
        if (i === distribution.length - 1 && rangeEnd === multiplier) {
            if (digits === 0 || digits === rangeStart || (digits >= rangeStart && digits <= rangeEnd)) {
                return isDemand ? distribution[i].demand : distribution[i].leadTime;
            }
        } else {
            if (digits >= rangeStart && digits <= rangeEnd) {
                return isDemand ? distribution[i].demand : distribution[i].leadTime;
            }
        }
    }
    
    return isDemand ? distribution[distribution.length-1].demand : distribution[distribution.length-1].leadTime;
}

function readPendingOrdersFromDOM(){
    const container = document.getElementById('pendingOrdersList');
    const list = [];
    Array.from(container.children).forEach((child,i)=>{
        const unitsInput = child.querySelector(`#pendingUnits${i}`) || child.querySelector('input[type="number"]');
        const daysInput = child.querySelector(`#pendingDays${i}`) || child.querySelectorAll('input[type="number"]')[1];
        if(unitsInput && daysInput){
            const units = parseInt(unitsInput.value) || 0;
            const days = parseInt(daysInput.value) || 0;
            if(units>0 && days>=0) list.push({units:units, daysLeft: days});
        }
    });
    return list;
}

function collectManualRandoms(count, prefix) {
    const values = [];
    for (let i = 0; i < count; i++) {
        const el = document.getElementById(`${prefix}${i}`);
        if (!el || el.value === '') {
            showError('Please fill all random number inputs or switch to Auto-Generate.');
            return null;
        }
        const val = parseInt(el.value);
        if (isNaN(val) || val < 0 || val > 99) {
            showError('Random numbers must be between 00 and 99.');
            return null;
        }
        values.push(val);
    }
    return values;
}

function renderDistributionTables() {
    const container = document.getElementById('distributionResults');
    if (!container) return;
    const buildRows = (data, isDemand) => {
        const decimalPlaces = getDecimalPlaces(data);
        const multiplier = Math.pow(10, decimalPlaces);
        let cum = 0;
        return data.map((item, idx) => {
            const prev = cum;
            cum += parseFloat(item.prob) || 0;
            let start = idx === 0 ? 1 : Math.round(prev * multiplier) + 1;
            let end = idx === data.length - 1 ? multiplier : Math.round(cum * multiplier);
            const startStr = String(start).padStart(decimalPlaces, '0');
            const endStr = idx === data.length - 1 && end === multiplier ? '0'.repeat(decimalPlaces) : String(end).padStart(decimalPlaces, '0');
            const assignment = `${startStr}-${endStr}`;
            const value = isDemand ? item.demand : item.leadTime;
            return `<tr><td>${value}</td><td>${(item.prob ?? 0).toFixed(2)}</td><td>${cum.toFixed(2)}</td><td>${assignment}</td></tr>`;
        }).join('');
    };
    const demandRows = buildRows(demandData, true);
    const leadRows = buildRows(leadTimeData, false);
    container.innerHTML = `
        <h3>Distribution Tables</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:15px;">
            <div>
                <h4 style="margin-top:0;">Demand Distribution</h4>
                <table class="results-table">
                    <thead style="position: relative;"><tr><th>Demand</th><th>Probability</th><th>Cumulative</th><th>Random-Digit Assignment</th></tr></thead>
                    <tbody>${demandRows}</tbody>
                </table>
            </div>
            <div>
                <h4 style="margin-top:0;">Lead Time Distribution</h4>
                <table class="results-table">
                    <thead style="position: relative;"><tr><th>Lead Time</th><th>Probability</th><th>Cumulative</th><th>Random-Digit Assignment</th></tr></thead>
                    <tbody>${leadRows}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderPerformanceMeasurements(avgEnding, shortageDays, totalDays) {
    const container = document.getElementById('performanceMeasurements');
    if (!container) return;
    const shortageRatio = totalDays ? (shortageDays / totalDays) : 0;
    container.innerHTML = `
        <h3>Performance Measurements</h3>
        <div class="performance-metrics">
            <div class="performance-card">Average Ending Inventory<br>${avgEnding.toFixed(2)}</div>
            <div class="performance-card">Shortage Days Ratio<br>${(shortageRatio * 100).toFixed(2)}% (${shortageDays}/${totalDays})</div>
        </div>
    `;
}

function runSimulation() {
    if (!validateBasics()) return;
    if (!validateProbabilitySum(demandData)) return;
    if (!validateProbabilitySum(leadTimeData)) return;

    const M = parseInt(document.getElementById('stdInventory').value);
    const N = parseInt(document.getElementById('reviewLength').value);
    const cycles = parseInt(document.getElementById('numCycles').value);
    const startInv = parseInt(document.getElementById('startInventory').value);

    const ordersFromDOM = readPendingOrdersFromDOM();

    let demandRandoms = [];
    let leadTimeRandoms = [];
    if (randomMethod === 'LCG') {
        if (lcgDemandRandoms.length === 0 || lcgLeadTimeRandoms.length === 0) {
            showError('Please generate LCG random numbers first.');
            return;
        }
        demandRandoms = lcgDemandRandoms;
        leadTimeRandoms = lcgLeadTimeRandoms;
    } else if (randomMethod === 'MidSquare') {
        if (midSquareDemandRandoms.length === 0 || midSquareLeadTimeRandoms.length === 0) {
            showError('Please generate MidSquare random numbers first.');
            return;
        }
        demandRandoms = midSquareDemandRandoms;
        leadTimeRandoms = midSquareLeadTimeRandoms;
    } else {
        // Manual method
        const numDemandRandoms = parseInt(document.getElementById('numDemandRandoms').value);
        const numLeadTimeRandoms = parseInt(document.getElementById('numLeadTimeRandoms').value);
        if (!numDemandRandoms || !numLeadTimeRandoms) {
            showError('Please enter counts for random numbers before running the simulation.');
            return;
        }
        const demandVals = collectManualRandoms(numDemandRandoms, 'demandRand');
        if (!demandVals) return;
        const leadVals = collectManualRandoms(numLeadTimeRandoms, 'leadTimeRand');
        if (!leadVals) return;
        demandRandoms = demandVals;
        leadTimeRandoms = leadVals;
    }

    const tbody = document.getElementById('simulationTableBody');
    tbody.innerHTML = '';

    let beginInv = startInv;
    let shortage = 0;
    let demandRandomIndex = 0;
    let leadTimeRandomIndex = 0;
    let endingInventorySum = 0;
    let shortageDays = 0;
    
    let activeOrders = ordersFromDOM.map(o=>({units:o.units, daysLeft:Math.max(0, o.daysLeft - 1)}));

    for (let cycle = 1; cycle <= cycles; cycle++) {
        for (let day = 1; day <= N; day++) {
            let daysUntilArrivalDisplay = '-';
            if (activeOrders.length > 0) {
                const minDays = Math.min(...activeOrders.map(o => o.daysLeft));
                daysUntilArrivalDisplay = minDays < 0 ? '-' : minDays;
            }
            
            let arrivingUnits = 0;
            const remainingOrders = [];
            
            for (let order of activeOrders) {
                if (order.daysLeft < 0) {
                    arrivingUnits += order.units;
                } else {
                    remainingOrders.push(order);
                }
            }
            activeOrders = remainingOrders;

            if (arrivingUnits > 0) {
                if (shortage > 0) {
                    const usedForShortage = Math.min(arrivingUnits, shortage);
                    shortage -= usedForShortage;
                    beginInv += arrivingUnits - usedForShortage;
                } else {
                    beginInv += arrivingUnits;
                }
            }

            const demandRand = demandRandoms.length ? demandRandoms[demandRandomIndex % demandRandoms.length] : 0;
            const demandDigits = convertRandomToDigits(demandRand);
            const demand = mapDigitsToValue(demandDigits, demandData, true);
            demandRandomIndex++;

            let endInv = 0;
            let shortageIncrease = 0;

            if (beginInv === 0) {
                endInv = 0;
                shortageIncrease = demand;
            } else if (demand > beginInv) {
                shortageIncrease = demand - beginInv;
                endInv = 0;
            } else {
                endInv = beginInv - demand;
            }

            shortage += shortageIncrease;

            let orderQty = '-';
            let leadTimeRandDisplay = '-';
            let newOrderInfo = null;

            if (day === N) {
                const orderAmount = M - endInv + shortage;
                if (orderAmount > 0) {
                    orderQty = orderAmount;
                    
                    const ltRand = leadTimeRandoms.length ? leadTimeRandoms[leadTimeRandomIndex % leadTimeRandoms.length] : 0;
                    const ltDigits = convertRandomToDigits(ltRand);
                    leadTimeRandDisplay = ltDigits.toString().padStart(1,'0');
                    const leadTime = mapDigitsToValue(ltDigits, leadTimeData, false);
                    
                    newOrderInfo = {units: orderAmount, daysLeft: leadTime};
                    leadTimeRandomIndex++;
                    
                    daysUntilArrivalDisplay = leadTime;
                }
            }

            const cycleDisplay = day === 1 ? cycle : '';
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${cycleDisplay}</td>
                <td>${day}</td>
                <td>${beginInv}</td>
                <td>${demandDigits.toString().padStart(2, '0')}</td>
                <td>${demand}</td>
                <td>${endInv}</td>
                <td>${shortage}</td>
                <td>${orderQty}</td>
                <td>${leadTimeRandDisplay}</td>
                <td>${daysUntilArrivalDisplay}</td>
            `;

            if (newOrderInfo !== null) {
                activeOrders.push(newOrderInfo);
            }

            activeOrders.forEach(order => order.daysLeft -= 1);

            beginInv = endInv;
            endingInventorySum += endInv;
            if (shortage > 0) {
                shortageDays += 1;
            }
        }
    }

    const totalRow = tbody.insertRow();
    totalRow.innerHTML = `
        <td colspan="5"></td>
        <td>${endingInventorySum}</td>
        <td colspan="4"></td>
    `;

    renderDistributionTables();
    const totalDays = cycles * N;
    const avgEnding = totalDays ? endingInventorySum / totalDays : 0;
    renderPerformanceMeasurements(avgEnding, shortageDays, totalDays);
    clearError();
    goToStep(4);
}

async function downloadInventoryPDF() {
    const report = document.getElementById('resultsExport');
    if (!report) return;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(report, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
    }
    pdf.save("Inventory_Simulation_Report.pdf");
}

function resetInventory() {
    document.getElementById('stdInventory').value = '';
    document.getElementById('reviewLength').value = '';
    document.getElementById('numCycles').value = '';
    document.getElementById('startInventory').value = '';
    document.getElementById('pendingOrdersList').innerHTML = '';
    pendingOrders = [];
    demandData = [];
    leadTimeData = [];
    updateDemandTable();
    updateLeadTimeTable();
    document.getElementById('demandRandoms').innerHTML = '';
    document.getElementById('leadTimeRandoms').innerHTML = '';
    document.getElementById('distributionResults').innerHTML = '';
    document.getElementById('simulationTableBody').innerHTML = '';
    document.getElementById('performanceMeasurements').innerHTML = '';
    autoDemandRandoms = [];
    autoLeadRandoms = [];
    lcgDemandRandoms = [];
    lcgLeadTimeRandoms = [];
    midSquareDemandRandoms = [];
    midSquareLeadTimeRandoms = [];
    document.getElementById('lcgDemandPreview').textContent = '';
    document.getElementById('lcgLeadTimePreview').textContent = '';
    document.getElementById('midSquareDemandPreview').textContent = '';
    document.getElementById('midSquareLeadTimePreview').textContent = '';
    document.getElementById('lcgResults').classList.add('hidden');
    document.getElementById('midSquareResults').classList.add('hidden');
    clearError();
    goToStep(1);
}

document.addEventListener('DOMContentLoaded', function() {
    init();
});