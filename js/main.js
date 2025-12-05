// Store selected options
let selectedOptions = {
    mainType: null,
    subOption: null,
    method: null
};

function selectOption(type) {
    const sub = document.getElementById("subOptions");
    const summarySection = document.getElementById("summarySection");

    sub.innerHTML = "";
    sub.classList.add("hidden");
    if (summarySection) summarySection.classList.add("hidden");

    selectedOptions = {
        mainType: null,
        subOption: null
    };

    selectedOptions.mainType = type;

    if (type === "math") {
        window.location.href = "mathematical.html";
        return;
    }

    if (type === "single") {
        window.location.href = "single/singleOptions.html";
        return;
    }

    if (type === "inventory") {
        alert("Redirect to inventory page (later)");
        return;
    }

    if (type === "multiple") {
        sub.classList.remove("hidden");
        sub.innerHTML = `
            <h3>Multiple Server Options</h3>
            <button class="btn small" onclick="chooseSub('multi-customers')">Limited by Customer Number</button>
            <button class="btn small" onclick="chooseSub('multi-time')">Limited by Time</button>
        `;
    }
}

function chooseSub(choice) {
    const summarySection = document.getElementById("summarySection");

    selectedOptions.subOption = choice;
    if (summarySection) summarySection.classList.add("hidden");

    // Case: Limited by Customer → direct navigation
    if (choice === "multi-customers") {
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        window.location.href = "multiple/multiLimitedCustomer.html";
        return;
    }

    // Case: Limited by Time → direct navigation (same flow as customer-limited)
    if (choice === "multi-time") {
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        window.location.href = "multiple/multiLimitedTime.html";
        return;
    }


}

function updateSummary() {
    const summarySection = document.getElementById("summarySection");
    const summaryText = document.getElementById("summaryText");

    if (!summarySection || !summaryText) return;

    if (!selectedOptions.mainType || !selectedOptions.subOption )
        return summarySection.classList.add("hidden");

    let summary = "";

    if (selectedOptions.mainType === "multiple")
        summary += "• <strong>Server Type:</strong> Multiple Server (2 Servers)<br>";

    if (selectedOptions.subOption === "multi-customers")
        summary += "• <strong>Limitation:</strong> Limited by Customer Number<br>";

    if (selectedOptions.subOption === "multi-time")
        summary += "• <strong>Limitation:</strong> Limited by Time<br>";

    summaryText.innerHTML = summary;
    summarySection.classList.remove("hidden");
}

function startSimulation() {
    // This function is kept for backward compatibility but is no longer used
    // All flows (multi-customers, multi-time) now navigate directly in chooseSub()
    alert("Navigation path not configured. Please use the sub-option buttons.");
}
