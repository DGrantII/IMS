// Get references to DOM elements
const itemNumberInput = document.getElementById('itemNumber');
const itemQuantityInput = document.getElementById('itemQuantity');
const addItemButton = document.getElementById('addItemButton');
const itemListBody = document.getElementById('itemList');

// Function to create a table row for an item
const createTableRow = (item, quantity) => {
    // Create a new table row element
    const row = document.createElement('tr');
    row.addAttribute = 'price';
    row.setAttribute('price', item.price);


    // Create and append cells for SKU, UPC, Description, Quantity Before, and Quantity After
    const skuCell = document.createElement('td');
    skuCell.textContent = item.sku;
    row.appendChild(skuCell);

    const upcCell = document.createElement('td');
    upcCell.textContent = item.upc;
    row.appendChild(upcCell);

    const descriptionCell = document.createElement('td');
    descriptionCell.textContent = item.description;
    row.appendChild(descriptionCell);

    const quantityBeforeCell = document.createElement('td');
    quantityBeforeCell.textContent = item.totalQuantity;
    row.appendChild(quantityBeforeCell);

    const quantityAfterCell = document.createElement('td');
    quantityAfterCell.textContent = quantity;
    row.appendChild(quantityAfterCell);

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
    removeCell.appendChild(removeButton);
    row.appendChild(removeCell);


    return row;
}

// Function to handle adding an item to the adjustment
const addItemToAdjustment = async () => {
    // Get and validate user input for the item number and quantity
    const itemNumber = itemNumberInput.value.trim();
    const itemQuantity = itemQuantityInput.value.trim();
    const quantity = Number(itemQuantity);

    // Validate that the item number is provided and the quantity is a valid number greater than or equal to 0
    if (!itemNumber) {
        alert('Please enter a SKU or UPC.');
        return;
    }
    if (!itemQuantity || Number.isNaN(quantity) || quantity < 0) {
        alert('Please enter a valid quantity of 0 or more.');
        return;
    }

    // Check if the item is already in the adjustment
    const existingRows = itemListBody.querySelectorAll('tr');
    for (const row of existingRows) {
        const skuCell = row.querySelector('td:first-child');
        const upcCell = row.querySelector('td:nth-child(2)');
        if (skuCell && skuCell.textContent === itemNumber) {
            alert('This item is already added to the adjustment. Please update the quantity if needed.');
            return;
        }
    }

    // Construct the API URL for searching the item by SKU or UPC
    const url = `/api/items/search-item?q=itemNumber&v=${encodeURIComponent(itemNumber)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
            handleAuthError('You do not have access. Redirecting to home page.', 'index', 'Access Denied');
            return;
        }

        const data = await response.json();

        if (!data.found || !Array.isArray(data.items) || data.items.length === 0) {
            alert('No item was found for that SKU/UPC. Please verify the value and try again.');
            return;
        }

        if (data.items.length > 1) {
            alert('Multiple items were returned. Please use a more specific SKU or UPC.');
            return;
        }

        const item = data.items[0];
        itemListBody.appendChild(createTableRow(item, quantity));

        itemNumberInput.value = '';
        itemQuantityInput.value = '';
        itemNumberInput.focus();
    } catch (error) {
        console.error('Error adding item to adjustment:', error);
        alert('An error occurred while looking up the item. Please try again later.');
    }
}
addItemButton?.addEventListener('click', addItemToAdjustment);

// Function to handle removing an item from the adjustment
itemListBody.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Remove') {
        const row = event.target.closest('tr');
        if (row) {
            itemListBody.removeChild(row);
        }
    }
});

// Function to handle completing the adjustment
const completeAdjustment = () => {
    sendData("Completed");
}

// Function to handle suspending the adjustment
const suspendAdjustment = () => {
    sendData("Suspended");
}


// Function to send the adjustment to the server
const sendData = async (status) => {
    // Validate that at least one item has been added to the adjustment
    const rows = itemListBody.querySelectorAll('tr');
    if (rows.length === 0) {
        alert('Please add at least one item to the adjustment before completing.');
        return;
    }

    // Obtain the reason for the adjustment from the input field
    const reason = document.getElementById('reason').value.trim();
    if (!reason) {
        alert('Please provide a reason for the adjustment.');
        return;
    }

    // Construct the adjustment data
    const adjustmentData = {
        reason,
        status,
        adjustmentItems: Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td');
            const variance = Number(cells[4].textContent) - Number(cells[3].textContent);
            return {
                sku: cells[0].textContent,
                variance,
                cost: Number(row.getAttribute('price')) * variance
            };  
        })
    };

    try {
        const response = await fetch('/api/adjustments/create-adjustment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(adjustmentData)
        });

        if (response.status === 401 || response.status === 403) {
            handleAuthError('You do not have access. Redirecting to home page.', 'index', 'Access Denied');
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to submit adjustment.');
        }

        if (status === "Completed") {
            showCompletedModal();
        } else if (status === "Suspended") {
            showSuspendedModal();
        }

    } catch (error) {
        console.error('Error submitting adjustment:', error);
        alert('An error occurred while submitting the adjustment. Please try again later.');
    }
}
document.getElementById('completeBtn').addEventListener('click', completeAdjustment);
document.getElementById('suspendBtn').addEventListener('click', suspendAdjustment);

// Function to show the completed modal
const showCompletedModal = () => {
    const modalElement = document.getElementById('completedModal');
    const okButton = modalElement.querySelector('#completedModalOk');
    okButton.onclick = () => {
        window.location.href = 'inventory-adjustment';
    };
    const successModal = new bootstrap.Modal(modalElement);
    successModal.show();
};

// Function to show the suspended modal
const showSuspendedModal = () => {
    const modalElement = document.getElementById('suspendedModal');
    const okButton = modalElement.querySelector('#suspendedModalOk');
    okButton.onclick = () => {
        window.location.href = 'inventory-adjustment';
    };
    const suspendedModal = new bootstrap.Modal(modalElement);
    suspendedModal.show();
};