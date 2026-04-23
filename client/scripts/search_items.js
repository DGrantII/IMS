// Script to handle searching for items in the inventory

// Obtain references to the search form and its input fields
const searchForm = document.querySelector('#searchForm');
const fields = Array.from(searchForm.querySelectorAll('input[type="text"]'));

// Function to update the state of the input fields based on user input
const updateFieldStates = () => {
    const filledField = fields.find(field => field.value.trim() !== '');
    if (filledField) {
        fields.forEach(field => {
            if (field !== filledField) {
                field.disabled = true;
            } else {
                field.disabled = false;
            }
        });
    } else {
        fields.forEach(field => field.disabled = false);
    }
}

// Attach event listeners to input fields to update their states
fields.forEach(field => {
    field.addEventListener('input', updateFieldStates);
});

// Create a function to clear the search form
const clearForm = () => {
    fields.forEach(field => field.value = '');
    updateFieldStates();
}

// Attach event listener to the clear button
const clearButton = document.getElementById('clearButton');
clearButton.addEventListener('click', clearForm);

// Attach event listener to the search form to handle submissions
searchForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const filledField = fields.find(field => field.value.trim() !== '');
    if (!filledField) {
        alert('Please enter a value into one search field.');
        return;
    }

    const q = encodeURIComponent(filledField.id);
    const v = encodeURIComponent(filledField.value.trim());
    const url = `/api/items/search-item?q=${q}&v=${v}`;

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
        if (!data.found) {
            // Replace table with "No results found" message
            const itemContent = document.getElementById('item-content');
            itemContent.innerHTML = '<div class="alert alert-warning" role="alert">No results found</div>';
            itemContent.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Populate table with item data
            if (data.items.length === 1) {
                const item = data.items[0];
                populateItemTable(item);
            } else {
                // If more are found, show a list of items to select from
                const itemContent = document.getElementById('item-content');
                let output = '<div class="list-group">';
                data.items.forEach(item => {
                    output += `<button type="button" class="list-group-item list-group-item-action" onclick='fetchItemDetails("${item.sku}")'>SKU: ${item.sku}<br>Description: ${item.description}</button>`;
                });
                output += '</div>';
                itemContent.innerHTML = output;
                itemContent.scrollIntoView({ behavior: 'smooth' });
            }
        }

    } catch (error) {
        console.error('Error fetching search results:', error);
        alert('An error occurred while searching. Please try again later.');
    }
});

// Function to fetch item details by SKU
const fetchItemDetails = async (sku) => {
    const url = `/api/items/search-item?q=itemNumber&v=${encodeURIComponent(sku)}`;
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
        populateItemTable(data.items[0]);
    } catch (error) {
        console.error('Error fetching item details:', error);
        alert('An error occurred while fetching item details. Please try again later.');
    }
};

// Function to populate the item table with details
const populateItemTable = (item) => {
    let output = `
    <div class='row'>
        <div class='col'>
            <h3>Product Details</h3>
        </div>
        <div class="col text-end" id="modifyButtonWrapper"></div>
    </div>
    
    <table id="item-table" class="table table-striped">
        <tbody>
        <tr><th scope="row">SKU:</th><td id="item-sku">${item.sku || 'N/A'}</td></tr>
        <tr><th scope="row">UPC:</th><td id="item-upc">${item.upc || 'N/A'}</td></tr>
        <tr><th scope="row">Status:</th><td id="item-status">${item.status || 'N/A'}</td></tr>
        <tr><th scope="row">Model Number:</th><td id="item-model-number">${item.model || 'N/A'}</td></tr>
        <tr><th scope="row">Brand:</th><td id="item-brand">${item.brand || 'N/A'}</td></tr>
        <tr><th scope="row">Description:</th><td id="item-description">${item.description || 'N/A'}</td></tr>
        <tr><th scope="row">Total Quantity:</th><td id="item-total-quantity">${item.totalQuantity !== undefined ? item.totalQuantity : 'N/A'}</td></tr>
        <tr><td scope="row">Available Quantity:</td><td id="item-available-quantity">${item.availableQuantity !== undefined ? item.availableQuantity : 'N/A'}</td></tr>
        <tr><td scope="row">Order Quantity:</td><td id="item-order-quantity">${item.orderQuantity !== undefined ? item.orderQuantity : 'N/A'}</td></tr>
        <tr><th scope="row">In Transit:</th><td id="item-in-transit">${item.inTransit !== undefined ? item.inTransit : 'N/A'}</td></tr>
        <tr><th scope="row">Price:</th><td id="item-price">${item.price !== undefined ? `$${item.price}` : 'N/A'}</td></tr>
        </tbody>
    </table>`;
    const itemContent = document.getElementById('item-content');
    itemContent.innerHTML = output;
    itemContent.scrollIntoView({ behavior: 'smooth' });
    itemContent.focus();

    createModifyButton(item.sku);
};

// Function for adding the create item button for admin users
const createItemButton = async () => {
    const userRole = await getUserRole();
    if (userRole.toLowerCase() === 'admin') {
        const manifestButton = document.createElement('button');
        manifestButton.className = 'btn btn-primary p-0 rounded-circle';
        manifestButton.href = './create-item';
        manifestButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
        `;
        manifestButton.addEventListener('click', () => {
            window.location.href = './create-item';
        });
        document.getElementById('createButtonWrapper').appendChild(manifestButton);
    }
};
document.addEventListener('DOMContentLoaded', createItemButton);

// Function for adding the modify item button for admin users
const createModifyButton = async (sku) => {
    const userRole = await getUserRole();
    if (userRole.toLowerCase() === 'admin') {
        const modifyButton = document.createElement('a');
        modifyButton.className = 'icon-link';
        modifyButton.href = `./modify-item?sku=${encodeURIComponent(sku)}`;
        modifyButton.innerHTML = `
                        Edit
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                        </svg>
        `;
        modifyButton.addEventListener('click', () => {
            window.location.href = `./modify-item?sku=${encodeURIComponent(sku)}`;
        });
        document.getElementById('modifyButtonWrapper').appendChild(modifyButton);
    }
};
