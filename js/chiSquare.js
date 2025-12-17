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
            inputsContainer.appendChild(input);
        }
        
        inputGroup.appendChild(inputsContainer);
        container.appendChild(inputGroup);
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

    document.querySelector("#tab4 .tab-body").innerHTML = `
        <h2>Step 5: Chi-Square Table Value</h2>
        <p>Degrees of freedom (df) = k - 1 = ${df}</p>
        <p>α = ${alpha}</p>
        <p><strong>χ²table = ${chiTable}</strong></p>
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
            <p>Degrees of freedom (df) = k - 1 = ${df}</p>
            <p>α = ${alpha}</p>
            <p><strong>χ²table = ${chiTable}</strong></p>
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
    
    // Show Run Test button
    const runButtonGroup = document.querySelector('.button-group');
    if (runButtonGroup && runButtonGroup.querySelector('button[onclick*="runChiSquare"]')) {
        runButtonGroup.style.display = 'flex';
    }
    
    // Reset form inputs
    document.getElementById("n").value = '';
    document.getElementById("k").value = '';
    document.getElementById("alpha").value = '';
    document.getElementById("randomInputs").innerHTML = '';
    
    // Reset tab to first
    currentTab = 0;
    openTab(0);
}

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
function chiSquareTable(df, alpha) {
    const table = {
        0.1: [2.71, 4.61, 6.25, 7.78, 9.24],
        0.05: [3.84, 5.99, 7.81, 9.49, 11.07],
        0.025: [5.02, 7.38, 9.35, 11.14, 12.83],
        0.01: [6.63, 9.21, 11.34, 13.28, 15.09]
    };
    return table[alpha] && table[alpha][df - 1]
        ? table[alpha][df - 1]
        : "Not Available";
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
