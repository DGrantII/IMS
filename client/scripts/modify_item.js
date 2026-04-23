// Function to populate the modify item form with existing item details
const populateModifyItemForm = (item) => {
    document.getElementById('upc').value = item.upc || '';
    document.getElementById('model').value = item.model || '';
    document.getElementById('brand').value = item.brand || '';
    document.getElementById('description').value = item.description || '';
    document.getElementById('price').value = item.price !== undefined ? item.price : '';
};

// Function to get item details by SKU
const fetchItemDetails = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sku = urlParams.get('sku');

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
        populateModifyItemForm(data.items[0]);
    } catch (error) {
        console.error('Error fetching item details:', error);
        alert('An error occurred while fetching item details. Please try again later.');
    }
};
document.addEventListener('DOMContentLoaded', fetchItemDetails);

// Function to show confirmation modal
const showConfirmationModal = () => {
    const modalElement = document.getElementById('confirmationModal');
    const okButton = modalElement.querySelector('#confirmModifyBtn');
    okButton.onclick = () => {
        modifyItem();
        successModal.hide();
    };
    const successModal = new bootstrap.Modal(modalElement);
    successModal.show();
};
document.getElementById('modifyBtn').addEventListener('click', showConfirmationModal);

// Function to modify item
const modifyItem = async () => {
    const upc = document.getElementById('upc').value.trim();
    const model = document.getElementById('model').value.trim();
    const brand = document.getElementById('brand').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = document.getElementById('price').value.trim();

    if (!upc || !model || !brand || !description || !price) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch('/api/items/modify-item', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ upc, model, brand, description, price })
        });

        if (response.status === 401 || response.status === 403) {
            handleAuthError('You do not have access. Redirecting to home page.', 'index', 'Access Denied');
            return;
        }

        if (!response.ok) {
            alert('Failed to modify item. Please try again.');
            return;
        }

        showSuccessModal();
    } catch (error) {
        console.error('Error modifying item:', error);
        alert('An error occurred while modifying the item: ' + error.message);
    }
}

// Function to show success modal
const showSuccessModal = () => {
    const modalElement = document.getElementById('successModal');
    const okButton = modalElement.querySelector('#successModalOk');
    okButton.onclick = () => {
        window.location.href = '/products';
    };
    const successModal = new bootstrap.Modal(modalElement);
    successModal.show();
};