// Random Number Table (19 rows x 10 columns)
const RANDOM_NUMBER_TABLE = [
    [0.182207, 0.433596, 0.997747, 0.290859, 0.181924, 0.277099, 0.123456, 0.789012, 0.345678, 0.901234],
    [0.567890, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890, 0.123456],
    [0.789012, 0.234567, 0.567890, 0.901234, 0.345678, 0.123456, 0.789012, 0.456789, 0.012345, 0.678901],
    [0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890, 0.123456, 0.789012],
    [0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123],
    [0.678901, 0.345678, 0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345],
    [0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678],
    [0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890],
    [0.345678, 0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901],
    [0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234],
    [0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890, 0.123456],
    [0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890, 0.123456, 0.789012],
    [0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123],
    [0.678901, 0.345678, 0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345],
    [0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678],
    [0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890],
    [0.345678, 0.901234, 0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901],
    [0.567890, 0.123456, 0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234],
    [0.789012, 0.234567, 0.890123, 0.456789, 0.012345, 0.678901, 0.345678, 0.901234, 0.567890, 0.123456]
];

function switchInputMethod(method) {
    document.querySelectorAll('.method-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.method-section').forEach(section => section.classList.remove('active'));
    
    if (method === 'manual') {
        document.getElementById('tabManual').classList.add('active');
        document.getElementById('manualSection').classList.add('active');
    } else {
        document.getElementById('tabTable').classList.add('active');
        document.getElementById('tableSection').classList.add('active');
    }
}

function generateRandomInputs() {
    const n = parseInt(document.getElementById("n").value);
    
    // Validation: n must be greater than 0
    if (!n || n <= 0) {
        alert("n (Total number of random numbers) must be greater than 0.");
        return;
    }
    
    const container = document.getElementById("randomInputs");
    container.innerHTML = "";
    
    if (n && n > 0) {
        const inputGroup = document.createElement("div");
        inputGroup.className = "input-group";
        inputGroup.innerHTML = `<label>Random Numbers (0-1)</label>`;
        
        const inputsContainer = document.createElement("div");
        inputsContainer.style.display = "grid";
        inputsContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
        inputsContainer.style.gap = "10px";
        inputsContainer.style.marginTop = "10px";
        
        for (let i = 0; i < n; i++) {
            const input = document.createElement("input");
            input.type = "number";
            input.step = "0.0001";
            input.min = "0";
            input.max = "1";
            input.placeholder = `R${i+1}`;
            input.className = "table-input";
            input.id = `randomInput_${i}`;
            inputsContainer.appendChild(input);
        }
        
        inputGroup.appendChild(inputsContainer);
        container.appendChild(inputGroup);
    }
}

let selectedCells = []; // Array to store selected cell coordinates {row, col}
let isSelecting = false;
let selectionStart = null;
let previousSelectionOnMouseDown = [];

function selectTableCell(row, col) {
    const cellId = `cell_${row}_${col}`;
    const cell = document.getElementById(cellId);
    
    if (!cell) return;
    
    // Check if already selected
    const index = selectedCells.findIndex(c => c.row === row && c.col === col);
    
    if (index >= 0) {
        // Deselect
        selectedCells.splice(index, 1);
        cell.classList.remove('selected-cell');
    } else {
        // Select
        selectedCells.push({row, col});
        cell.classList.add('selected-cell');
    }
    
    updateSelectionCount();
}

function initiateCellSelection(row, col) {
    isSelecting = true;
    selectionStart = {row, col};
    previousSelectionOnMouseDown = [...selectedCells];
}

function extendCellSelection(row, col) {
    if (!isSelecting || !selectionStart) return;
    
    // Clear previous temp selections, restore to original state
    selectedCells.forEach(cell => {
        const cellElement = document.getElementById(`cell_${cell.row}_${cell.col}`);
        if (cellElement) {
            cellElement.classList.remove('selected-cell');
        }
    });
    
    // Restore original selection
    selectedCells = [...previousSelectionOnMouseDown];
    selectedCells.forEach(cell => {
        const cellElement = document.getElementById(`cell_${cell.row}_${cell.col}`);
        if (cellElement) {
            cellElement.classList.add('selected-cell');
        }
    });
    
    // Calculate range from start to current
    const minRow = Math.min(selectionStart.row, row);
    const maxRow = Math.max(selectionStart.row, row);
    const minCol = Math.min(selectionStart.col, col);
    const maxCol = Math.max(selectionStart.col, col);
    
    // Select all cells in range
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const cellId = `cell_${r}_${c}`;
            const cellElement = document.getElementById(cellId);
            if (cellElement) {
                const alreadySelected = selectedCells.findIndex(cell => cell.row === r && cell.col === c) >= 0;
                if (!alreadySelected) {
                    selectedCells.push({row: r, col: c});
                    cellElement.classList.add('selected-cell');
                }
            }
        }
    }
    
    updateSelectionCount();
}

function finalizeCellSelection() {
    isSelecting = false;
    selectionStart = null;
}

function clearTableSelection() {
    selectedCells.forEach(cell => {
        const cellElement = document.getElementById(`cell_${cell.row}_${cell.col}`);
        if (cellElement) {
            cellElement.classList.remove('selected-cell');
        }
    });
    selectedCells = [];
    updateSelectionCount();
}

function updateSelectionCount() {
    const countElement = document.getElementById('selectionCount');
    if (countElement) {
        countElement.textContent = `Selected: ${selectedCells.length} cells`;
    }
    
    // Enable/disable Apply button based on selection
    const applyButton = document.querySelector('button[onclick*="applyTableSelection"]');
    if (applyButton) {
        if (selectedCells.length === 0) {
            applyButton.disabled = true;
            applyButton.style.opacity = '0.5';
            applyButton.style.cursor = 'not-allowed';
        } else {
            applyButton.disabled = false;
            applyButton.style.opacity = '1';
            applyButton.style.cursor = 'pointer';
        }
    }
}

function applyTableSelection() {
    // Check if no cells are selected first
    if (selectedCells.length === 0) {
        alert("No cells selected! Please click on cells in the table to select them first.");
        return;
    }
    
    const n = parseInt(document.getElementById("n").value);
    
    if (!n || n <= 0) {
        alert("n (Total number of random numbers) must be greater than 0.");
        return;
    }
    
    // Generate inputs first
    generateRandomInputs();
    
    // Fill inputs with selected values
    const count = Math.min(n, selectedCells.length);
    for (let i = 0; i < count; i++) {
        const cell = selectedCells[i];
        const value = RANDOM_NUMBER_TABLE[cell.row - 1][cell.col - 1]; // Convert to 0-based (rows start from 1)
        const input = document.getElementById(`randomInput_${i}`);
        if (input) {
            input.value = value.toFixed(6);
        }
    }
    
    if (selectedCells.length < n) {
        alert(`Only ${selectedCells.length} cells were selected. Please select more cells or reduce n.`);
    } else if (selectedCells.length > n) {
        alert(`Only the first ${n} selected cells were used.`);
    }
}

function runChiSquare() {
    // Hide Run Test button immediately
    const runButtonGroup = document.querySelector('.button-group');
    if (runButtonGroup && runButtonGroup.querySelector('button[onclick*="runChiSquare"]')) {
        runButtonGroup.style.display = 'none';
    }
    
    const nInput = parseInt(document.getElementById("n").value);
    
    // Validation: n must be greater than 0
    if (!nInput || nInput <= 0) {
        alert("n (Total number of random numbers) must be greater than 0.");
        // Show button again if validation fails
        if (runButtonGroup) {
            runButtonGroup.style.display = 'flex';
        }
        return;
    }

    const numbers = Array.from(
        document.querySelectorAll("#randomInputs input")
    ).map(i => parseFloat(i.value));

    const n = numbers.length;
    const k = parseInt(document.getElementById("k").value);
    const alpha = parseFloat(document.getElementById("alpha").value);

    // ===== VALIDATION =====
    if (!n || n <= 0) {
        alert("Please generate random numbers first. Enter n and click 'Generate Inputs'.");
        return;
    }

    if (numbers.some(num => isNaN(num) || num === "")) {
        alert("Please fill in all random number inputs.");
        return;
    }

    for (let num of numbers) {
        if (isNaN(num) || num < 0 || num > 1) {
            alert(`Random numbers must be between 0 and 1. Found: ${num}`);
            return;
        }
    }

    if (!k || k <= 0) {
        alert("k (Number of intervals) must be greater than 0.");
        return;
    }

    if (k > n) {
        alert(`k (${k}) cannot be greater than n (${n}).`);
        return;
    }

    if (!alpha || isNaN(alpha)) {
        alert("Please enter a valid α (Level of significance).");
        return;
    }

    const validAlphas = [0.1, 0.05, 0.025, 0.01];
    if (!validAlphas.includes(alpha)) {
        alert(`α must be one of: ${validAlphas.join(", ")}. Found: ${alpha}`);
        return;
    }

    const intervalWidth = 1 / k;
    const expected = n / k;

    let intervals = [];
    let observed = new Array(k).fill(0);
    let insideNumbers = Array.from({ length: k }, () => []);

    // Create intervals
    for (let i = 0; i < k; i++) {
        let start = i * intervalWidth;
        let end = (i + 1) * intervalWidth;
        intervals.push({ start, end });
    }

    // Count observed frequencies
    numbers.forEach(num => {
        let index = Math.min(Math.floor(num / intervalWidth), k - 1);
        observed[index]++;
        insideNumbers[index].push(num.toFixed(4));
    });

    // ================= STEP 1 =================
    let step1 = `
        <h2>Step 1: Interval & Range Table</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead><tr><th>Interval</th><th>Range</th></tr></thead>
            <tbody>
    `;
    intervals.forEach((intv, i) => {
        step1 += `
            <tr>
                <td>${i + 1}</td>
                <td>[${intv.start.toFixed(2)} , ${intv.end.toFixed(2)})</td>
            </tr>
        `;
    });
    step1 += `</tbody></table></div>
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-primary" onclick="nextTab(1)">Next → Step 2</button>
        </div>`;
    document.querySelector("#tab0 .tab-body").innerHTML = step1;

    // ================= STEP 2 =================
    let step2 = `
        <h2>Step 2: Observed Frequency (O)</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead>
            <tr>
                <th>Interval</th>
                <th>Random Numbers Inside</th>
                <th>Observed Frequency (O)</th>
            </tr>
            </thead>
            <tbody>
    `;
    intervals.forEach((_, i) => {
        step2 += `
            <tr>
                <td>${i + 1}</td>
                <td>${insideNumbers[i].join(", ")}</td>
                <td>${observed[i]}</td>
            </tr>
        `;
    });
    step2 += `</tbody></table></div>
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-secondary" onclick="nextTab(0)">← Back</button>
            <button class="btn btn-primary" onclick="nextTab(2)">Next → Step 3</button>
        </div>`;
    document.querySelector("#tab1 .tab-body").innerHTML = step2;

    // ================= STEP 3 =================
    document.querySelector("#tab2 .tab-body").innerHTML = `
        <h2>Step 3: Expected Frequency</h2>
        <p><strong>E = n / k = ${n} / ${k} = ${expected.toFixed(2)}</strong></p>
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-secondary" onclick="nextTab(1)">← Back</button>
            <button class="btn btn-primary" onclick="nextTab(3)">Next → Step 4</button>
        </div>
    `;

    // ================= STEP 4 =================
    let chiCal = 0;
    let step4 = `
        <h2>Step 4: Chi-Square Calculation</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead>
            <tr>
                <th>Interval</th>
                <th>O</th>
                <th>E</th>
                <th>χ²</th>
            </tr>
            </thead>
            <tbody>
    `;
    observed.forEach((o, i) => {
        let chi = Math.pow(o - expected, 2) / expected;
        chiCal += chi;
        step4 += `
            <tr>
                <td>${i + 1}</td>
                <td>${o}</td>
                <td>${expected.toFixed(2)}</td>
                <td>${chi.toFixed(4)}</td>
            </tr>
        `;
    });
    step4 += `
        </tbody></table></div>
        <p><strong>χ²cal = ${chiCal.toFixed(4)}</strong></p>
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-secondary" onclick="nextTab(2)">← Back</button>
            <button class="btn btn-primary" onclick="nextTab(4)">Next → Step 5</button>
        </div>
    `;
    document.querySelector("#tab3 .tab-body").innerHTML = step4;

    // ================= STEP 5 =================
    const df = k - 1;
    const chiTable = chiSquareTable(df, alpha);
    const chiSquareTableHTML = generateChiSquareTableHTML(df, alpha);

    document.querySelector("#tab4 .tab-body").innerHTML = `
        <h2>Step 5: Chi-Square Table Value</h2>
        <p>Degrees of freedom (df) = k - 1 = ${k} - 1 = <strong>${df}</strong></p>
        <p>Level of significance (α) = <strong>${alpha}</strong></p>
        <p style="font-size: 18px; margin: 20px 0;">
            <strong>χ²<sub>table</sub> = ${chiTable}</strong>
            <br>
            <small style="color: #6B4423;">(Found at intersection of row v = ${df} and column χ²<sub>${alpha}</sub>)</small>
        </p>
        ${chiSquareTableHTML}
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-secondary" onclick="nextTab(3)">← Back</button>
            <button class="btn btn-primary" onclick="nextTab(5)">Next → Decision</button>
        </div>
    `;

    // ================= STEP 6 =================
    let decision = `
        <h2>Step 6: Decision</h2>
    `;
    if (chiCal <= chiTable) {
        decision += `
            <p><strong>Accept H₀</strong></p>
            <p>👉 Random numbers are uniform</p>
        `;
    } else {
        decision += `
            <p><strong>Reject H₀</strong></p>
            <p>👉 Random numbers are not uniform</p>
        `;
    }
    document.querySelector("#tab5 .tab-body").innerHTML = `
        <div id="decision-content">
            ${decision}
        </div>
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-secondary" onclick="nextTab(4)">← Back</button>
            <button class="btn btn-primary" onclick="downloadPDF()">Download as PDF</button>
            <button class="btn btn-secondary" onclick="startOver()">Start Over</button>
        </div>
    `;

    // Hide input fields
    const inputGroups = document.querySelectorAll('.input-group');
    inputGroups.forEach(el => {
        el.style.display = 'none';
    });
    document.getElementById("randomInputs").style.display = 'none';
    document.querySelector('.random-method-selector').style.display = 'none';
    
    // Show tabs
    document.getElementById("tabs").classList.remove("hidden");
    
    // Build report content for PDF (without buttons)
    let step1Report = `
        <h2>Step 1: Interval & Range Table</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead><tr><th>Interval</th><th>Range</th></tr></thead>
            <tbody>
    `;
    intervals.forEach((intv, i) => {
        step1Report += `
            <tr>
                <td>${i + 1}</td>
                <td>[${intv.start.toFixed(2)} , ${intv.end.toFixed(2)})</td>
            </tr>
        `;
    });
    step1Report += `</tbody></table></div>`;
    
    let step2Report = `
        <h2>Step 2: Observed Frequency (O)</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead>
            <tr>
                <th>Interval</th>
                <th>Random Numbers Inside</th>
                <th>Observed Frequency (O)</th>
            </tr>
            </thead>
            <tbody>
    `;
    intervals.forEach((_, i) => {
        step2Report += `
            <tr>
                <td>${i + 1}</td>
                <td>${insideNumbers[i].join(", ")}</td>
                <td>${observed[i]}</td>
            </tr>
        `;
    });
    step2Report += `</tbody></table></div>`;
    
    let step4Report = `
        <h2>Step 4: Chi-Square Calculation</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead>
            <tr>
                <th>Interval</th>
                <th>O</th>
                <th>E</th>
                <th>χ²</th>
            </tr>
            </thead>
            <tbody>
    `;
    observed.forEach((o, i) => {
        let chi = Math.pow(o - expected, 2) / expected;
        step4Report += `
            <tr>
                <td>${i + 1}</td>
                <td>${o}</td>
                <td>${expected.toFixed(2)}</td>
                <td>${chi.toFixed(4)}</td>
            </tr>
        `;
    });
    step4Report += `
        </tbody></table></div>
        <p><strong>χ²cal = ${chiCal.toFixed(4)}</strong></p>
    `;
    
    const report = document.getElementById("report");
    report.innerHTML = `
        <h1>Chi-Square Uniformity Test Results</h1>
        <div class="tab-body">
            ${step1Report}
        </div>
        <div class="tab-body">
            ${step2Report}
        </div>
        <div class="tab-body">
            <h2>Step 3: Expected Frequency</h2>
            <p><strong>E = n / k = ${n} / ${k} = ${expected.toFixed(2)}</strong></p>
        </div>
        <div class="tab-body">
            ${step4Report}
        </div>
        <div class="tab-body">
            <h2>Step 5: Chi-Square Table Value</h2>
            <p>Degrees of freedom (df) = k - 1 = ${k} - 1 = <strong>${df}</strong></p>
            <p>Level of significance (α) = <strong>${alpha}</strong></p>
            <p><strong>χ²<sub>table</sub> = ${chiTable}</strong> (Found at intersection of row v = ${df} and column χ²<sub>${alpha}</sub>)</p>
            ${generateChiSquareTableHTML(df, alpha)}
        </div>
        <div class="tab-body">
            ${decision}
        </div>
    `;
    
    // Start at first tab
    openTab(0);
}

let currentTab = 0;

function nextTab(tabIdx) {
    if (tabIdx >= 0 && tabIdx <= 5) {
        openTab(tabIdx);
        currentTab = tabIdx;
    }
}

function startOver() {
    // Hide tabs
    document.getElementById("tabs").classList.add("hidden");
    
    // Clear all tab content
    for (let i = 0; i <= 5; i++) {
        document.querySelector(`#tab${i} .tab-body`).innerHTML = '';
    }
    
    // Show input fields
    const inputGroups = document.querySelectorAll('.input-group');
    inputGroups.forEach(el => {
        el.style.display = '';
    });
    document.getElementById("randomInputs").style.display = '';
    document.querySelector('.random-method-selector').style.display = '';
    
    // Show Run Test button
    const runButtonGroup = document.querySelector('.button-group');
    if (runButtonGroup && runButtonGroup.querySelector('button[onclick*="runChiSquare"]')) {
        runButtonGroup.style.display = 'flex';
    }
    
    // Reset form inputs
    document.getElementById("n").value = '';
    document.getElementById("k").value = '';
    document.getElementById("alpha").value = '';
    clearTableSelection();
    document.getElementById("randomInputs").innerHTML = '';
    
    // Reset to manual method
    switchInputMethod('manual');
    
    // Reset tab to first
    currentTab = 0;
    openTab(0);
}

// Initialize random number table on page load
document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('randomTableBody');
    if (tbody) {
        for (let i = 0; i < RANDOM_NUMBER_TABLE.length; i++) {
            const row = document.createElement('tr');
            const rowNum = i + 1;
            row.innerHTML = `<td><strong>${rowNum}</strong></td>`;
            for (let j = 0; j < RANDOM_NUMBER_TABLE[i].length; j++) {
                const cell = document.createElement('td');
                const colNum = j + 1;
                cell.id = `cell_${rowNum}_${colNum}`;
                cell.textContent = RANDOM_NUMBER_TABLE[i][j].toFixed(6);
                cell.style.cursor = 'pointer';
                cell.style.userSelect = 'none';
                cell.title = `Click to select or drag to select range (Row ${rowNum}, Column ${colNum})`;
                cell.onclick = () => selectTableCell(rowNum, colNum);
                cell.onmousedown = () => initiateCellSelection(rowNum, colNum);
                cell.onmouseover = () => extendCellSelection(rowNum, colNum);
                cell.onmouseup = () => finalizeCellSelection();
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        
        // Add selection count display
        const tableSection = document.getElementById('tableSection');
        if (tableSection) {
            const countDiv = document.createElement('div');
            countDiv.id = 'selectionCount';
            countDiv.style.margin = '10px 0';
            countDiv.style.fontWeight = 'bold';
            countDiv.style.color = '#5C4033';
            countDiv.textContent = 'Selected: 0 cells';
            const buttonGroup = tableSection.querySelector('.button-group');
            if (buttonGroup) {
                buttonGroup.parentNode.insertBefore(countDiv, buttonGroup);
            }
            
            // Initialize button state
            updateSelectionCount();
        }
        
        // Add document-level mouse up to handle drag end outside table
        document.addEventListener('mouseup', () => finalizeCellSelection());
    }
});

// Tabs
function openTab(index) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn, i) => {
        btn.classList.toggle("active", i === index);
    });
    
    // Update tab content
    document.querySelectorAll(".tab-content").forEach((tab, i) => {
        tab.classList.toggle("active", i === index);
    });
}

// Chi-Square table (basic – extendable)
// Complete Chi-Square Table (v = 1 to 19, α = 0.005, 0.01, 0.025, 0.05, 0.10)
const CHI_SQUARE_FULL_TABLE = {
    0.005: [7.88, 10.60, 12.84, 14.96, 16.75, 18.55, 20.28, 21.96, 23.59, 25.19, 26.76, 28.30, 29.82, 31.32, 32.80, 34.27, 35.72, 37.16, 38.58],
    0.01: [6.63, 9.21, 11.34, 13.28, 15.09, 16.81, 18.48, 20.09, 21.67, 23.21, 24.73, 26.22, 27.69, 29.14, 30.58, 32.00, 33.41, 34.81, 36.19],
    0.025: [5.02, 7.38, 9.35, 11.14, 12.83, 14.45, 16.01, 17.53, 19.02, 20.48, 21.92, 23.34, 24.74, 26.12, 27.49, 28.85, 30.19, 31.53, 32.85],
    0.05: [3.84, 5.99, 7.81, 9.49, 11.07, 12.59, 14.07, 15.51, 16.92, 18.31, 19.68, 21.03, 22.36, 23.68, 25.00, 26.30, 27.59, 28.87, 30.14],
    0.10: [2.71, 4.61, 6.25, 7.78, 9.24, 10.64, 12.02, 13.36, 14.68, 15.99, 17.28, 18.55, 19.81, 21.06, 22.31, 23.54, 24.77, 25.99, 27.20]
};

function chiSquareTable(df, alpha) {
    const table = CHI_SQUARE_FULL_TABLE[alpha];
    if (table && df >= 1 && df <= 19) {
        return table[df - 1];
    }
    return "Not Available";
}

function generateChiSquareTableHTML(df, alpha) {
    const alphas = [0.005, 0.01, 0.025, 0.05, 0.10];
    let html = `
        <div class="table-container" style="margin-top: 20px;">
            <h3>Chi-Square (χ²) Distribution Table</h3>
            <div class="scrollable" style="max-height: 500px;">
                <table class="editable-table" style="font-size: 13px;">
                    <thead>
                        <tr>
                            <th style="background: #8B4513; color: white;">v</th>
    `;
    
    // Header row
    alphas.forEach(a => {
        const isHighlighted = a === alpha;
        html += `<th style="background: ${isHighlighted ? '#A0522D' : '#8B4513'}; color: white; ${isHighlighted ? 'border: 3px solid #6B3410;' : ''}">χ²<sub>${a}</sub></th>`;
    });
    html += `</tr></thead><tbody>`;
    
    // Data rows
    for (let v = 1; v <= 19; v++) {
        const isHighlightedRow = v === df;
        html += `<tr>`;
        html += `<td style="background: ${isHighlightedRow ? '#E6D5C3' : '#F5E6D3'}; font-weight: bold; ${isHighlightedRow ? 'border: 2px solid #6B3410;' : ''}">${v}</td>`;
        
        alphas.forEach(a => {
            const value = CHI_SQUARE_FULL_TABLE[a][v - 1];
            const isHighlightedCol = a === alpha;
            const isIntersection = (v === df && a === alpha);
            
            let cellStyle = '';
            if (isIntersection) {
                cellStyle = 'background: linear-gradient(135deg, #A0522D 0%, #CD853F 100%); color: white; font-weight: bold; border: 3px solid #6B3410; font-size: 16px;';
            } else if (isHighlightedRow) {
                cellStyle = 'background: #E6D5C3; border: 2px solid #6B3410;';
            } else if (isHighlightedCol) {
                cellStyle = 'background: #E6D5C3; border: 2px solid #6B3410;';
            }
            
            html += `<td style="${cellStyle}">${value.toFixed(2)}</td>`;
        });
        html += `</tr>`;
    }
    
    html += `</tbody></table></div></div>`;
    return html;
}

async function downloadPDF() {
    document.body.classList.add("pdf-mode");
    
    // Show report for PDF generation
    const report = document.getElementById("report");
    report.style.display = "block";

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p", "mm", "a4");

    const canvas = await html2canvas(report, {
        scale: 2
    });

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

    pdf.save("ChiSquare_Uniformity_Test_Report.pdf");

    // Hide report again
    report.style.display = "none";
    document.body.classList.remove("pdf-mode");
}
