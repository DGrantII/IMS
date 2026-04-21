// Disable the complete action when no item quantity has changed.
const updateCompleteButtonState = () => {
    const completeButton = document.getElementById('completeAdjustmentBtn');
    if (!completeButton) {
        return;
    }

    const adjustmentTable = document.getElementById('adjustment-items-table');
    if (!adjustmentTable) {
        completeButton.disabled = true;
        return;
    }

    const hasQuantityChange = Array.from(adjustmentTable.querySelectorAll('tbody tr')).some(row => {
        const quantityBefore = parseInt(row.querySelector('.quantity-before').textContent, 10);
        const quantityAfter = parseInt(row.querySelector('input').value, 10);
        return quantityBefore !== quantityAfter;
    });

    completeButton.disabled = !hasQuantityChange;
    completeButton.title = hasQuantityChange ? '' : 'Complete Adjustment is unavailable when all item quantities are unchanged.';
};

// Script to populate page content
const populateAdjustmentContent = async () => {
    // Get the adjustment ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const adjustmentNumber = urlParams.get('adjustmentNumber');
    if (!adjustmentNumber) {
        document.getElementById('adjustment-content').innerHTML = '<div class="alert alert-warning" role="alert">No adjustment found</div>';
        return;
    }

    // Get adjustment details from the server and populate content
    try {

        // Fetch adjustment details using the adjustment number
        const response = await fetch(`/api/adjustments/search-adjustment?adjustmentNumber=${encodeURIComponent(adjustmentNumber)}`, {
            method: 'GET',
            credentials: 'include'
        });

        // Handle unauthorized access
        if (response.status === 401 || response.status === 403) {
            handleAuthError('You do not have access. Redirecting to home page.', 'index', 'Access Denied');
            return;
        }

        // Parse response data
        const data = await response.json();

        // Check if manifest was found
        if (!data.found) {
            document.getElementById('adjustment-content').innerHTML = '<div class="alert alert-warning" role="alert">No adjustment found</div>';
            return;
        }
        const adjustment = data.adjustments[0];
        const items = data.items;

        // Populate adjustment details
        const initialTotalCost = Number(adjustment.totalCost ?? 0);
        let output = `
        <table id="adjustment-table" class="table table-striped">
            <tbody>
                <tr><th>Adjustment Number</th><td>${adjustment.inventoryAdjustmentID}</td></tr>
                <tr><th>Create Date</th><td>${new Date(adjustment.createDate).toLocaleDateString()}</td></tr>
                <tr><th>Status</th><td>${adjustment.status}</td></tr>
                <tr><th>Adjusted By</th><td>${adjustment.adjustedBy || 'N/A'}</td></tr>
                <tr><th>Reason</th><td>
                    <textarea class="form-control" rows="3" id="adjustmentReason">${adjustment.reason || 'N/A'}</textarea>
                </td></tr>
                <tr><th>Total Cost</th><td>$${initialTotalCost.toFixed(2)}</td></tr>
            </tbody>
        </table>
        <table id="adjustment-items-table" class="table table-striped">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>UPC</th>
                    <th>Description</th>
                    <th>Quantity Before</th>
                    <th>Quantity After</th>
                    <th>Cost</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.sku}</td>
                        <td>${item.upc}</td>
                        <td>${item.description}</td>
                        <td class="quantity-before">${item.quantityBefore}</td>
                        <td>
                            <input
                                type="number"
                                min="0"
                                price="${item.price}"
                                value="${item.quantityAfter}"
                                id="${item.sku}"
                                style="width: 50px;"
                                class="form-control form-control-sm quantity-after-input"
                                onchange="updateCosts( ${item.sku}, ${item.quantityBefore}, this.value)" />
                        </td>
                        <td>$${item.cost}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        `;

        let buttonOutput = `
            <div class="col">
                <button class="btn btn-danger" id="deleteAdjustmentBtn">Delete Adjustment</button>
            </div>
            <div class="col">
                <button class="col-sm-auto btn btn-secondary" id="cancelAdjustmentBtn">Suspend Adjustment</button>
            </div>
            <div class="col">
                <button class="col-sm-auto btn btn-primary" id="completeAdjustmentBtn">Complete Adjustment</button>
            </div>
        `;

        // Insert content into page and add event listener to complete adjustment button
        document.getElementById('adjustment-content').innerHTML = output;
        document.getElementById('button-content').innerHTML = buttonOutput;
        document.getElementById('completeAdjustmentBtn').addEventListener('click', showCompleteModal);
        document.getElementById('deleteAdjustmentBtn').addEventListener('click', showDeleteModal);
        document.getElementById('cancelAdjustmentBtn').addEventListener('click', showSuspendModal);
        updateCompleteButtonState();
    } catch (error) {
        console.error('Error fetching adjustment details:', error);
        alert('An error occurred while fetching adjustment details. Please try again later.');
    }
}

// Function to update the costs based on quantity changes
const updateCosts = (inputID,quantityBefore, quantityAfter) => {
    // Updating the cost based on the quantity change
    const quantityInput = document.getElementById(inputID);
    const price = parseFloat(quantityInput.getAttribute('price'));
    const difference = quantityAfter - quantityBefore;
    const cost = difference * price;
    const costCell = quantityInput.parentElement.nextElementSibling;
    costCell.textContent = `$${cost.toFixed(2)}`;

    // Updating the total cost based on the updated item cost
    const adjustmentTable = document.getElementById('adjustment-items-table');
    let totalCost = 0;
    adjustmentTable.querySelectorAll('tbody tr').forEach(row => {
        const costText = row.querySelector('td:last-child').textContent;
        const costValue = parseFloat(costText.replace('$', '')) || 0;
        totalCost += costValue;
    });
    document.querySelector('#adjustment-table tbody tr:last-child td:last-child').textContent = `$${totalCost.toFixed(2)}`;
    updateCompleteButtonState();

}

// Function to show modal for inventory adjustment completion
const showCompleteModal = () => {
    const modalElement = document.getElementById('completeAdjustmentModal');
    const confirmButton = document.getElementById('confirmReceiveBtn');
    const confirmModal = new bootstrap.Modal(modalElement);
    confirmButton.onclick = async () => {
        confirmModal.hide();
        const result = await completeAdjustment();
        if (result.success) {
            showSuccessModal();
        } else {
            alert('Failed to complete adjustment. Please try again later.');
        }
    }
    confirmModal.show();
}

// Function to show modal for inventory adjustment suspension
const showSuspendModal = () => {
    const modalElement = document.getElementById('suspendAdjustmentModal');
    const confirmButton = document.getElementById('confirmSuspendBtn');
    const suspendModal = new bootstrap.Modal(modalElement);
    confirmButton.onclick = async () => {
        suspendModal.hide();
        const result = await suspendAdjustment();
        if (result.success) {
            showSuccessModal();
        } else {
            alert('Failed to suspend adjustment. Please try again later.');
        }
    }
    suspendModal.show();
}


// Function to get the data from the adjustment table
const getAdjustmentData = () => {
    const adjustmentTable = document.getElementById('adjustment-items-table');
    const adjustmentData = [];
    adjustmentTable.querySelectorAll('tbody tr').forEach(row => {
        const sku = row.querySelector('td:first-child').textContent;
        const quantityBefore = parseInt(row.querySelector('.quantity-before').textContent);
        const quantityAfter = parseInt(row.querySelector('input').value);
        const variance = quantityAfter - quantityBefore;
        const cost = parseFloat(row.querySelector('td:last-child').textContent.replace('$', '')) || 0;
        adjustmentData.push({ sku, variance, cost });
    });
    return adjustmentData;
}


// Function to submit the adjustment completion request
const completeAdjustment = async () => {
    const adjustmentItems = getAdjustmentData();
    const urlParams = new URLSearchParams(window.location.search);
    const adjustmentNumber = urlParams.get('adjustmentNumber');
    const adjustmentReason = document.getElementById('adjustmentReason').value.trim();
    try {
        const response = await fetch(`api/adjustments/complete-adjustment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                adjustmentNumber,
                adjustmentItems,
                adjustmentReason
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error completing adjustment:', error);
        alert('An error occurred while submitting receiving data. Please try again later.');
    }
}

// Function to suspend the adjustment
const suspendAdjustment = async () => {
    const adjustmentItems = getAdjustmentData();
    const urlParams = new URLSearchParams(window.location.search);
    const adjustmentNumber = urlParams.get('adjustmentNumber');
    const adjustmentReason = document.getElementById('adjustmentReason').value.trim();
    try {
        const response = await fetch(`api/adjustments/suspend-adjustment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                adjustmentNumber,
                adjustmentItems,
                adjustmentReason
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error suspending adjustment:', error);
        alert('An error occurred while suspending the adjustment. Please try again later.');
    }

}

// Function to show the success modal after completing the adjustment
const showSuccessModal = () => {
    const modalElement = document.getElementById('successModal');
    const okButton = modalElement.querySelector('#successModalOk');
    okButton.onclick = () => {
        window.location.href = 'inventory-adjustment';
    };
    const successModal = new bootstrap.Modal(modalElement);
    successModal.show();
};

// Function to show the delete adjustment modal
const showDeleteModal = () => {
    const modalElement = document.getElementById('deleteAdjustmentModal');
    const confirmButton = document.getElementById('confirmDeleteBtn');
    const deleteModal = new bootstrap.Modal(modalElement);
    confirmButton.onclick = async () => {
        deleteModal.hide();
        const result = await deleteAdjustment();
        if (result.success) {
            showDeleteSuccessModal();
        } else {
            alert('Failed to delete adjustment. Please try again later.');
        }
    }
    deleteModal.show();
}

// Function to delete an adjustment
const deleteAdjustment = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const adjustmentNumber = urlParams.get('adjustmentNumber');
    try {
        const response = await fetch(`api/adjustments/delete-adjustment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ adjustmentNumber })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting adjustment:', error);
        alert('An error occurred while deleting the adjustment. Please try again later.');
    }
}

// Function to show the delete success modal
const showDeleteSuccessModal = () => {
    const modalElement = document.getElementById('deleteSuccessModal');
    const okButton = modalElement.querySelector('#deleteSuccessModalOk');
    okButton.onclick = () => {
        window.location.href = 'inventory-adjustment';
    };
    const deleteSuccessModal = new bootstrap.Modal(modalElement);
    deleteSuccessModal.show();
};

document.addEventListener('DOMContentLoaded', populateAdjustmentContent);