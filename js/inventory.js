let demandData = [];
let leadTimeData = [];
let pendingOrders = [];
let currentStep = 1;
let randomMethod = 'manual';
let autoDemandRandoms = [];
let autoLeadRandoms = [];

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

function getMaxRandomValue() {
    const demandDecimals = getDecimalPlaces(demandData);
    const leadTimeDecimals = getDecimalPlaces(leadTimeData);
    const maxDecimals = Math.max(demandDecimals, leadTimeDecimals);
    return Math.pow(10, maxDecimals);
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
    
    // Update random number input max values when distribution changes
    if (randomMethod === 'manual') {
        updateRandomNumberInputsMax();
    }
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
    
    // Update random number input max values when distribution changes
    if (randomMethod === 'manual') {
        updateRandomNumberInputsMax();
    }
}

function addRandomNumberRow(type) {
    const tbodyId = type === 'demand' ? 'tbodyRnDemand' : 'tbodyRnLeadTime';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    const maxValue = getMaxRandomValue();
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" min="0" max="${maxValue}" placeholder="0-${maxValue}" onchange="updateRandomNumberCounts()"></td>
    `;
    tbody.appendChild(tr);
    updateRandomNumberCounts();
}

function deleteRandomNumberRow(btn, type) {
    const tbodyId = type === 'demand' ? 'tbodyRnDemand' : 'tbodyRnLeadTime';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    if (tbody.querySelectorAll('tr').length <= 1) {
        showError('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    updateRandomNumberCounts();
    clearError();
}

function generateRandomNumberRows(type) {
    const inputId = type === 'demand' ? 'randomDemandRowCount' : 'randomLeadTimeRowCount';
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const count = parseInt(input.value) || 5;
    if (count < 1 || count > 100) {
        showError('Please enter a number between 1 and 100.');
        return;
    }
    
    const tbodyId = type === 'demand' ? 'tbodyRnDemand' : 'tbodyRnLeadTime';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    const maxValue = getMaxRandomValue();
    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="0" max="${maxValue}" placeholder="0-${maxValue}" onchange="updateRandomNumberCounts()"></td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(2) input').focus();
    }
    
    updateRandomNumberCounts();
    clearError();
}

function updateRandomNumberCounts() {
    const demandNumbers = readRandomNumbersFromTable('demand');
    const leadTimeNumbers = readRandomNumbersFromTable('leadTime');
    
    document.getElementById('demandCount').textContent = `Count: ${demandNumbers.length} numbers`;
    document.getElementById('leadTimeCount').textContent = `Count: ${leadTimeNumbers.length} numbers`;
}

function readRandomNumbersFromTable(type) {
    const tbodyId = type === 'demand' ? 'tbodyRnDemand' : 'tbodyRnLeadTime';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    
    const rows = tbody.querySelectorAll('tr');
    const numbers = [];
    
    for (const row of rows) {
        const input = row.querySelector('td:nth-child(2) input');
        if (!input) continue;
        
        const rawValue = parseFloat(input.value);
        if (isNaN(rawValue) || input.value === '') continue;
        
        numbers.push(Math.round(rawValue));
    }
    
    return numbers;
}

function switchTableMethod(table, method) {
    // Update tab buttons
    document.querySelectorAll(`#tab${table.charAt(0).toUpperCase() + table.slice(1)}Manual, #tab${table.charAt(0).toUpperCase() + table.slice(1)}Generated`).forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll(`#${table}ManualSection, #${table}GeneratedSection`).forEach(section => section.classList.remove('active'));

    if (method === 'manual') {
        document.getElementById(`tab${table.charAt(0).toUpperCase() + table.slice(1)}Manual`).classList.add('active');
        document.getElementById(`${table}ManualSection`).classList.add('active');
        updateRandomNumberInputsMax();
    } else {
        document.getElementById(`tab${table.charAt(0).toUpperCase() + table.slice(1)}Generated`).classList.add('active');
        document.getElementById(`${table}GeneratedSection`).classList.add('active');
    }
}

function switchGenMethod(table, method) {
    if (method === 'LCG') {
        document.getElementById(`${table}LcgParams`).classList.remove('hidden');
        document.getElementById(`${table}MidSquareParams`).classList.add('hidden');
    } else {
        document.getElementById(`${table}LcgParams`).classList.add('hidden');
        document.getElementById(`${table}MidSquareParams`).classList.remove('hidden');
    }
}

function updateRandomNumberInputsMax() {
    const maxValue = getMaxRandomValue();
    const demandInputs = document.querySelectorAll('#tbodyRnDemand input[type="number"]');
    const leadTimeInputs = document.querySelectorAll('#tbodyRnLeadTime input[type="number"]');
    
    demandInputs.forEach(input => {
        input.max = maxValue;
        input.placeholder = `0-${maxValue}`;
    });
    
    leadTimeInputs.forEach(input => {
        input.max = maxValue;
        input.placeholder = `0-${maxValue}`;
    });
    
    // Update description
    const description = document.getElementById('manualInputDescription');
    if (description) {
        description.textContent = `Enter random numbers between 0 and ${maxValue} directly in the table cells (0 will be treated as ${maxValue}). The range is based on your probability distribution decimal places.`;
    }
}

function generateLCGDetailed(a, c, m, initialZ, count) {
    const results = [];
    const zValues = new Set(); // Track Z_i values to detect cycles
    let z = initialZ;
    let cycleDetected = false;
    let cycleLength = 0;

    // Don't add initial seed to the set - we'll track generated values only
    // The initial seed is Z_0, and we generate Z_1, Z_2, etc.
    
    for (let i = 0; i < count; i++) {
        z = (a * z + c) % m;
        
        // Check if this Z_i value has been seen before OR if it equals the initial seed (cycle detected)
        // If we've seen it or it's the initial seed again, we've completed the full cycle
        // Include this value and stop
        if (zValues.has(z) || z === initialZ) {
            cycleDetected = true;
            // Cycle length is the number of unique values we've generated
            cycleLength = z === initialZ ? zValues.size + 1 : zValues.size;
            // Include this value in results as it's the last value of the cycle
            const u = z / m;
            results.push({ i: i + 1, z: z, u: u });
            break; // Stop generation when cycle is detected
        }
        
        // Add to set and results
        zValues.add(z);
        const u = z / m;
        results.push({ i: i + 1, z: z, u: u });
    }
    
    // Return object with results and cycle information
    return {
        data: results,
        cycleDetected: cycleDetected,
        cycleLength: cycleLength,
        generatedCount: results.length
    };
}

function generateRandomNumbers() {
    const method = document.querySelector('input[name="genMethod"]:checked').value;
    const demandCount = parseInt(document.getElementById('genDemandCount').value) || 0;
    const leadTimeCount = parseInt(document.getElementById('genLeadTimeCount').value) || 0;
    
    if (demandCount <= 0 || leadTimeCount <= 0) {
        showError('Please enter positive counts for random numbers.');
        return;
    }
    
    let demandRandoms = [];
    let leadTimeRandoms = [];
    let demandDetailed = [];
    let leadTimeDetailed = [];
    let seed = 0;
    let hasCycle = false;
    
    if (method === 'LCG') {
        const a = parseFloat(document.getElementById('lcgA').value);
        const c = parseFloat(document.getElementById('lcgC').value);
        const m = parseFloat(document.getElementById('lcgM').value);
        seed = parseFloat(document.getElementById('lcgSeed').value);
        
        if (isNaN(a) || isNaN(c) || isNaN(m) || isNaN(seed)) {
            showError('Please enter all LCG parameters.');
            return;
        }
        
        // Generate detailed data for display
        // Use same seed for both demand and lead time
        const demandDetailedResult = generateLCGDetailed(a, c, m, seed, demandCount);
        const leadTimeDetailedResult = generateLCGDetailed(a, c, m, seed, leadTimeCount);
        demandDetailed = demandDetailedResult.data;
        leadTimeDetailed = leadTimeDetailedResult.data;
        
        // Generate actual random numbers
        // Use same seed for both demand and lead time
        const demandRawResult = generateLCG(a, c, m, seed, demandCount);
        const leadTimeRawResult = generateLCG(a, c, m, seed, leadTimeCount);
        const demandRaw = demandRawResult.numbers;
        const leadTimeRaw = leadTimeRawResult.numbers;
        
        // Check for cycles and show warnings
        let cycleWarning = '';
        hasCycle = false;
        if (demandRawResult.cycleDetected) {
            cycleWarning += `Demand: Cycle detected after ${demandRawResult.generatedCount} numbers (cycle length: ${demandRawResult.cycleLength}). `;
            hasCycle = true;
        }
        if (leadTimeRawResult.cycleDetected) {
            cycleWarning += `Lead Time: Cycle detected after ${leadTimeRawResult.generatedCount} numbers (cycle length: ${leadTimeRawResult.cycleLength}). `;
            hasCycle = true;
        }
        if (hasCycle) {
            cycleWarning += 'Please complete the remaining numbers manually.';
            showError(cycleWarning);
        }
        
        // Convert to proper range
        const demandMultiplier = Math.pow(10, getDecimalPlaces(demandData));
        const leadTimeMultiplier = Math.pow(10, getDecimalPlaces(leadTimeData));
        
        demandRandoms = demandRaw.map(n => {
            const scaled = Math.floor((n / 100) * demandMultiplier);
            return scaled === 0 ? demandMultiplier : scaled;
        });
        leadTimeRandoms = leadTimeRaw.map(n => {
            const scaled = Math.floor((n / 100) * leadTimeMultiplier);
            return scaled === 0 ? leadTimeMultiplier : scaled;
        });
        
        // Display detailed tables
        displayLCGTable('genDemandPreview', demandDetailed, seed, demandDetailedResult.cycleDetected, demandDetailedResult.cycleLength);
        displayLCGTable('genLeadTimePreview', leadTimeDetailed, seed, leadTimeDetailedResult.cycleDetected, leadTimeDetailedResult.cycleLength);
    } else if (method === 'MidSquare') {
        seed = parseInt(document.getElementById('midSquareSeed').value);
        
        if (isNaN(seed) || seed < 1000 || seed > 9999) {
            showError('Please enter a valid 4-digit seed (1000-9999).');
            return;
        }
        
        // Generate detailed data for display
        demandDetailed = generateMidSquareDetailed(seed, demandCount);
        leadTimeDetailed = generateMidSquareDetailed(seed + 1000, leadTimeCount);
        
        // Generate actual random numbers
        const demandRaw = generateMidSquare(seed, demandCount);
        const leadTimeRaw = generateMidSquare(seed + 1000, leadTimeCount);
        
        // Convert to proper range
        const demandMultiplier = Math.pow(10, getDecimalPlaces(demandData));
        const leadTimeMultiplier = Math.pow(10, getDecimalPlaces(leadTimeData));
        
        demandRandoms = demandRaw.map(n => {
            const scaled = Math.floor((n / 100) * demandMultiplier);
            return scaled === 0 ? demandMultiplier : scaled;
        });
        leadTimeRandoms = leadTimeRaw.map(n => {
            const scaled = Math.floor((n / 100) * leadTimeMultiplier);
            return scaled === 0 ? leadTimeMultiplier : scaled;
        });
        
        // Display detailed tables
        displayMidSquareTable('genDemandPreview', demandDetailed, seed);
        displayMidSquareTable('genLeadTimePreview', leadTimeDetailed, seed + 1000);
    }
    
    // Store generated numbers
    autoDemandRandoms = demandRandoms;
    autoLeadRandoms = leadTimeRandoms;
    
    document.getElementById('generatedResults').classList.remove('hidden');
    // Don't clear error if there's a cycle warning - let user see it
    if (!hasCycle) {
        clearError();
    }
}

function displayLCGTable(containerId, data, initialSeed, cycleDetected = false, cycleLength = 0) {
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
    
    // Add cycle warning if detected
    if (cycleDetected) {
        html += `<div style="margin-top: 10px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404;"><strong>⚠ Cycle Detected:</strong> Generation stopped after ${data.length} numbers. Cycle length is ${cycleLength}. Please complete the remaining numbers manually.</div>`;
    }
    
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

function generateTableRandomNumbers(table) {
    try {
        const method = document.querySelector(`input[name="${table}GenMethod"]:checked`).value;
        const countInput = document.getElementById(table === 'demand' ? 'genDemandCount' : 'genLeadTimeCount');
        const count = parseInt(countInput.value);

        if (isNaN(count) || count <= 0) {
            showError(`Please enter a valid number of ${table} random numbers.`);
            return;
        }

        let randoms = [];
        let detailed = [];
        let seed = 0;
        let hasCycle = false;

        if (method === 'LCG') {
            const a = parseFloat(document.getElementById(`${table}LcgA`).value);
            const c = parseFloat(document.getElementById(`${table}LcgC`).value);
            const m = parseFloat(document.getElementById(`${table}LcgM`).value);
            seed = parseFloat(document.getElementById(`${table}LcgSeed`).value);

            if (isNaN(a) || isNaN(c) || isNaN(m) || isNaN(seed)) {
                showError('Please enter all LCG parameters.');
                return;
            }

            // Generate detailed data for display
            const detailedResult = generateLCGDetailed(a, c, m, seed, count);
            detailed = detailedResult.data;

            // Generate actual random numbers
            const rawResult = generateLCG(a, c, m, seed, count);
            const raw = rawResult.numbers;

            // Check for cycles and show warnings
            if (rawResult.cycleDetected) {
                const cycleWarning = `${table.charAt(0).toUpperCase() + table.slice(1)}: Cycle detected after ${rawResult.generatedCount} numbers (cycle length: ${rawResult.cycleLength}). Please complete the remaining numbers manually.`;
                showError(cycleWarning);
                hasCycle = true;
            }

            // Convert to proper range
            const multiplier = Math.pow(10, getDecimalPlaces(table === 'demand' ? demandData : leadTimeData));

            randoms = raw.map(n => {
                const scaled = Math.floor((n / 100) * multiplier);
                return scaled === 0 ? multiplier : scaled;
            });

            // Display detailed table
            displayLCGTable(table === 'demand' ? 'genDemandPreview' : 'genLeadTimePreview', detailed, seed, detailedResult.cycleDetected, detailedResult.cycleLength);
        } else if (method === 'MidSquare') {
            seed = parseInt(document.getElementById(`${table}MidSquareSeed`).value);

            if (isNaN(seed) || seed < 1000 || seed > 9999) {
                showError('Please enter a valid 4-digit seed (1000-9999).');
                return;
            }

            // Generate detailed data for display
            detailed = generateMidSquareDetailed(seed, count);

            // Generate actual random numbers
            const raw = generateMidSquare(seed, count);

            // Convert to proper range
            const multiplier = Math.pow(10, getDecimalPlaces(table === 'demand' ? demandData : leadTimeData));

            randoms = raw.map(n => {
                const scaled = Math.floor((n / 100) * multiplier);
                return scaled === 0 ? multiplier : scaled;
            });

            // Display detailed table
            displayMidSquareTable(table === 'demand' ? 'genDemandPreview' : 'genLeadTimePreview', detailed);
        }

        // Store generated numbers
        if (table === 'demand') {
            autoDemandRandoms = randoms;
        } else {
            autoLeadRandoms = randoms;
        }

        // Show results
        const resultsDiv = document.getElementById(`${table}GeneratedResults`);
        resultsDiv.classList.remove('hidden');
        clearError();

    } catch (error) {
        showError('Error generating random numbers: ' + error.message);
    }
}

function useGeneratedTableNumbers(table) {
    const randoms = table === 'demand' ? autoDemandRandoms : autoLeadRandoms;

    if (randoms.length === 0) {
        showError('Please generate numbers first.');
        return;
    }

    // Clear existing rows
    const tbody = document.getElementById(table === 'demand' ? 'tbodyRnDemand' : 'tbodyRnLeadTime');

    while (tbody.children.length > 0) {
        tbody.removeChild(tbody.firstChild);
    }

    // Add rows with generated numbers
    const maxValue = getMaxRandomValue();

    randoms.forEach(num => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${table}')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="0" max="${maxValue}" value="${num}" onchange="updateRandomNumberCounts()"></td>
        `;
        tbody.appendChild(tr);
    });

    // Switch to manual tab
    switchTableMethod(table, 'manual');
    updateRandomNumberCounts();
    clearError();
}

function useGeneratedNumbers() {
    if (autoDemandRandoms.length === 0 || autoLeadRandoms.length === 0) {
        showError('Please generate numbers first.');
        return;
    }
    
    // Clear existing rows (keep at least one)
    const demandTbody = document.getElementById('tbodyRnDemand');
    const leadTimeTbody = document.getElementById('tbodyRnLeadTime');
    
    // Clear demand table
    while (demandTbody.children.length > 0) {
        demandTbody.removeChild(demandTbody.firstChild);
    }
    
    // Clear lead time table
    while (leadTimeTbody.children.length > 0) {
        leadTimeTbody.removeChild(leadTimeTbody.firstChild);
    }
    
    // Add rows with generated numbers
    const maxValue = getMaxRandomValue();
    
    autoDemandRandoms.forEach(num => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, 'demand')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="0" max="${maxValue}" value="${num}" onchange="updateRandomNumberCounts()"></td>
        `;
        demandTbody.appendChild(tr);
    });
    
    autoLeadRandoms.forEach(num => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, 'leadTime')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="0" max="${maxValue}" value="${num}" onchange="updateRandomNumberCounts()"></td>
        `;
        leadTimeTbody.appendChild(tr);
    });
    
    // Switch to manual tab
    switchRandomMethod('manual');
    updateRandomNumberCounts();
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

function collectManualRandoms(type) {
    const values = readRandomNumbersFromTable(type);
    const maxValue = getMaxRandomValue();
    
    if (values.length === 0) {
        showError(`Please enter at least one ${type === 'demand' ? 'demand' : 'lead time'} random number.`);
        return null;
    }
    
    // Validate all values are within range
    for (const val of values) {
        if (val < 0 || val > maxValue) {
            showError(`Random numbers must be between 0 and ${maxValue} (based on probability decimal places).`);
            return null;
        }
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
    
    // Manual method - read from tables
    const demandVals = collectManualRandoms('demand');
    if (!demandVals) return;
    const leadVals = collectManualRandoms('leadTime');
    if (!leadVals) return;
    demandRandoms = demandVals;
    leadTimeRandoms = leadVals;

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
            const demandDecimalPlaces = getDecimalPlaces(demandData);
            const leadTimeDecimalPlaces = getDecimalPlaces(leadTimeData);

            if (day === N) {
                const orderAmount = M - endInv + shortage;
                if (orderAmount > 0) {
                    orderQty = orderAmount;
                    
                    const ltRand = leadTimeRandoms.length ? leadTimeRandoms[leadTimeRandomIndex % leadTimeRandoms.length] : 0;
                    const ltDigits = convertRandomToDigits(ltRand);
                    leadTimeRandDisplay = ltDigits.toString().padStart(leadTimeDecimalPlaces, '0');
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
                <td>${demandDigits.toString().padStart(demandDecimalPlaces, '0')}</td>
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
    // Clear random number tables
    const demandTbody = document.getElementById('tbodyRnDemand');
    const leadTimeTbody = document.getElementById('tbodyRnLeadTime');
    if (demandTbody) {
        while (demandTbody.children.length > 0) {
            demandTbody.removeChild(demandTbody.firstChild);
        }
        // Add one default row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, 'demand')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="0" placeholder="Enter number" onchange="updateRandomNumberCounts()"></td>
        `;
        demandTbody.appendChild(tr);
    }
    if (leadTimeTbody) {
        while (leadTimeTbody.children.length > 0) {
            leadTimeTbody.removeChild(leadTimeTbody.firstChild);
        }
        // Add one default row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, 'leadTime')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="0" placeholder="Enter number" onchange="updateRandomNumberCounts()"></td>
        `;
        leadTimeTbody.appendChild(tr);
    }
    updateRandomNumberCounts();
    document.getElementById('distributionResults').innerHTML = '';
    document.getElementById('simulationTableBody').innerHTML = '';
    document.getElementById('performanceMeasurements').innerHTML = '';
    autoDemandRandoms = [];
    autoLeadRandoms = [];
    document.getElementById('genDemandPreview').textContent = '';
    document.getElementById('genLeadTimePreview').textContent = '';
    document.getElementById('generatedResults').classList.add('hidden');
    clearError();
    goToStep(1);
}

document.addEventListener('DOMContentLoaded', function() {
    init();
    // Initialize random number tables with proper max values
    updateRandomNumberInputsMax();
    // Update counts on initialization
    updateRandomNumberCounts();
});