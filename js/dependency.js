function generateInputs() {
    const n = parseInt(document.getElementById("n").value);
    const container = document.getElementById("randomInputs");
    container.innerHTML = "";

    for (let i = 0; i < n; i++) {
        container.innerHTML += `
            <input type="number" step="0.0001" min="0" max="1" placeholder="X${i+1}">
        `;
    }
}

function runDependencyTest() {

    const numbers = Array.from(
        document.querySelectorAll("#randomInputs input")
    ).map(i => parseFloat(i.value));

    const n = numbers.length;
    const maxK = parseInt(document.getElementById("maxK").value);

    // ===== Validation =====
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

    document.getElementById("tab0").innerHTML = `
        <h3>Step 1: Mean</h3>
        <p><strong>X̄ = ${mean.toFixed(4)}</strong></p>
    `;

    // ===== Step 2: Sample Variance =====
    let variance = numbers.reduce((sum, x) =>
        sum + Math.pow(x - mean, 2), 0) / (n - 1);

    document.getElementById("tab1").innerHTML = `
        <h3>Step 2: Sample Variance</h3>
        <p><strong>Sx² = ${variance.toFixed(6)}</strong></p>
    `;

    let results = [];
    let sumAbsR = 0;

    // ===== Step 3–5 =====
    let step3 = `<h3>Step 3: Numerator</h3>`;
    let step4 = `<h3>Step 4: Denominator</h3>`;
    let step5 = `
        <h3>Step 5: Correlation Rk</h3>
        <table>
            <tr><th>K</th><th>Rk</th></tr>
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

    step5 += `</table>`;

    document.getElementById("tab2").innerHTML = step3;
    document.getElementById("tab3").innerHTML = step4;
    document.getElementById("tab4").innerHTML = step5;

    // ===== Step 6: Final Output =====
    const avgAbsR = sumAbsR / maxK;

    document.getElementById("tab5").innerHTML = `
        <h3>Final Output</h3>
        <p><strong>Average |Rk| = ${avgAbsR.toFixed(6)}</strong></p>

        <button class="btn" onclick="downloadDependencyResult()">Download Result</button>
    `;

    document.getElementById("tabs").classList.remove("hidden");
    openTab(0);
}

function openTab(index) {
    document.querySelectorAll(".tab-content").forEach((tab, i) => {
        tab.classList.toggle("hidden", i !== index);
    });
}

function downloadDependencyResult() {
    let content = "DEPENDENCY TEST RESULTS\n\n";

    document.querySelectorAll("#tab5 p").forEach(p => {
        content += p.innerText + "\n";
    });

    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Dependency_Test_Result.txt";
    link.click();
}
