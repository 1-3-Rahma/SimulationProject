// ========== Utilities ==========

function parseDistributionText(text) {
    const lines = text.split('\n').map(ln => ln.trim()).filter(ln => ln.length > 0);
    if (lines.length === 0) throw new Error("Distribution cannot be empty.");
    
    const dist = [];
    for (const ln of lines) {
        const parts = ln.split(',').map(p => p.trim());
        if (parts.length !== 2) throw new Error(`Each line must be 'time,prob' -> '${ln}'`);
        
        let t = parseFloat(parts[0]);
        if (isNaN(t)) throw new Error(`Invalid time value: '${parts[0]}' in line '${ln}'`);
        
        let p = parseFloat(parts[1]);
        if (isNaN(p)) throw new Error(`Invalid probability value: '${parts[1]}' in line '${ln}'`);
        if (p < 0 || p > 1) throw new Error(`Probability must be between 0 and 1 in line '${ln}'`);
        
        dist.push([t, p]);
    }
    
    const total = dist.reduce((sum, [_, p]) => sum + p, 0);
    if (Math.abs(total - 1.0) > 1e-6) {
        throw new Error(`Probabilities must sum to 1.0 (current sum = ${total.toFixed(6)})`);
    }
    
    return dist;
}

function buildCumulativeIntervals(dist) {
    const table = [];
    let cum = 0.0;
    let prevUpper = 0;
    const n = dist.length;
    
    for (let i = 0; i < n; i++) {
        const [time, prob] = dist[i];
        cum += prob;
        let upper = Math.round(cum * 100);
        if (upper <= prevUpper) upper = prevUpper + 1;
        if (i === n - 1) upper = 100;
        
        const low = prevUpper + 1;
        table.push({
            time: time,
            prob: prob,
            cum: parseFloat(cum.toFixed(5)),
            low: low,
            high: upper
        });
        prevUpper = upper;
    }
    
    return table;
}

// Ensure cumulative probability sums to exactly 1 (within small tolerance)
function validateTotalProbability(dist, label, silent = false) {
    const total = dist.reduce((sum, [_, p]) => sum + p, 0);
    if (Math.abs(total - 1) > 1e-6) {
        if (!silent) {
            alert(`${label} probabilities must sum to 1. Current total = ${total.toFixed(4)}. Please adjust the probabilities.`);
        }
        return { ok: false, total };
    }
    return { ok: true, total };
}

function mapRandomToTime(rn, table) {
    if (rn < 1 || rn > 100) throw new Error("Random numbers must be in the range 1..100.");
    for (const row of table) {
        if (rn >= row.low && rn <= row.high) return row.time;
    }
    return table[table.length - 1].time;
}

function weightedAverage(dist) {
    return dist.reduce((sum, [t, p]) => sum + t * p, 0);
}

// ========== Time-Limited Simulation Core ==========

function runTimeLimitedSimulation(timeLimit, limitType, arrivalTable, serverTables, arrRns, servRns, preference, numServers) {
    const serversAvailable = new Array(numServers).fill(0.0);
    let servIdx = 0;
    let arrIdx = 0;
    const results = [];
    let currentTime = 0.0;
    let customerNumber = 1;

    // Calculate server averages for faster/slower detection
    const serverAverages = serverTables.map((table, idx) => ({
        id: idx,
        avg: weightedAverage(table.map(r => [r.time, r.prob]))
    }));
    serverAverages.sort((a, b) => a.avg - b.avg);
    const fasterId = serverAverages[0].id;
    const slowerId = serverAverages[serverAverages.length - 1].id;

    while (true) {
        let arrivalTime, arrInterval, rnArr;
        
        if (customerNumber === 1) {
            arrivalTime = 0.0;
            arrInterval = null;
            rnArr = null;
        } else {
            if (arrIdx >= arrRns.length) {
                throw new Error(`Not enough arrival random numbers. Needed at least ${arrIdx + 1}.`);
            }
            rnArr = arrRns[arrIdx];
            arrIdx++;
            arrInterval = mapRandomToTime(rnArr, arrivalTable);
            currentTime += arrInterval;
            arrivalTime = currentTime;
        }

        // Check stopping condition based on arrival time
        if (limitType === "arrival" || limitType === "both") {
            if (arrivalTime > timeLimit) {
                break; // Stop before processing this customer
            }
        }

        // Find available server(s)
        const availableServers = [];
        for (let i = 0; i < numServers; i++) {
            if (serversAvailable[i] <= arrivalTime) {
                availableServers.push(i);
            }
        }

        let serverId;
        if (availableServers.length === 0) {
            // All servers busy, choose the one that becomes free first
            serverId = serversAvailable.indexOf(Math.min(...serversAvailable));
        } else if (availableServers.length === 1) {
            serverId = availableServers[0];
        } else {
            // Multiple servers available, choose based on preference
            if (preference === 'Faster') {
                // Find fastest available server
                const fastestAvailable = availableServers.reduce((fastest, id) => {
                    const fastestAvg = serverAverages.find(s => s.id === fastest)?.avg || Infinity;
                    const currentAvg = serverAverages.find(s => s.id === id)?.avg || Infinity;
                    return currentAvg < fastestAvg ? id : fastest;
                });
                serverId = fastestAvailable;
            } else {
                // Find slowest available server
                const slowestAvailable = availableServers.reduce((slowest, id) => {
                    const slowestAvg = serverAverages.find(s => s.id === slowest)?.avg || 0;
                    const currentAvg = serverAverages.find(s => s.id === id)?.avg || 0;
                    return currentAvg > slowestAvg ? id : slowest;
                });
                serverId = slowestAvailable;
            }
        }

        const startService = customerNumber === 1 ? 0.0 : Math.max(arrivalTime, serversAvailable[serverId]);
        const wait = customerNumber === 1 ? 0.0 : startService - arrivalTime;

        if (servIdx >= servRns.length) {
            throw new Error(`Not enough service random numbers. Needed at least ${servIdx + 1}.`);
        }

        const rnServ = servRns[servIdx];
        servIdx++;
        
        const servTable = serverTables[serverId];
        const servTime = mapRandomToTime(rnServ, servTable);
        const endService = startService + servTime;
        
        // Check stopping condition based on service end time
        if (limitType === "serviceEnd" || limitType === "both") {
            if (endService > timeLimit) {
                // Include this customer if service end exceeds limit
                results.push({
                    cust: customerNumber,
                    rn_arr: rnArr,
                    arr_interval: arrInterval,
                    arrival_time: parseFloat(arrivalTime.toFixed(3)),
                    server: serverId + 1,
                    server_name: `Server ${serverId + 1}`,
                    rn_serv: rnServ,
                    service_time: servTime,
                    start: parseFloat(startService.toFixed(3)),
                    wait: parseFloat(wait.toFixed(3)),
                    end: parseFloat(endService.toFixed(3))
                });
                break; // Stop after including this customer
            }
        }

        serversAvailable[serverId] = endService;

        results.push({
            cust: customerNumber,
            rn_arr: rnArr,
            arr_interval: arrInterval,
            arrival_time: parseFloat(arrivalTime.toFixed(3)),
            server: serverId + 1,
            server_name: `Server ${serverId + 1}`,
            rn_serv: rnServ,
            service_time: servTime,
            start: parseFloat(startService.toFixed(3)),
            wait: parseFloat(wait.toFixed(3)),
            end: parseFloat(endService.toFixed(3))
        });

        customerNumber++;
        
        // Safety check to prevent infinite loops
        if (customerNumber > 10000) {
            throw new Error("Simulation exceeded maximum iterations. Check your time limit and random numbers.");
        }
    }

    return {
        results: results,
        serverAverages: serverAverages.map(s => ({ id: s.id, avg: parseFloat(s.avg.toFixed(4)) })),
        fasterId: fasterId,
        slowerId: slowerId
    };
}

// ========== Global State ==========

let arrivalTable = null;
let serverTables = []; // Array of tables for dynamic servers
let currentTab = 0;
let numServers = 2;

// ========== Tab Management ==========

function switchTab(tabIdx) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab${tabIdx}`).classList.add('active');
    document.querySelectorAll('.tab-btn')[tabIdx].classList.add('active');
    currentTab = tabIdx;
}

function nextTab(tabIdx) {
    // Prevent moving forward when cumulative probability exceeds 1
    if (tabIdx > currentTab) {
        if (currentTab === 1) { // leaving interarrival step
            const dist = readDistributionFromTable('tbodyArrival');
            const { ok } = validateTotalProbability(dist, 'Interarrival');
            if (!ok) return;
        } else if (currentTab === 2) { // leaving service step
            for (let i = 1; i <= numServers; i++) {
                const dist = readDistributionFromTable(`tbodyS${i}`);
                const { ok } = validateTotalProbability(dist, `Service (Server ${i})`);
                if (!ok) return;
            }
        }
    }
    switchTab(tabIdx);
}

function prevTab(tabIdx) {
    switchTab(tabIdx);
}

// ========== Server Count Management ==========

function updateServerCount() {
    const input = document.getElementById('numServers');
    if (!input) return;
    
    const newCount = parseInt(input.value) || 2;
    if (newCount < 2) {
        alert('Minimum 2 servers required.');
        input.value = 2;
        return;
    }
    
    numServers = newCount;
    generateServiceTables();
}

function generateServiceTables() {
    const container = document.getElementById('serviceContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= numServers; i++) {
        const serviceBox = document.createElement('div');
        serviceBox.className = 'service-box';
        serviceBox.innerHTML = `
            <h3>Server ${i}</h3>
            <p>Fill in the table directly with Time and Probability values.</p>
            <div class="table-controls">
                <button class="btn-add-row" onclick="addServiceRow(${i})"> Add Row</button>
                <input type="number" id="serviceRowCount${i}" min="1" max="50" value="3" placeholder="Rows" style="width: 80px; margin: 0 5px; padding: 5px;">
                <button class="btn btn-secondary" onclick="generateServiceRows(${i})">Generate Rows</button>
            </div>
            <h4>Table</h4>
            <div class="table-container">
                <table id="tableS${i}" class="editable-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;"></th>
                            <th>Time</th>
                            <th>Probability</th>
                            <th>Cumulative</th>
                            <th>Interval</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyS${i}">
                        <tr>
                            <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, ${i})" title="Delete row">🗑️</button></td>
                            <td><input type="number" class="table-input" step="0.1" min="0" placeholder="Time" onchange="calculateServiceTable(${i})"></td>
                            <td><input type="number" class="table-input" step="0.01" min="0" max="1" placeholder="Prob" onchange="calculateServiceTable(${i})"></td>
                            <td class="calculated-cell"></td>
                            <td class="calculated-cell"></td>
                        </tr>
                        <tr>
                            <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, ${i})" title="Delete row">🗑️</button></td>
                            <td><input type="number" class="table-input" step="0.1" min="0" placeholder="Time" onchange="calculateServiceTable(${i})"></td>
                            <td><input type="number" class="table-input" step="0.01" min="0" max="1" placeholder="Prob" onchange="calculateServiceTable(${i})"></td>
                            <td class="calculated-cell"></td>
                            <td class="calculated-cell"></td>
                        </tr>
                        <tr>
                            <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, ${i})" title="Delete row">🗑️</button></td>
                            <td><input type="number" class="table-input" step="0.1" min="0" placeholder="Time" onchange="calculateServiceTable(${i})"></td>
                            <td><input type="number" class="table-input" step="0.01" min="0" max="1" placeholder="Prob" onchange="calculateServiceTable(${i})"></td>
                            <td class="calculated-cell"></td>
                            <td class="calculated-cell"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(serviceBox);
    }
    
    // Reset server tables array
    serverTables = new Array(numServers).fill(null);
}

// ========== Table Building ==========

function readDistributionFromTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    
    const rows = tbody.querySelectorAll('tr');
    const dist = [];
    
    for (const row of rows) {
        const timeInput = row.querySelector('td:nth-child(2) input');
        const probInput = row.querySelector('td:nth-child(3) input');
        
        if (!timeInput || !probInput) continue;
        
        const time = parseFloat(timeInput.value);
        const prob = parseFloat(probInput.value);
        
        if (isNaN(time) || isNaN(prob)) continue;
        if (prob < 0 || prob > 1) continue;
        
        if (time !== 0 || prob !== 0) {
            dist.push([time, prob]);
        }
    }
    
    return dist;
}

function calculateArrivalTable() {
    try {
        const dist = readDistributionFromTable('tbodyArrival');
        if (dist.length === 0) {
            const tbody = document.getElementById('tbodyArrival');
            const rows = tbody.querySelectorAll('tr');
            const hasAnyInput = Array.from(rows).some(row => {
                const timeInput = row.querySelector('td:nth-child(2) input');
                const probInput = row.querySelector('td:nth-child(3) input');
                if (!timeInput || !probInput) return false;
                const time = parseFloat(timeInput.value);
                const prob = parseFloat(probInput.value);
                return !isNaN(time) && !isNaN(prob) && (time !== 0 || prob !== 0);
            });
            
            if (!hasAnyInput) return;
            
            const hasRows = rows.length > 0;
            if (hasRows) {
                alert('Please enter at least one row with valid Time and Probability values.');
            }
            return;
        }
        
        const table = buildCumulativeIntervals(dist);
        arrivalTable = table;
        
        const tbody = document.getElementById('tbodyArrival');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(4)');
                const intervalCell = row.querySelector('td:nth-child(5)');
                const interval = `${String(table[idx].low).padStart(2, '0')}-${String(table[idx].high).padStart(2, '0')}`;
                
                if (cumCell) cumCell.textContent = table[idx].cum.toFixed(5);
                if (intervalCell) intervalCell.textContent = interval;
            }
        });
    } catch (err) {
        alert(`Calculation error: ${err.message}`);
    }
}

function addArrivalRow() {
    const tbody = document.getElementById('tbodyArrival');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteArrivalRow(this)" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td class="calculated-cell">--</td>
        <td class="calculated-cell">--</td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('td:nth-child(2) input').focus();
}

function generateArrivalRows() {
    const input = document.getElementById('arrivalRowCount');
    if (!input) return;
    
    const count = parseInt(input.value) || 3;
    if (count < 1 || count > 50) {
        alert('Please enter a number between 1 and 50.');
        return;
    }
    
    const tbody = document.getElementById('tbodyArrival');
    if (!tbody) return;
    
    // Clear existing rows first (optional - you can remove this if you want to append)
    // tbody.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteArrivalRow(this)" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
            <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
            <td class="calculated-cell">--</td>
            <td class="calculated-cell">--</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(2) input').focus();
    }
}

function deleteArrivalRow(btn) {
    const tbody = document.getElementById('tbodyArrival');
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateArrivalTable();
}

function calculateServiceTable(serverId) {
    try {
        const tbodyId = `tbodyS${serverId}`;
        const dist = readDistributionFromTable(tbodyId);
        
        if (dist.length === 0) {
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;
            
            const rows = tbody.querySelectorAll('tr');
            const hasAnyInput = Array.from(rows).some(row => {
                const timeInput = row.querySelector('td:nth-child(2) input');
                const probInput = row.querySelector('td:nth-child(3) input');
                if (!timeInput || !probInput) return false;
                const time = parseFloat(timeInput.value);
                const prob = parseFloat(probInput.value);
                return !isNaN(time) && !isNaN(prob) && (time !== 0 || prob !== 0);
            });
            
            if (!hasAnyInput) return;
            
            const hasRows = rows.length > 0;
            if (hasRows) {
                alert('Please enter at least one row with valid Time and Probability values.');
            }
            return;
        }
        
        const table = buildCumulativeIntervals(dist);
        serverTables[serverId - 1] = table;
        
        const tbody = document.getElementById(tbodyId);
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(4)');
                const intervalCell = row.querySelector('td:nth-child(5)');
                const interval = `${String(table[idx].low).padStart(2, '0')}-${String(table[idx].high).padStart(2, '0')}`;
                
                if (cumCell) cumCell.textContent = table[idx].cum.toFixed(5);
                if (intervalCell) intervalCell.textContent = interval;
            }
        });
        
        updateSpeedDetection();
    } catch (err) {
        alert(`Calculation error: ${err.message}`);
    }
}

function addServiceRow(serverId) {
    const tbodyId = `tbodyS${serverId}`;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, ${serverId})" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable(${serverId})" onblur="if(this.value !== '') calculateServiceTable(${serverId})"></td>
        <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable(${serverId})" onblur="if(this.value !== '') calculateServiceTable(${serverId})"></td>
        <td class="calculated-cell">--</td>
        <td class="calculated-cell">--</td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('td:nth-child(2) input').focus();
}

function generateServiceRows(serverId) {
    const input = document.getElementById(`serviceRowCount${serverId}`);
    if (!input) return;
    
    const count = parseInt(input.value) || 3;
    if (count < 1 || count > 50) {
        alert('Please enter a number between 1 and 50.');
        return;
    }
    
    const tbodyId = `tbodyS${serverId}`;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    // Clear existing rows first (optional - you can remove this if you want to append)
    // tbody.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, ${serverId})" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable(${serverId})" onblur="if(this.value !== '') calculateServiceTable(${serverId})"></td>
            <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable(${serverId})" onblur="if(this.value !== '') calculateServiceTable(${serverId})"></td>
            <td class="calculated-cell">--</td>
            <td class="calculated-cell">--</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(2) input').focus();
    }
}

function deleteServiceRow(btn, serverId) {
    const tbodyId = `tbodyS${serverId}`;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateServiceTable(serverId);
}

function updateSpeedDetection() {
    if (serverTables.length < 2) return;
    if (serverTables.some(t => !t)) return;
    
    const serverAverages = serverTables.map((table, idx) => {
        const dist = table.map(r => [r.time, r.prob]);
        return {
            id: idx,
            avg: weightedAverage(dist),
            name: `Server ${idx + 1}`
        };
    });
    
    serverAverages.sort((a, b) => a.avg - b.avg);
    const faster = serverAverages[0].name;
    const slower = serverAverages[serverAverages.length - 1].name;
    const minAvg = serverAverages[0].avg.toFixed(3);
    const maxAvg = serverAverages[serverAverages.length - 1].avg.toFixed(3);
    
    const speedDiv = document.getElementById('speedDetection');
    if (speedDiv) {
        speedDiv.innerHTML = `Detected: Faster = <strong>${faster}</strong> (avg=${minAvg}), Slower = <strong>${slower}</strong> (avg=${maxAvg})`;
        speedDiv.classList.remove('hidden');
    }
}

// ========== Random Number Management ==========

function readRandomNumbersFromTable(type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    
    const rows = tbody.querySelectorAll('tr');
    const numbers = [];
    
    for (const row of rows) {
        const input = row.querySelector('td:nth-child(2) input');
        if (!input) continue;
        
        const value = parseInt(input.value);
        if (!isNaN(value) && value >= 1 && value <= 100) {
            numbers.push(value);
        }
    }
    
    return numbers;
}

function addRandomNumberRow(type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" min="1" max="100" value="" placeholder="1-100" onchange="updateRandomNumberCounts()"></td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('td:nth-child(2) input').focus();
    updateRandomNumberCounts();
}

function deleteRandomNumberRow(btn, type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    updateRandomNumberCounts();
}

function generateRandomNumberRows(type) {
    const inputId = type === 'arrival' ? 'randomArrivalRowCount' : 'randomServiceRowCount';
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const count = parseInt(input.value) || 5;
    if (count < 1 || count > 100) {
        alert('Please enter a number between 1 and 100.');
        return;
    }
    
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="1" max="100" value="" placeholder="1-100" onchange="updateRandomNumberCounts()"></td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(2) input').focus();
    }
    
    updateRandomNumberCounts();
}

function updateRandomNumberCounts() {
    const arrNumbers = readRandomNumbersFromTable('arrival');
    const servNumbers = readRandomNumbersFromTable('service');
    
    const arrivalCountEl = document.getElementById('arrivalCount');
    const serviceCountEl = document.getElementById('serviceCount');
    
    if (arrivalCountEl) arrivalCountEl.textContent = `Count: ${arrNumbers.length} numbers`;
    if (serviceCountEl) serviceCountEl.textContent = `Count: ${servNumbers.length} numbers`;
    
    const txtRnArr = document.getElementById('txtRnArr');
    const txtRnServ = document.getElementById('txtRnServ');
    if (txtRnArr) txtRnArr.value = arrNumbers.join(', ');
    if (txtRnServ) txtRnServ.value = servNumbers.join(', ');
}

// ========== Simulation Execution ==========

function runSimulationFromUI() {
    try {
        const timeLimit = parseFloat(document.getElementById('timeLimit').value);
        if (isNaN(timeLimit) || timeLimit <= 0) {
            alert('Please enter a valid time limit greater than 0.');
            switchTab(0);
            return;
        }
        
        const limitType = document.getElementById('limitType').value;
        const preference = document.querySelector('input[name="preference"]:checked').value;
        
        // Ensure tables are calculated
        if (!arrivalTable) {
            calculateArrivalTable();
            if (!arrivalTable) {
                alert('Please fill in the arrival table in Step 2 first.');
                switchTab(1);
                return;
            }
        }
        // Validate arrival sum exactly 1 before proceeding
        const arrivalDistCheck = readDistributionFromTable('tbodyArrival');
        const { ok: arrOk } = validateTotalProbability(arrivalDistCheck, 'Interarrival');
        if (!arrOk) {
            switchTab(1);
            return;
        }
        
        // Check all server tables
        const allTablesReady = serverTables.length === numServers && 
                               serverTables.every(t => t !== null && t.length > 0);
        
        if (!allTablesReady) {
            for (let i = 1; i <= numServers; i++) {
                if (!serverTables[i - 1]) {
                    calculateServiceTable(i);
                }
            }
            
            const stillNotReady = serverTables.some(t => !t || t.length === 0);
            if (stillNotReady) {
                alert(`Please fill in all ${numServers} service tables in Step 3 first.`);
                switchTab(2);
                return;
            }
        }
        
        // Validate each service table sums to 1 before proceeding
        for (let i = 1; i <= numServers; i++) {
            const distCheck = readDistributionFromTable(`tbodyS${i}`);
            const { ok } = validateTotalProbability(distCheck, `Service (Server ${i})`);
            if (!ok) {
                switchTab(2);
                return;
            }
        }
        
        // Read random numbers
        const arrRns = readRandomNumbersFromTable('arrival');
        const servRns = readRandomNumbersFromTable('service');
        
        if (arrRns.length < 10) {
            alert(`Recommended: At least 10 arrival random numbers for time-limited simulation. Currently have ${arrRns.length}.`);
        }
        
        if (servRns.length < 10) {
            alert(`Recommended: At least 10 service random numbers for time-limited simulation. Currently have ${servRns.length}.`);
        }
        
        const simData = runTimeLimitedSimulation(
            timeLimit, 
            limitType, 
            arrivalTable, 
            serverTables, 
            arrRns, 
            servRns, 
            preference, 
            numServers
        );
        
        populateResults(simData, timeLimit, limitType);
        switchTab(4);
    } catch (err) {
        alert(`Simulation error: ${err.message}`);
    }
}

function populateResults(simData, timeLimit, limitType) {
    const tbody = document.querySelector('#tableResults tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const results = simData.results;
    const n = results.length;
    
    // Calculate totals for performance measures
    let totalService = 0;
    let totalWaiting = 0;
    const serverServiceTime = new Array(numServers).fill(0); // Track service time per server
    
    for (const row of results) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.cust}</td>
            <td>${row.rn_arr !== null ? row.rn_arr : '--'}</td>
            <td>${row.arr_interval !== null ? row.arr_interval.toFixed(3) : '--'}</td>
            <td>${row.arrival_time !== null ? row.arrival_time.toFixed(3) : '--'}</td>
            <td>${row.server}</td>
            <td>${row.server_name}</td>
            <td>${row.rn_serv}</td>
            <td>${row.service_time.toFixed(3)}</td>
            <td>${row.start.toFixed(3)}</td>
            <td>${row.wait.toFixed(3)}</td>
            <td>${row.end.toFixed(3)}</td>
        `;
        tbody.appendChild(tr);
        
        // Calculate totals
        totalService += row.service_time;
        totalWaiting += row.wait;
        
        // Track service time per server (server is 1-indexed, so subtract 1 for array index)
        const serverIdx = row.server - 1;
        if (serverIdx >= 0 && serverIdx < numServers) {
            serverServiceTime[serverIdx] += row.service_time;
        }
    }
    
    // Display server speed info
    const speedDiv = document.getElementById('speedInfo');
    if (speedDiv && simData.serverAverages.length > 0) {
        const faster = simData.serverAverages.find(s => s.id === simData.fasterId);
        const slower = simData.serverAverages.find(s => s.id === simData.slowerId);
        if (faster && slower) {
            speedDiv.innerHTML = `Detected faster: <strong>Server ${faster.id + 1}</strong> (avg=${faster.avg}), slower: <strong>Server ${slower.id + 1}</strong> (avg=${slower.avg})`;
            speedDiv.classList.remove('hidden');
        }
    }
    
    // Display time limit info
    const timeLimitDiv = document.getElementById('timeLimitInfo');
    if (timeLimitDiv) {
        const lastCustomer = results[results.length - 1];
        const limitTypeText = limitType === 'arrival' ? 'Arrival Time' : 
                             limitType === 'serviceEnd' ? 'Service End Time' : 
                             'Arrival or Service End Time';
        timeLimitDiv.innerHTML = `
            <strong>Simulation stopped at:</strong> ${limitTypeText} limit of ${timeLimit.toFixed(2)}. 
            Processed ${n} customer(s). 
            Last customer: Arrival=${lastCustomer.arrival_time !== null ? lastCustomer.arrival_time.toFixed(3) : '--'}, End=${lastCustomer.end.toFixed(3)}
        `;
        timeLimitDiv.classList.remove('hidden');
    }
    
    // Calculate performance measures
    const totalRunTime = results.length > 0 ? results[results.length - 1].end : 0;
    calculatePerformanceMeasures(n, totalService, totalWaiting, totalRunTime, numServers, serverServiceTime);
}

function calculatePerformanceMeasures(n, totalService, totalWaiting, totalRunTime, numServers, serverServiceTime) {
    const resultsDiv = document.getElementById('queueResults');
    if (!resultsDiv) return;
    
    // Calculate metrics
    const avgWaiting = totalWaiting / n;
    const utilization = totalRunTime > 0 ? totalService / (numServers * totalRunTime) : 0;
    
    // Calculate individual server utilization
    const serverUtilizations = [];
    for (let i = 0; i < numServers; i++) {
        const util = totalRunTime > 0 ? serverServiceTime[i] / totalRunTime : 0;
        serverUtilizations.push(util);
    }
    
    // Build detailed step-by-step explanations
    let html = '<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #D2B48C;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Performance Measures - Calculation Steps</h3>';
    
    // 1. Average waiting time
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">1. Average Waiting Time (minutes)</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Average waiting time = Total waiting time ÷ Total number of customers</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all waiting times from the simulation table = ${totalWaiting.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Total number of customers = ${n}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Average = ${totalWaiting.toFixed(2)} ÷ ${n} = <strong style="color: #8B4513; font-size: 1.1em;">${avgWaiting.toFixed(2)} minutes</strong></p>`;
    html += '</div>';
    
    // 2. Overall Server Utilization
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">2. Overall Server Utilization</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Utilization = Total service time ÷ (Number of servers × Total run time)</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all service times from the simulation table = ${totalService.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Number of servers = ${numServers}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Total run time = Time when last service ends = ${totalRunTime.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 4:</strong> Utilization = ${totalService.toFixed(2)} ÷ (${numServers} × ${totalRunTime.toFixed(2)}) = ${totalService.toFixed(2)} ÷ ${(numServers * totalRunTime).toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${utilization.toFixed(4)}</strong> or <strong style="color: #8B4513; font-size: 1.1em;">${(utilization * 100).toFixed(2)}%</strong></p>`;
    html += '</div>';
    
    // 3. Individual Server Utilization
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">3. Individual Server Utilization</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Server Utilization = Total service time for that server ÷ Total run time</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Total run time = Time when last service ends = ${totalRunTime.toFixed(2)} minutes</p>`;
    
    for (let i = 0; i < numServers; i++) {
        const serverNum = i + 1;
        html += `<p style="margin: 5px 0;"><strong>Server ${serverNum}:</strong></p>`;
        html += `<p style="margin: 5px 0; padding-left: 20px;">- Total service time for Server ${serverNum} = ${serverServiceTime[i].toFixed(2)} minutes</p>`;
        html += `<p style="margin: 5px 0; padding-left: 20px;">- Utilization = ${serverServiceTime[i].toFixed(2)} ÷ ${totalRunTime.toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${serverUtilizations[i].toFixed(4)}</strong> or <strong style="color: #8B4513; font-size: 1.1em;">${(serverUtilizations[i] * 100).toFixed(2)}%</strong></p>`;
    }
    html += '</div>';
    
    // Summary box
    html += '<div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5E6D3 0%, #E6D5C3 100%); border-radius: 8px; border: 2px solid #8B4513;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; text-align: center;">Summary of Results</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">';
    html += `<div><strong>Average waiting time:</strong> ${avgWaiting.toFixed(2)} minutes</div>`;
    html += `<div><strong>Overall server utilization:</strong> ${utilization.toFixed(4)} (${(utilization * 100).toFixed(2)}%)</div>`;
    for (let i = 0; i < numServers; i++) {
        html += `<div><strong>Server ${i + 1} utilization:</strong> ${serverUtilizations[i].toFixed(4)} (${(serverUtilizations[i] * 100).toFixed(2)}%)</div>`;
    }
    html += '</div>';
    html += '</div>';
    
    html += '</div>';

    if (resultsDiv) {
        resultsDiv.innerHTML = html;
        resultsDiv.className = 'result';
        resultsDiv.style.background = '#f9f9f9';
        resultsDiv.style.color = '#5C4033';
        resultsDiv.style.padding = '20px';
        resultsDiv.style.borderRadius = '8px';
        resultsDiv.style.marginTop = '20px';
    }
    
    // Scroll to top of the page to show simulation table first (not performance measures)
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

function clearResults() {
    const tbody = document.querySelector('#tableResults tbody');
    const resultsDiv = document.getElementById('queueResults');
    if (tbody) tbody.innerHTML = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
    
    const speedDiv = document.getElementById('speedInfo');
    if (speedDiv) speedDiv.classList.add('hidden');
    
    const timeLimitDiv = document.getElementById('timeLimitInfo');
    if (timeLimitDiv) timeLimitDiv.classList.add('hidden');
    
    alert('Results cleared. You can run another simulation.');
}

// ========== Initialization ==========

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        try {
            const arrivalDist = readDistributionFromTable('tbodyArrival');
            if (arrivalDist.length > 0) {
                calculateArrivalTable();
            }
        } catch (e) {
            // Silently ignore
        }
        
        // Initialize server tables will be done by updateServerCount
        updateServerCount();
    }, 100);
});
