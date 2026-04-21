const searchForm = document.querySelector('#searchForm');
const fields = Array.from(searchForm.querySelectorAll('input[type="text"]'));

function updateFieldStates() {
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

fields.forEach(field => {
    field.addEventListener('input', updateFieldStates);
});

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


const populateItemTable = (item) => {
    let output = `
    <h3>Product Details</h3>
    <table id="item-table" class="table table-striped">
        <tbody>
        <tr><th scope="row">SKU:</th><td id="item-sku">${item.sku || 'N/A'}</td></tr>
        <tr><th scope="row">UPC:</th><td id="item-upc">${item.upc || 'N/A'}</td></tr>
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
};

// Function for creating item button for admin users
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