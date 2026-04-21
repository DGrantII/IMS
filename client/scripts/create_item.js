// Function to show confirmation modal
const showConfirmationModal = () => {
    const modalElement = document.getElementById('confirmationModal');
    const okButton = modalElement.querySelector('#confirmCreateBtn');
    okButton.onclick = () => {
        createItem();
        successModal.hide();
    };
    const successModal = new bootstrap.Modal(modalElement);
    successModal.show();
};
document.getElementById('createBtn').addEventListener('click', showConfirmationModal);

// Function to create item
const createItem = async () => {
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
        const response = await fetch('/api/items/create-item', {
            method: 'POST',
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
            alert('Failed to create item. Please try again.');
            return;
        }

        showSuccessModal();
    } catch (error) {
        console.error('Error creating item:', error);
        alert('An error occurred while creating the item: ' + error.message);
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