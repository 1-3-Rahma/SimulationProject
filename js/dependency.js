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
            inputsContainer.appendChild(input);
        }
        
        inputGroup.appendChild(inputsContainer);
        container.appendChild(inputGroup);
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
    
    // Show Run Test button
    const runButtonGroup = document.querySelector('.button-group');
    if (runButtonGroup && runButtonGroup.querySelector('button[onclick*="runDependencyTest"]')) {
        runButtonGroup.style.display = 'flex';
    }
    
    // Reset form inputs
    document.getElementById("n").value = '';
    document.getElementById("maxK").value = '';
    document.getElementById("randomInputs").innerHTML = '';
    
    // Reset tab to first
    currentTab = 0;
    openTab(0);
}

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
