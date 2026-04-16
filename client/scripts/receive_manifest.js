
const checkVariances = async () => {

    // Get manifest number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const manifestNumber = urlParams.get('manifestNumber');

    // Variables to track if any variances exist and to store variance details
    let varianceExists = false;
    const variances = [];

    // Loop through received quantity inputs and compare with sent quantity
    document.querySelectorAll('.received-quantity-input').forEach(input => {
        const sku = input.id;
        const sentQuantity = parseInt(input.getAttribute('sentQuantity'), 10);
        const quantity = parseInt(input.value, 10);

        // Check if quantity is different from sent quantity
        if (quantity !== sentQuantity) {
            varianceExists = true;
            variances.push({
                sku,
                expectedQuantity: sentQuantity,
                actualQuantity: quantity
            });
        }
    });

    const requestContent = {manifestNumber};
    if (varianceExists) {

        // If variances exist, show modal with variance details and option to create suspended inventory adjustment
        requestContent.variances = variances;
        showReceiveModal('Do you want to receive and create a suspended inventory adjustment for the variances?', requestContent);
    } else {

        // If no variances, show confirmation modal to proceed with receiving
        showReceiveModal('No variances detected. Do you want to proceed with receiving?', requestContent);
    }
};

// Script to handle receiving manifest details and populating the receiving page content
const populateReceivingContent = async () => {
    // Get manifest number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const manifestNumber = urlParams.get('manifestNumber');
    if (!manifestNumber) {
        document.getElementById('receiving-content').innerHTML = `<div class="alert alert-warning" role="alert">No manifests found</div>`;
        return;
    }

    // Get manifest details and populate content
    try {

        // Fetch manifest details using manifest number
        const response = await fetch(`/api/manifests/search-manifest?manifestNumber=${encodeURIComponent(manifestNumber)}`, {
            method: 'GET',
            credentials: 'include'
        });

        // Handle unauthorized access
        if (response.status === 401 || response.status === 403) {
            handleAuthError('Unauthorized Access', 'index.html');
            return;
        }

        // Parse response data
        const data = await response.json();

        // Check if manifest was found
        if (!data.found) {
            document.getElementById('receiving-content').innerHTML = `<div class="alert alert-warning" role="alert">No manifests found</div>`;
            return;
        }
        const manifest = data.manifests[0];
        const items = data.items;

        // Populate manifest details
        let output = `
        <table id="manifest-table" class="table table-striped">
            <tbody>
                <tr><th>Manifest Number</th><td>${manifest.manifestNumber}</td></tr>
                <tr><th>Tracking Number</th><td>${manifest.trackingNumber || 'N/A'}</td></tr>
                <tr><th>Create Date</th><td>${new Date(manifest.createDate).toLocaleDateString()}</td></tr>
                <tr><th>Status</th><td>${manifest.status}</td></tr>
            </tbody>
        </table>
        <table id="manifest-items-table" class="table table-striped">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Description</th>
                    <th>Sent Quantity</th>
                    <th>Received Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.sku}</td>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>
                            <input type="number" sentQuantity="${item.quantity}" min="0" value="0" id="${item.sku}" style="width: 50px;" class="form-control form-control-sm received-quantity-input">
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <button class="btn btn-primary w-25 float-end mt-3" id="receiveBtn">Receive</button>
        `;

        // Insert content into page and add event listener to receive button
        document.getElementById('receiving-content').innerHTML = output;
        document.getElementById('receiveBtn').addEventListener('click', checkVariances);

    } catch (error) {
        console.error('Error fetching manifest details:', error);
        alert('An error occurred while fetching manifest details. Please try again later.');
    }
    
};

// Function to show modal for receiving confirmation or variance details
const showReceiveModal = (message, requestContent) => {
    const modalElement = document.getElementById('receiveManifestModal');
    const confirmButton = modalElement.querySelector('#confirmReceiveBtn');
    confirmButton.onclick = async () => {
        receiveModal.hide();
        const result = await submitReceiving(requestContent);
        if (result.success) {
            showSuccessModal();
        } else {
            alert('Failed to receive manifest. Please try again later.');
        }
    };
    const receiveModal = new bootstrap.Modal(modalElement);
    document.getElementById('modalMessage').textContent = message;
    receiveModal.show();
};

// Function to submit receiving data to server
const submitReceiving = async (requestContent) => {
    try {
        const response = await fetch('/api/manifests/receive-manifest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(requestContent)
        });

        if (!response.ok) {
            throw new Error('Failed to submit receiving data');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error submitting receiving data:', error);
        alert('An error occurred while submitting receiving data. Please try again later.');

    }
}

// Function to show the success modal after receiving is complete
const showSuccessModal = () => {
    const modalElement = document.getElementById('successModal');
    const okButton = modalElement.querySelector('#successModalOk');
    okButton.onclick = () => {
        window.location.href = 'shipping';
    };
    const successModal = new bootstrap.Modal(modalElement);
    successModal.show();

};

document.addEventListener('DOMContentLoaded', populateReceivingContent);