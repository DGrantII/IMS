// Client-side JavaScript for the Create Manifest page

// Get references to DOM elements
const itemNumberInput = document.getElementById('itemNumber');
const itemQuantityInput = document.getElementById('itemQuantity');
const addItemButton = document.getElementById('addItemButton');
const itemListBody = document.getElementById('itemList');

// Function to create a table row for an item
const createTableRow = (item, quantity) => {
    // Create a new table row element
    const row = document.createElement('tr');

    // Create and append cells for SKU, UPC, Description, and Quantity
    const skuCell = document.createElement('td');
    skuCell.textContent = item.sku || 'N/A';
    row.appendChild(skuCell);

    const upcCell = document.createElement('td');
    upcCell.textContent = item.upc || 'N/A';
    row.appendChild(upcCell);

    const descriptionCell = document.createElement('td');
    descriptionCell.textContent = item.description || 'N/A';
    row.appendChild(descriptionCell);

    const quantityCell = document.createElement('td');
    quantityCell.textContent = quantity;
    row.appendChild(quantityCell);

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('btn', 'btn-sm', 'btn-danger');
    removeCell.appendChild(removeButton);
    row.appendChild(removeCell);

    // Return the constructed row element
    return row;
};

// Function to handle adding an item to the manifest
const addItemToManifest = async () => {
    // Get and validate user input for item number and quantity
    const itemNumber = itemNumberInput?.value.trim();
    const itemQuantity = itemQuantityInput?.value.trim();
    const quantity = Number(itemQuantity);

    // Validate that the item number is provided and the quantity is a valid number greater than 0
    if (!itemNumber) {
        alert('Please enter an SKU or UPC.');
        return;
    }

    if (!itemQuantity || Number.isNaN(quantity) || quantity < 1) {
        alert('Please enter a valid quantity of 1 or more.');
        return;
    }

    // Check if the item is already in the manifest to prevent duplicates
    const existingRows = itemListBody.querySelectorAll('tr');
    for (const row of existingRows) {
        const skuCell = row.querySelector('td:first-child');
        const upcCell = row.querySelector('td:nth-child(2)');
        if (skuCell && skuCell.textContent === itemNumber) {
            alert('This item is already added to the manifest. Please update the quantity if needed.');
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
            handleAuthError();
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
        console.error('Error adding item to manifest:', error);
        alert('An error occurred while looking up the item. Please try again later.');
    }
};

// Function to submit the created manifest to the server
const submitManifest = async () => {
    // Validate that at least one item has been added to the manifest
    const rows = itemListBody.querySelectorAll('tr');
    if (rows.length === 0) {
        alert('Please add at least one item to the manifest before submitting.');
        return;
    }

    // Obtain the optional tracking number from the input field
    const trackingNumberInput = document.getElementById('trackingNumber');
    const trackingNumber = trackingNumberInput?.value.trim() || null;

    // Construct the manifest data from the table rows
    const manifestItems = Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
            sku: cells[0].textContent,
            quantity: Number(cells[3].textContent)
        };
    });

    // Send the manifest data to the server
    try {
        const response = await fetch('/api/manifests/create-manifest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ trackingNumber, items: manifestItems })
        });

        // Handle unauthorized access
        if (response.status === 401 || response.status === 403) {
            handleAuthError();
            return;
        }

        // Check if the response indicates a successful manifest creation
        if (response.ok) {
            alert('Manifest created successfully!');
            
            // 
        } else {
            const errorData = await response.json();
            alert(`Failed to create manifest: ${errorData.message || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('Error submitting manifest:', error);
        alert('An error occurred while submitting the manifest. Please try again later.');
    }
}

// Function to show the success modal after receiving a manifest
const showSuccessModal = () => {
    const modalElement = document.getElementById('successModal');
    const okButton = modalElement.querySelector('#successModalOk');
    okButton.onclick = () => {
        window.location.href = 'shipping';
    };
    const successModal = new bootstrap.Modal(modalElement);
    successModal.show();
};

addItemButton?.addEventListener('click', addItemToManifest);

// Function to handle removing an item from the manifest
itemListBody.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Remove') {
        const row = event.target.closest('tr');
        if (row) {
            itemListBody.removeChild(row);
        }
    }
});