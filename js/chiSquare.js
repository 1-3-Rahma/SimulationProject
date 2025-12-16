function generateRandomInputs() {
    const n = parseInt(document.getElementById("n").value);
    const container = document.getElementById("randomInputs");
    container.innerHTML = "";

    for (let i = 0; i < n; i++) {
        container.innerHTML += `
            <input type="number" step="0.0001" min="0" max="1" placeholder="R${i+1}">
        `;
    }
}

function runChiSquare() {

    const numbers = Array.from(
        document.querySelectorAll("#randomInputs input")
    ).map(i => parseFloat(i.value));

    const n = numbers.length;
    const k = parseInt(document.getElementById("k").value);
    const alpha = parseFloat(document.getElementById("alpha").value);

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
        <h3>Step 1: Interval & Range Table</h3>
        <table>
            <tr><th>Interval</th><th>Range</th></tr>
    `;
    intervals.forEach((intv, i) => {
        step1 += `
            <tr>
                <td>${i + 1}</td>
                <td>[${intv.start.toFixed(2)} , ${intv.end.toFixed(2)})</td>
            </tr>
        `;
    });
    step1 += `</table>`;
    document.getElementById("tab0").innerHTML = step1;

    // ================= STEP 2 =================
    let step2 = `
        <h3>Step 2: Observed Frequency (O)</h3>
        <table>
            <tr>
                <th>Interval</th>
                <th>Random Numbers Inside</th>
                <th>Observed Frequency (O)</th>
            </tr>
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
    step2 += `</table>`;
    document.getElementById("tab1").innerHTML = step2;

    // ================= STEP 3 =================
    document.getElementById("tab2").innerHTML = `
        <h3>Step 3: Expected Frequency</h3>
        <p><strong>E = n / k = ${n} / ${k} = ${expected.toFixed(2)}</strong></p>
    `;

    // ================= STEP 4 =================
    let chiCal = 0;
    let step4 = `
        <h3>Step 4: Chi-Square Calculation</h3>
        <table>
            <tr>
                <th>Interval</th>
                <th>O</th>
                <th>E</th>
                <th>χ²</th>
            </tr>
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
        </table>
        <p><strong>χ²cal = ${chiCal.toFixed(4)}</strong></p>
    `;
    document.getElementById("tab3").innerHTML = step4;

    // ================= STEP 5 =================
    const df = k - 1;
    const chiTable = chiSquareTable(df, alpha);

    document.getElementById("tab4").innerHTML = `
        <h3>Step 5: Chi-Square Table Value</h3>
        <p>Degrees of freedom (df) = k - 1 = ${df}</p>
        <p>α = ${alpha}</p>
        <p><strong>χ²table = ${chiTable}</strong></p>
    `;

    // ================= STEP 6 =================
    let decision = `
        <h3>Step 6: Decision</h3>
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
    document.getElementById("tab5").innerHTML = decision;

    document.getElementById("tabs").classList.remove("hidden");
    openTab(0);
}

// Tabs
function openTab(index) {
    document.querySelectorAll(".tab-content").forEach((tab, i) => {
        tab.classList.toggle("hidden", i !== index);
    });
}

// Chi-Square table (basic – extendable)
function chiSquareTable(df, alpha) {
    const table = {
        0.05: [3.84, 5.99, 7.81, 9.49, 11.07],
        0.01: [6.63, 9.21, 11.34, 13.28, 15.09]
    };
    return table[alpha] && table[alpha][df - 1]
        ? table[alpha][df - 1]
        : "Not Available";
}

// ===== VALIDATION =====
// if (k <= 0) {
//     alert("k must be greater than 0");
//     return;
// }

// if (![0.1, 0.05, 0.025, 0.01].includes(alpha)) {
//     alert("Alpha must be one of: 0.1, 0.05, 0.025, 0.01");
//     return;
// }

// for (let num of numbers) {
//     if (isNaN(num) || num < 0 || num > 1) {
//         alert("Random numbers must be between 0 and 1");
//         return;
//     }
// }
