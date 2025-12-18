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

function generateInputs() {
    const n = parseInt(document.getElementById("n").value);
    
    // Validation: n must be greater than 0
    if (!n || n <= 0) {
        alert("n (Number of random numbers) must be greater than 0.");
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
            input.placeholder = `X${i+1}`;
            input.className = "table-input";
            input.id = `randomInput_${i}`;
            inputsContainer.appendChild(input);
        }
        
        inputGroup.appendChild(inputsContainer);
        container.appendChild(inputGroup);
    }
}

let selectedCells = []; // Array to store selected cell coordinates {row, col}

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
        alert("n (Number of random numbers) must be greater than 0.");
        return;
    }
    
    // Generate inputs first
    generateInputs();
    
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

function runDependencyTest() {
    // Hide Run Test button immediately
    const runButtonGroup = document.querySelector('.button-group');
    if (runButtonGroup && runButtonGroup.querySelector('button[onclick*="runDependencyTest"]')) {
        runButtonGroup.style.display = 'none';
    }
    
    const nInput = parseInt(document.getElementById("n").value);
    
    // Validation: n must be greater than 0
    if (!nInput || nInput <= 0) {
        alert("n (Number of random numbers) must be greater than 0.");
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
    const maxK = parseInt(document.getElementById("maxK").value);

    // ===== Validation =====
    if (!n || n <= 0) {
        alert("Please generate random numbers first. Enter n and click 'Generate Inputs'.");
        return;
    }
    
    if (maxK <= 0 || maxK >= n) {
        alert("Max K must be greater than 0 and less than n");
        return;
    }

    for (let x of numbers) {
        if (isNaN(x) || x < 0 || x > 1) {
            alert("Random numbers must be between 0 and 1");
            return;
        }
    }

    // ===== Step 1: Mean =====
    const mean = numbers.reduce((a,b) => a + b, 0) / n;

    document.querySelector("#tab0 .tab-body").innerHTML = `
        <h2>Step 1: Mean</h2>
        <p><strong>X̄ = ${mean.toFixed(4)}</strong></p>
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-primary" onclick="nextTab(1)">Next → Step 2</button>
        </div>
    `;

    // ===== Step 2: Sample Variance =====
    let variance = numbers.reduce((sum, x) =>
        sum + Math.pow(x - mean, 2), 0) / (n - 1);

    document.querySelector("#tab1 .tab-body").innerHTML = `
        <h2>Step 2: Sample Variance</h2>
        <p><strong>Sx² = ${variance.toFixed(6)}</strong></p>
        <div class="button-group" style="margin-top: 25px;">
            <button class="btn btn-secondary" onclick="nextTab(0)">← Back</button>
            <button class="btn btn-primary" onclick="nextTab(2)">Next → Step 3</button>
        </div>
    `;

    let results = [];
    let sumAbsR = 0;

    // ===== Step 3–5 =====
    let step3 = `<h2>Step 3: Numerator</h2>`;
    let step4 = `<h2>Step 4: Denominator</h2>`;
    let step5 = `
        <h2>Step 5: Correlation Rk</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead><tr><th>K</th><th>Rk</th></tr></thead>
            <tbody>
    `;

    for (let k = 1; k <= maxK; k++) {
        let numerator = 0;
        for (let i = 0; i < n - k; i++) {
            numerator += (numbers[i] - mean) * (numbers[i + k] - mean);
        }

        let denominator = (n - k) * variance;
        let Rk = numerator / denominator;

        results.push({ k, Rk });
        sumAbsR += Math.abs(Rk);

        step3 += `<p>k=${k} → Numerator = ${numerator.toFixed(6)}</p>`;
        step4 += `<p>k=${k} → Denominator = ${denominator.toFixed(6)}</p>`;

        step5 += `
            <tr>
                <td>${k}</td>
                <td>${Rk.toFixed(6)}</td>
            </tr>
        `;
    }

    step5 += `</tbody></table></div>`;

    step3 += `<div class="button-group" style="margin-top: 25px;">
        <button class="btn btn-secondary" onclick="nextTab(1)">← Back</button>
        <button class="btn btn-primary" onclick="nextTab(3)">Next → Step 4</button>
    </div>`;
    document.querySelector("#tab2 .tab-body").innerHTML = step3.replace("<h3>", "<h2>").replace("</h3>", "</h2>");
    
    step4 += `<div class="button-group" style="margin-top: 25px;">
        <button class="btn btn-secondary" onclick="nextTab(2)">← Back</button>
        <button class="btn btn-primary" onclick="nextTab(4)">Next → Step 5</button>
    </div>`;
    document.querySelector("#tab3 .tab-body").innerHTML = step4.replace("<h3>", "<h2>").replace("</h3>", "</h2>");
    
    step5 += `<div class="button-group" style="margin-top: 25px;">
        <button class="btn btn-secondary" onclick="nextTab(3)">← Back</button>
        <button class="btn btn-primary" onclick="nextTab(5)">Next → Final Output</button>
    </div>`;
    document.querySelector("#tab4 .tab-body").innerHTML = step5.replace("<h3>", "<h2>").replace("</h3>", "</h2>");

    // ===== Step 6: Final Output =====
    const avgAbsR = sumAbsR / maxK;

    document.querySelector("#tab5 .tab-body").innerHTML = `
        <h2>Final Output</h2>
        <p><strong>Average |Rk| = ${avgAbsR.toFixed(6)}</strong></p>
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
    let step3Report = `<h2>Step 3: Numerator</h2>`;
    let step4Report = `<h2>Step 4: Denominator</h2>`;
    let step5Report = `
        <h2>Step 5: Correlation Rk</h2>
        <div class="table-container">
        <table class="editable-table">
            <thead><tr><th>K</th><th>Rk</th></tr></thead>
            <tbody>
    `;
    
    for (let k = 1; k <= maxK; k++) {
        let numerator = 0;
        for (let i = 0; i < n - k; i++) {
            numerator += (numbers[i] - mean) * (numbers[i + k] - mean);
        }
        let denominator = (n - k) * variance;
        let Rk = numerator / denominator;
        
        step3Report += `<p>k=${k} → Numerator = ${numerator.toFixed(6)}</p>`;
        step4Report += `<p>k=${k} → Denominator = ${denominator.toFixed(6)}</p>`;
        step5Report += `
            <tr>
                <td>${k}</td>
                <td>${Rk.toFixed(6)}</td>
            </tr>
        `;
    }
    step5Report += `</tbody></table></div>`;
    
    const report = document.getElementById("report");
    report.innerHTML = `
        <h1>Dependency Test Results</h1>
        <div class="tab-body">
            <h2>Step 1: Mean</h2>
            <p><strong>X̄ = ${mean.toFixed(4)}</strong></p>
        </div>
        <div class="tab-body">
            <h2>Step 2: Sample Variance</h2>
            <p><strong>Sx² = ${variance.toFixed(6)}</strong></p>
        </div>
        <div class="tab-body">
            ${step3Report}
        </div>
        <div class="tab-body">
            ${step4Report}
        </div>
        <div class="tab-body">
            ${step5Report}
        </div>
        <div class="tab-body">
            <h2>Final Output</h2>
            <p><strong>Average |Rk| = ${avgAbsR.toFixed(6)}</strong></p>
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
    if (runButtonGroup && runButtonGroup.querySelector('button[onclick*="runDependencyTest"]')) {
        runButtonGroup.style.display = 'flex';
    }
    
    // Reset form inputs
    document.getElementById("n").value = '';
    document.getElementById("maxK").value = '';
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
                cell.title = `Click to select (Row ${rowNum}, Column ${colNum})`;
                cell.onclick = () => selectTableCell(rowNum, colNum);
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
    }
});

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

    pdf.save("Dependency_Test_Report.pdf");

    // Hide report again
    report.style.display = "none";
    document.body.classList.remove("pdf-mode");
}
