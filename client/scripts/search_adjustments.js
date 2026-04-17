// Get form elements
const adjustmentNumber = document.getElementById('adjustmentNumber');
const createDateStart = document.getElementById('createDateStart');
const createDateEnd = document.getElementById('createDateEnd');
const status = document.getElementById('status');

// Function to update disabled state of fields
const updateDisabled = () => {
    if (adjustmentNumber.value.trim()) {
        // Disable other fields when adjustmentNumber has value
        createDateStart.disabled = true;
        createDateEnd.disabled = true;
        status.disabled = true;
        adjustmentNumber.disabled = false;
    } else if (createDateStart.value || createDateEnd.value || status.value) {
        // Disable adjustmentNumber when other fields have value
        adjustmentNumber.disabled = true;
        createDateStart.disabled = false;
        createDateEnd.disabled = false;
        status.disabled = false;
    } else {
        // Enable all fields when no fields have value
        adjustmentNumber.disabled = false;
        createDateStart.disabled = false;
        createDateEnd.disabled = false;
        status.disabled = false;
    }
}

// Add event listeners to update disabled state on input/change
adjustmentNumber.addEventListener('input', updateDisabled);
createDateStart.addEventListener('input', updateDisabled);
createDateEnd.addEventListener('input', updateDisabled);
status.addEventListener('change', updateDisabled);

const adjustmentForm = document.querySelector('#adjustmentForm');
adjustmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const adjustmentNumber = document.getElementById('adjustmentNumber').value.trim();
    const createDateStart = document.getElementById('createDateStart').value;
    const createDateEnd = document.getElementById('createDateEnd').value;
    const status = document.getElementById('status').value;

    let queryParams = [];
    if (adjustmentNumber) queryParams.push(`adjustmentNumber=${encodeURIComponent(adjustmentNumber)}`);
    if (createDateStart) queryParams.push(`createDateStart=${encodeURIComponent(createDateStart)}`);
    if (createDateEnd) queryParams.push(`createDateEnd=${encodeURIComponent(createDateEnd)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);

    const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';

    try {
        const response = await fetch(`/api/adjustments/search-adjustment${queryString}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
            handleAuthError('You do not have access. Redirecting to home page.', 'index', 'Access Denied');
            return;
        }

        const data = await response.json();
        if (!data.found) {
            const adjustmentContent = document.getElementById('adjustment-content');
            adjustmentContent.innerHTML = `<div class="alert alert-warning" role="alert">
                No adjustments found matching the search criteria.
            </div>`;
            adjustmentContent.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Render adjustments in a table
            if (data.adjustments.length === 1) {
                window.location.href = `adjustment-details?adjustmentNumber=${encodeURIComponent(data.adjustments[0].adjustmentNumber)}`;
            } else {

                // If more are found, show a list of adjustments to select from
                const adjustmentContent = document.getElementById('adjustment-content');
                let output = '<div class="list-group">';
                data.adjustments.forEach(adjustment => {
                    output += `<button type="button" class="list-group-item list-group-item-action" onclick='fetchAdjustmentDetails("${adjustment.adjustmentNumber}")'>Adjustment Number: ${adjustment.adjustmentNumber}<br>Create Date: ${new Date(adjustment.createDate).toLocaleDateString()}<br>Status: ${adjustment.status}</button>`;
                });
                output += '</div>';
                adjustmentContent.innerHTML = output;
                adjustmentContent.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (error) {
        console.error('Error fetching adjustments:', error);
        alert('An error occurred while searching for adjustments. Please try again later.');
    }
});

const fetchAdjustmentDetails = (adjustmentNumber) => {
    window.location.href = `adjustment-details?adjustmentNumber=${encodeURIComponent(adjustmentNumber)}`;
}

const createAdjustmentButton = () => {
    const adjustmentButton = document.createElement('button');
    adjustmentButton.className = 'btn btn-primary p-0 rounded-circle';
    adjustmentButton.href = './create-adjustment';
    adjustmentButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
        </svg>
    `;
    adjustmentButton.addEventListener('click', () => {
        window.location.href = './create-adjustment';
    });
    document.getElementById('createButtonWrapper').appendChild(adjustmentButton);
}

document.addEventListener('DOMContentLoaded', () => {
    createAdjustmentButton();
});