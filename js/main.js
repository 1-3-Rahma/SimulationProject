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
        window.location.href = "pages/mathematical.html";
        return;
    }

    if (type === "single") {
        sub.classList.remove("hidden");
        sub.innerHTML = `
            <h3>Single Server Options</h3>
            <button class="btn small" onclick="chooseSub('single-customers')">Limited by Customer Number</button>
            <button class="btn small" onclick="chooseSub('single-time')">Limited by Service Time</button>
        `;
        return;
    }

    if (type === "inventory") {
        window.location.href = "pages/inventory.html";
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

    // Single Server Cases
    if (choice === "single-customers") {
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        window.location.href = "pages/single/singleLimitedCustomer.html";
        return;
    }

    if (choice === "single-time") {
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        window.location.href = "pages/single/singleLimitedTime.html";
        return;
    }

    // Multiple Server Cases
    if (choice === "multi-customers") {
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        window.location.href = "pages/multiple/multiLimitedCustomer.html";
        return;
    }

    // Case: Limited by Time → direct navigation (same flow as customer-limited)
    if (choice === "multi-time") {
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        window.location.href = "pages/multiple/multiLimitedTime.html";
        return;
    }


}

function startSimulation() {
    // This function is kept for backward compatibility but is no longer used
    // All flows (multi-customers, multi-time) now navigate directly in chooseSub()
    alert("Navigation path not configured. Please use the sub-option buttons.");
}
