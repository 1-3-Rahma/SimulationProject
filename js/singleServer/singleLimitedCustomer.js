// Clear all input fields on page load to prevent browser autofill from persisting values
window.addEventListener('DOMContentLoaded', function() {
    const inputsToClear = [
        'numCustomers',
        'numInterarrivalRows',
        'numServiceRows',
        'randomDigitScale',
        'interarrivalInput',
        'serviceInput'
    ];
    
    inputsToClear.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = '';
        }
    });
});

function parseNumberList(input, expectedLength) {
    if (!input) return [];
    const parts = input.split(',').map(x => x.trim()).filter(x => x !== '');
    const nums = parts.map(x => parseFloat(x)).filter(x => !isNaN(x));
    if (expectedLength && nums.length !== expectedLength) {
        // allow one less for interarrival times (first customer can be 0 or omitted)
        if (!(nums.length === expectedLength - 1)) {
            return null;
        }
    }
    return nums;
}

function createDistributionTables() {
    const numInter = parseInt(document.getElementById('numInterarrivalRows').value, 10);
    const numService = parseInt(document.getElementById('numServiceRows').value, 10);

    const interSection = document.getElementById('interarrivalDistSection');
    const serviceSection = document.getElementById('serviceDistSection');
    const probCalcSection = document.getElementById('probCalcSection');
    const interContainer = document.getElementById('interarrivalDistTableContainer');
    const serviceContainer = document.getElementById('serviceDistTableContainer');

    if (isNaN(numInter) || numInter <= 0 || isNaN(numService) || numService <= 0) {
        alert('Please enter valid positive numbers for the number of rows.');
        return;
    }

    // Build Inter-arrival distribution table (no first row special case - all rows are for distribution)
    let interHtml = '<table style="width:100%; border-collapse:collapse; font-size:14px;">';
    interHtml += '<thead><tr style="background:#F5E6D3;">';
    interHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Row</th>';
    interHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Inter-arrival Time (minutes)</th>';
    interHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Probability</th>';
    interHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Cumulative Probability</th>';
    interHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Random Digit Assignment Range</th>';
    interHtml += '</tr></thead><tbody>';
    for (let i = 1; i <= numInter; i++) {
        interHtml += '<tr' + (i % 2 === 0 ? ' style="background:rgba(245,230,211,0.4);"' : '') + '>';
        interHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' + i + '</td>';
        interHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' +
                     '<input type="number" min="0" step="0.01" ' +
                     'class="inter-time-input" data-row="' + i + '" ' +
                     'style="width:80px; padding:4px;" ' +
                     'oninput="if (this.value < 0) this.value = 0;" />' +
                     '</td>';
        interHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' +
                     '<input type="number" min="0" max="1" step="0.01" ' +
                     'class="inter-prob-input" data-row="' + i + '" ' +
                     'style="width:80px; padding:4px;" ' +
                     'oninput="if (this.value < 0) this.value = 0; if (this.value > 1) this.value = 1;" />' +
                     '</td>';
        interHtml += '<td class="inter-cum-cell" data-row="' + i + '" style="border:1px solid #D2B48C; padding:6px; text-align:center;"></td>';
        interHtml += '<td class="inter-range-cell" data-row="' + i + '" style="border:1px solid #D2B48C; padding:6px; text-align:center;"></td>';
        interHtml += '</tr>';
    }
    interHtml += '</tbody></table>';
    interContainer.innerHTML = interHtml;
    interSection.style.display = 'block';

    // Build Service distribution table
    let serviceHtml = '<table style="width:100%; border-collapse:collapse; font-size:14px;">';
    serviceHtml += '<thead><tr style="background:#F5E6D3;">';
    serviceHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Row</th>';
    serviceHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Service Time (minutes)</th>';
    serviceHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Probability</th>';
    serviceHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Cumulative Probability</th>';
    serviceHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Random Digit Assignment Range</th>';
    serviceHtml += '</tr></thead><tbody>';
    for (let i = 1; i <= numService; i++) {
        serviceHtml += '<tr' + (i % 2 === 0 ? ' style="background:rgba(245,230,211,0.4);"' : '') + '>';
        serviceHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' + i + '</td>';
        serviceHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' +
                       '<input type="number" min="0" step="0.01" ' +
                       'class="service-time-input" data-row="' + i + '" ' +
                       'style="width:80px; padding:4px;" ' +
                       'oninput="if (this.value < 0) this.value = 0;" />' +
                       '</td>';
        serviceHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' +
                       '<input type="number" min="0" max="1" step="0.01" ' +
                       'class="service-prob-input" data-row="' + i + '" ' +
                       'style="width:80px; padding:4px;" ' +
                       'oninput="if (this.value < 0) this.value = 0; if (this.value > 1) this.value = 1;" />' +
                       '</td>';
        serviceHtml += '<td class="service-cum-cell" data-row="' + i + '" style="border:1px solid #D2B48C; padding:6px; text-align:center;"></td>';
        serviceHtml += '<td class="service-range-cell" data-row="' + i + '" style="border:1px solid #D2B48C; padding:6px; text-align:center;"></td>';
        serviceHtml += '</tr>';
    }
    serviceHtml += '</tbody></table>';
    serviceContainer.innerHTML = serviceHtml;
    serviceSection.style.display = 'block';

    // Show probability calculation section once tables exist
    probCalcSection.style.display = 'block';
}

function calculateDistributions() {
    // Get the scale from user input
    const scaleInput = document.getElementById('randomDigitScale');
    const scale = scaleInput ? parseInt(scaleInput.value, 10) : 100;
    if (isNaN(scale) || scale < 10) {
        alert('Please enter a valid random digit scale (minimum 10).');
        return;
    }

    // Determine number of digits for padding
    const numDigits = Math.ceil(Math.log10(scale));
    
    // Helper to format range: ranges start from 01 (or 001, 0001, etc.), and 00 (or 000, 0000, etc.) represents the max
    function formatRange(low, high, maxVal) {
        const l = Math.max(1, low); // Start from 01 (which is 1)
        const h = Math.max(l, Math.min(maxVal, high));
        const pad = n => n.toString().padStart(numDigits, '0');
        if (h < l) return '';
        // If high equals max, display as all zeros
        const highDisplay = h === maxVal ? 0 : h;
        return pad(l) + '-' + pad(highDisplay);
    }

    // Inter-arrival distribution table
    const interTable = document.querySelector('#interarrivalDistTableContainer table tbody');
    let interFinalCum = 0;
    if (interTable) {
        let cum = 0;
        const rows = interTable.querySelectorAll('tr');
        rows.forEach((row) => {
            const probInput = row.querySelector('.inter-prob-input');
            const cumCell = row.querySelector('.inter-cum-cell');
            const rangeCell = row.querySelector('.inter-range-cell');

            if (!probInput || !cumCell || !rangeCell) {
                return;
            }

            let p = parseFloat(probInput.value);
            if (isNaN(p) || p < 0) {
                p = 0;
            } else if (p > 1) {
                p = 1;
            }
            probInput.value = p.toFixed(2);

            const prevCum = cum;
            cum += p;
            cumCell.textContent = cum.toFixed(2);

            // Calculate range: ranges start from 01 (or 001, etc.), and 00 (or 000, etc.) represents the max
            // First interval starts at 1, subsequent intervals start at prevCum*scale+1
            const low = prevCum === 0 ? 1 : Math.round(prevCum * scale) + 1;
            const high = Math.round(cum * scale);
            rangeCell.textContent = formatRange(low, high, scale);
        });
        interFinalCum = cum;
    }

    // Service time distribution table
    const serviceTable = document.querySelector('#serviceDistTableContainer table tbody');
    let serviceFinalCum = 0;
    if (serviceTable) {
        let cum = 0;
        const rows = serviceTable.querySelectorAll('tr');
        rows.forEach(row => {
            const probInput = row.querySelector('.service-prob-input');
            const cumCell = row.querySelector('.service-cum-cell');
            const rangeCell = row.querySelector('.service-range-cell');

            if (!probInput || !cumCell || !rangeCell) {
                return;
            }

            let p = parseFloat(probInput.value);
            if (isNaN(p) || p < 0) {
                p = 0;
            } else if (p > 1) {
                p = 1;
            }
            probInput.value = p.toFixed(2);

            const prevCum = cum;
            cum += p;
            cumCell.textContent = cum.toFixed(2);

            // Calculate range: ranges start from 01 (or 001, etc.), and 00 (or 000, etc.) represents the max
            // First interval starts at 1, subsequent intervals start at prevCum*scale+1
            const low = prevCum === 0 ? 1 : Math.round(prevCum * scale) + 1;
            const high = Math.round(cum * scale);
            rangeCell.textContent = formatRange(low, high, scale);
        });
        serviceFinalCum = cum;
    }

    // Validate that cumulative probabilities don't exceed 1.00
    // Use a small tolerance (0.001) to account for floating point precision issues
    // Round to 2 decimal places for comparison
    const interRounded = Math.round(interFinalCum * 100) / 100;
    if (interRounded > 1.00) {
        alert('Error: Total cumulative probability for Inter-arrival Time Distribution exceeds 1.00 (' + interFinalCum.toFixed(2) + ').\nPlease adjust the probabilities so they sum to 1.00 or less.');
        // Clear ranges
        if (interTable) {
            const rows = interTable.querySelectorAll('tr');
            rows.forEach(row => {
                const rangeCell = row.querySelector('.inter-range-cell');
                if (rangeCell) {
                    rangeCell.textContent = '';
                }
            });
        }
        return;
    }

    const serviceRounded = Math.round(serviceFinalCum * 100) / 100;
    if (serviceRounded > 1.00) {
        alert('Error: Total cumulative probability for Service Time Distribution exceeds 1.00 (' + serviceFinalCum.toFixed(2) + ').\nPlease adjust the probabilities so they sum to 1.00 or less.');
        // Clear ranges
        if (serviceTable) {
            const rows = serviceTable.querySelectorAll('tr');
            rows.forEach(row => {
                const rangeCell = row.querySelector('.service-range-cell');
                if (rangeCell) {
                    rangeCell.textContent = '';
                }
            });
        }
        return;
    }

    // After calculating distributions, create simulation tables
    createSimulationTables();
}

function createSimulationTables() {
    const n = parseInt(document.getElementById('numCustomers').value, 10);
    if (isNaN(n) || n <= 0) {
        alert('Please enter a valid number of customers first.');
        return;
    }

    const simTablesSection = document.getElementById('simulationTablesSection');
    const interSimSection = document.getElementById('interarrivalSimSection');
    const serviceSimSection = document.getElementById('serviceSimSection');
    const interSimContainer = document.getElementById('interarrivalSimTableContainer');
    const serviceSimContainer = document.getElementById('serviceSimTableContainer');

    // Inter-arrival simulation table
    let interSimHtml = '<table style="width:100%; border-collapse:collapse; font-size:14px;">';
    interSimHtml += '<thead><tr style="background:#F5E6D3;">';
    interSimHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Customer</th>';
    interSimHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Random Digits</th>';
    interSimHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Inter-arrival Time (minutes)</th>';
    interSimHtml += '</tr></thead><tbody>';
    for (let i = 1; i <= n; i++) {
        interSimHtml += '<tr' + (i % 2 === 0 ? ' style="background:rgba(245,230,211,0.4);"' : '') + '>';
        interSimHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' + i + '</td>';
        if (i === 1) {
            // First customer: no inter-arrival time
            interSimHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">&mdash;</td>';
            interSimHtml += '<td class="inter-sim-time-cell" data-customer="' + i + '" style="border:1px solid #D2B48C; padding:6px; text-align:center;">&mdash;</td>';
        } else {
            interSimHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' +
                            '<input type="number" step="any" ' +
                            'class="inter-random-input" data-customer="' + i + '" ' +
                            'style="width:100px; padding:4px;" ' +
                            'placeholder="Enter value" />' +
                            '</td>';
            interSimHtml += '<td class="inter-sim-time-cell" data-customer="' + i + '" style="border:1px solid #D2B48C; padding:6px; text-align:center;"></td>';
        }
        interSimHtml += '</tr>';
    }
    interSimHtml += '</tbody></table>';
    interSimContainer.innerHTML = interSimHtml;

    // Service simulation table
    let serviceSimHtml = '<table style="width:100%; border-collapse:collapse; font-size:14px;">';
    serviceSimHtml += '<thead><tr style="background:#F5E6D3;">';
    serviceSimHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Customer</th>';
    serviceSimHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Random Digits</th>';
    serviceSimHtml += '<th style="border:1px solid #D2B48C; padding:6px;">Service Time (minutes)</th>';
    serviceSimHtml += '</tr></thead><tbody>';
    for (let i = 1; i <= n; i++) {
        serviceSimHtml += '<tr' + (i % 2 === 0 ? ' style="background:rgba(245,230,211,0.4);"' : '') + '>';
        serviceSimHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' + i + '</td>';
        serviceSimHtml += '<td style="border:1px solid #D2B48C; padding:6px; text-align:center;">' +
                           '<input type="number" step="any" ' +
                           'class="service-random-input" data-customer="' + i + '" ' +
                           'style="width:100px; padding:4px;" ' +
                           'placeholder="Enter value" />' +
                           '</td>';
        serviceSimHtml += '<td class="service-sim-time-cell" data-customer="' + i + '" style="border:1px solid #D2B48C; padding:6px; text-align:center;"></td>';
        serviceSimHtml += '</tr>';
    }
    serviceSimHtml += '</tbody></table>';
    serviceSimContainer.innerHTML = serviceSimHtml;

    simTablesSection.style.display = 'block';
    interSimSection.style.display = 'block';
    serviceSimSection.style.display = 'block';
    document.getElementById('lookupButtonSection').style.display = 'block';
}

function lookupTimesFromRandomDigits() {
    const n = parseInt(document.getElementById('numCustomers').value, 10);
    if (isNaN(n) || n <= 0) {
        alert('Please enter a valid number of customers.');
        return;
    }

    // Get the scale from user input
    const scaleInput = document.getElementById('randomDigitScale');
    const scale = scaleInput ? parseInt(scaleInput.value, 10) : 100;
    if (isNaN(scale) || scale < 10) {
        alert('Please enter a valid random digit scale.');
        return;
    }

    // Helper to parse range like "01-10" or "001-125" or "0001-1250" (where all zeros means max scale)
    function parseRange(rangeStr, maxScale) {
        if (!rangeStr || rangeStr === '—' || rangeStr === '') return null;
        const parts = rangeStr.split('-');
        if (parts.length !== 2) return null;
        let low = parseInt(parts[0], 10);
        let high = parseInt(parts[1], 10);
        if (isNaN(low) || isNaN(high)) return null;
        // If high is 0, it means the max scale value
        if (high === 0) high = maxScale;
        return { low, high };
    }

    // Build lookup array for inter-arrival times (store ranges as objects)
    const interDistTable = document.querySelector('#interarrivalDistTableContainer table tbody');
    const interLookup = [];
    if (interDistTable) {
        const rows = interDistTable.querySelectorAll('tr');
        rows.forEach(row => {
            const timeInput = row.querySelector('.inter-time-input');
            const rangeCell = row.querySelector('.inter-range-cell');
            if (timeInput && rangeCell) {
                const time = parseFloat(timeInput.value);
                const range = parseRange(rangeCell.textContent.trim(), scale);
                if (!isNaN(time) && range) {
                    // Store the range data for lookup
                    interLookup.push({ time, low: range.low, high: range.high });
                }
            }
        });
    }

    // Build lookup array for service times (store ranges as objects)
    const serviceDistTable = document.querySelector('#serviceDistTableContainer table tbody');
    const serviceLookup = [];
    if (serviceDistTable) {
        const rows = serviceDistTable.querySelectorAll('tr');
        rows.forEach(row => {
            const timeInput = row.querySelector('.service-time-input');
            const rangeCell = row.querySelector('.service-range-cell');
            if (timeInput && rangeCell) {
                const time = parseFloat(timeInput.value);
                const range = parseRange(rangeCell.textContent.trim(), scale);
                if (!isNaN(time) && range) {
                    // Store the range data for lookup
                    serviceLookup.push({ time, low: range.low, high: range.high });
                }
            }
        });
    }

    // Helper to find which range a random digit falls into
    function findTimeInRanges(randomDigit, lookupArray) {
        // Convert to number if it's a string
        const digit = parseFloat(randomDigit);
        if (isNaN(digit)) return null;
        
        // Check all ranges to see which one contains this digit
        for (const rangeData of lookupArray) {
            if (digit >= rangeData.low && digit <= rangeData.high) {
                return rangeData.time;
            }
        }
        return null;
    }

    // Lookup inter-arrival times
    for (let i = 2; i <= n; i++) {
        const randomInput = document.querySelector('.inter-random-input[data-customer="' + i + '"]');
        const timeCell = document.querySelector('.inter-sim-time-cell[data-customer="' + i + '"]');
        if (randomInput && timeCell) {
            const randomDigit = randomInput.value.trim();
            if (randomDigit !== '') {
                const time = findTimeInRanges(randomDigit, interLookup);
                if (time !== null) {
                    timeCell.textContent = time.toString();
                    timeCell.style.color = '';
                } else {
                    timeCell.textContent = '?';
                    timeCell.style.color = '#c62828';
                }
            } else {
                timeCell.textContent = '';
                timeCell.style.color = '';
            }
        }
    }

    // Lookup service times
    for (let i = 1; i <= n; i++) {
        const randomInput = document.querySelector('.service-random-input[data-customer="' + i + '"]');
        const timeCell = document.querySelector('.service-sim-time-cell[data-customer="' + i + '"]');
        if (randomInput && timeCell) {
            const randomDigit = randomInput.value.trim();
            if (randomDigit !== '') {
                const time = findTimeInRanges(randomDigit, serviceLookup);
                if (time !== null) {
                    timeCell.textContent = time.toString();
                    timeCell.style.color = '';
                } else {
                    timeCell.textContent = '?';
                    timeCell.style.color = '#c62828';
                }
            } else {
                timeCell.textContent = '';
                timeCell.style.color = '';
            }
        }
    }

    // Show run simulation section
    document.getElementById('runSimSection').style.display = 'block';
}

function runSimulationFromTables() {
    const n = parseInt(document.getElementById('numCustomers').value, 10);
    if (isNaN(n) || n <= 0) {
        alert('Please enter a valid number of customers.');
        return;
    }

    // Extract inter-arrival times from simulation table
    const interarrivalTimes = [0]; // First customer has 0
    for (let i = 2; i <= n; i++) {
        const timeCell = document.querySelector('.inter-sim-time-cell[data-customer="' + i + '"]');
        if (timeCell) {
            const time = parseFloat(timeCell.textContent);
            if (!isNaN(time) && time >= 0) {
                interarrivalTimes.push(time);
            } else {
                alert('Please lookup inter-arrival times first. Customer ' + i + ' is missing.');
                return;
            }
        } else {
            interarrivalTimes.push(0);
        }
    }

    // Extract service times from simulation table
    const serviceTimes = [];
    for (let i = 1; i <= n; i++) {
        const timeCell = document.querySelector('.service-sim-time-cell[data-customer="' + i + '"]');
        if (timeCell) {
            const time = parseFloat(timeCell.textContent);
            if (!isNaN(time) && time >= 0) {
                serviceTimes.push(time);
            } else {
                alert('Please lookup service times first. Customer ' + i + ' is missing.');
                return;
            }
        } else {
            alert('Please lookup service times first. Customer ' + i + ' is missing.');
            return;
        }
    }

    // Now run the simulation with these times
    runSimulationWithTimes(n, interarrivalTimes, serviceTimes);
}

function runSimulationWithTimes(n, interarrivalTimes, serviceTimes) {
    const tableSection = document.getElementById('tableSection');
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('queueResults');
    const tbody = document.querySelector('#simulationTable tbody');

    tbody.innerHTML = '';

    // Simulation arrays
    const arrivalTimes = new Array(n).fill(0);
    const serviceBegin = new Array(n).fill(0);
    const serviceEnd = new Array(n).fill(0);
    const waitingTimes = new Array(n).fill(0);
    const timeInSystem = new Array(n).fill(0);
    const idleTimes = new Array(n).fill(0);

    // First customer
    arrivalTimes[0] = 0;
    serviceBegin[0] = 0;
    serviceEnd[0] = serviceBegin[0] + serviceTimes[0];
    waitingTimes[0] = 0;
    timeInSystem[0] = serviceTimes[0];
    idleTimes[0] = 0;

    for (let i = 1; i < n; i++) {
        arrivalTimes[i] = arrivalTimes[i - 1] + interarrivalTimes[i];

        if (arrivalTimes[i] >= serviceEnd[i - 1]) {
            // server is idle
            idleTimes[i] = arrivalTimes[i] - serviceEnd[i - 1];
            serviceBegin[i] = arrivalTimes[i];
            waitingTimes[i] = 0;
        } else {
            // customer waits
            idleTimes[i] = 0;
            serviceBegin[i] = serviceEnd[i - 1];
            waitingTimes[i] = serviceBegin[i] - arrivalTimes[i];
        }

        serviceEnd[i] = serviceBegin[i] + serviceTimes[i];
        timeInSystem[i] = serviceEnd[i] - arrivalTimes[i];
    }

    // Fill table
    let totalInterarrival = 0;
    let totalService = 0;
    let totalWaiting = 0;
    let totalTimeInSystem = 0;
    let totalIdle = 0;
    let numWaited = 0;

    for (let i = 0; i < n; i++) {
        const tr = document.createElement('tr');
        if (i % 2 === 0) {
            tr.style.background = 'rgba(245, 230, 211, 0.4)';
        }

        const inter = i === 0 ? '—' : interarrivalTimes[i].toString();

        totalInterarrival += i === 0 ? 0 : interarrivalTimes[i];
        totalService += serviceTimes[i];
        totalWaiting += waitingTimes[i];
        totalTimeInSystem += timeInSystem[i];
        totalIdle += idleTimes[i];
        if (waitingTimes[i] > 0) numWaited++;

        const cells = [
            i + 1,
            inter,
            arrivalTimes[i],
            serviceTimes[i],
            serviceBegin[i],
            serviceEnd[i],
            waitingTimes[i],
            timeInSystem[i],
            idleTimes[i]
        ];

        cells.forEach(value => {
            const td = document.createElement('td');
            td.style.border = '1px solid #D2B48C';
            td.style.padding = '6px';
            td.style.textAlign = 'center';
            td.textContent = typeof value === 'number' ? value.toString() : value;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    }

    // Totals row
    const totalRow = document.createElement('tr');
    totalRow.style.background = '#F5E6D3';
    const labels = [
        'Total',
        totalInterarrival,
        '',
        totalService,
        '',
        '',
        totalWaiting,
        totalTimeInSystem,
        totalIdle
    ];
    labels.forEach((value, idx) => {
        const td = document.createElement('td');
        td.style.border = '1px solid #D2B48C';
        td.style.padding = '6px';
        td.style.textAlign = idx === 0 ? 'left' : 'center';
        td.style.fontWeight = 'bold';
        td.textContent = value === '' ? '' : value.toString();
        totalRow.appendChild(td);
    });
    tbody.appendChild(totalRow);

    // Performance measures, following the PDF logic
    const avgWaiting = totalWaiting / n;
    const probWait = numWaited / n;
    const totalRunTime = serviceEnd[n - 1]; // last service completion
    const probIdleServer = totalIdle / totalRunTime;
    const avgServiceTime = totalService / n;
    const avgBetweenArrivals = totalInterarrival / (n - 1);
    const avgTimeInSystem = totalTimeInSystem / n;
    const avgTimeThoseWhoWait = numWaited > 0 ? totalWaiting / numWaited : 0;

    let html = '';
    html += `Average waiting time = ${avgWaiting.toFixed(2)} minutes<br>`;
    html += `Probability (wait) = ${probWait.toFixed(2)}<br>`;
    html += `Probability of idle server = ${probIdleServer.toFixed(2)}<br>`;
    html += `Average service time = ${avgServiceTime.toFixed(2)} minutes<br>`;
    html += `Average time between arrivals = ${avgBetweenArrivals.toFixed(2)} minutes<br>`;
    html += `Average waiting time of those who wait = ${avgTimeThoseWhoWait.toFixed(2)} minutes<br>`;
    html += `Average time customer spends in the system = ${avgTimeInSystem.toFixed(2)} minutes`;

    resultsDiv.innerHTML = html;
    resultsDiv.className = 'result';
    resultsDiv.style.background = '#e8f5e9';
    resultsDiv.style.color = '#2e7d32';

    tableSection.style.display = 'block';
    resultsSection.style.display = 'block';
}

function runSingleLimitedCustomerSimulation() {
    const n = parseInt(document.getElementById('numCustomers').value, 10);
    const interarrivalStr = document.getElementById('interarrivalInput').value;
    const serviceStr = document.getElementById('serviceInput').value;

    const resultsDiv = document.getElementById('queueResults');

    if (isNaN(n) || n <= 0) {
        resultsDiv.textContent = 'Please enter a valid positive number of customers.';
        resultsDiv.className = 'result';
        resultsDiv.style.background = '#ffebee';
        resultsDiv.style.color = '#c62828';
        document.getElementById('tableSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        return;
    }

    const serviceTimes = parseNumberList(serviceStr, n);
    let interarrivalTimes = parseNumberList(interarrivalStr, n);

    if (!serviceTimes || serviceTimes.length !== n) {
        resultsDiv.textContent = 'Please enter valid service times for all customers (exactly ' + n + ' values).';
        resultsDiv.className = 'result';
        resultsDiv.style.background = '#ffebee';
        resultsDiv.style.color = '#c62828';
        document.getElementById('tableSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        return;
    }

    if (!interarrivalTimes) {
        resultsDiv.textContent = 'Please enter valid interarrival times (you may omit the first one or set it to 0).';
        resultsDiv.className = 'result';
        resultsDiv.style.background = '#ffebee';
        resultsDiv.style.color = '#c62828';
        document.getElementById('tableSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        return;
    }

    // Normalize interarrival times array to length n
    if (interarrivalTimes.length === n - 1) {
        interarrivalTimes.unshift(0);
    } else if (interarrivalTimes.length === n) {
        // ok
    } else {
        resultsDiv.textContent = 'Number of interarrival times must be ' + n + ' (or ' + (n - 1) + ' if first is omitted).';
        resultsDiv.className = 'result';
        resultsDiv.style.background = '#ffebee';
        resultsDiv.style.color = '#c62828';
        document.getElementById('tableSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        return;
    }

    // Use the shared simulation function
    runSimulationWithTimes(n, interarrivalTimes, serviceTimes);
}


