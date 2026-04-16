// Get form elements
const manifestNumber = document.getElementById('manifestNumber');
const trackingNumber = document.getElementById('trackingNumber');
const itemNumber = document.getElementById('itemNumberShipping');
const createDate = document.getElementById('createDate');
const status = document.getElementById('status');

// Function to update disabled state of fields
function updateDisabled() {
    const hasManifestOrTracking = manifestNumber.value.trim() || trackingNumber.value.trim();
    const hasOther = itemNumber.value.trim() || createDate.value || status.value;

    if (manifestNumber.value.trim()) {
        // Disable other fields when manifestNumber has value
        itemNumber.disabled = true;
        createDate.disabled = true;
        status.disabled = true;
        manifestNumber.disabled = false;
        trackingNumber.disabled = true;
    } else if (trackingNumber.value.trim()) {
        // Disable other fields when trackingNumber has value
        itemNumber.disabled = true;
        createDate.disabled = true;
        status.disabled = true;
        manifestNumber.disabled = true;
        trackingNumber.disabled = false;
    } else if (hasOther) {
        // Disable manifestNumber and trackingNumber when other fields have value
        manifestNumber.disabled = true;
        trackingNumber.disabled = true;
        itemNumber.disabled = false;
        createDate.disabled = false;
        status.disabled = false;
    } else {
        // Enable all fields when no fields have value
        manifestNumber.disabled = false;
        trackingNumber.disabled = false;
        itemNumber.disabled = false;
        createDate.disabled = false;
        status.disabled = false;
    }
}

// Add event listeners to update disabled state on input/change
manifestNumber.addEventListener('input', updateDisabled);
trackingNumber.addEventListener('input', updateDisabled);
itemNumber.addEventListener('input', updateDisabled);
createDate.addEventListener('input', updateDisabled);
status.addEventListener('change', updateDisabled);

const manifestForm = document.querySelector('#manifestForm');
manifestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const manifestNumber = document.getElementById('manifestNumber').value.trim();
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    const itemNumber = document.getElementById('itemNumberShipping').value.trim();
    const createDate = document.getElementById('createDate').value;
    const status = document.getElementById('status').value;

    let queryParams = [];
    if (manifestNumber) queryParams.push(`manifestNumber=${encodeURIComponent(manifestNumber)}`);
    if (trackingNumber) queryParams.push(`trackingNumber=${encodeURIComponent(trackingNumber)}`);
    if (itemNumber) queryParams.push(`itemNumber=${encodeURIComponent(itemNumber)}`);
    if (createDate) queryParams.push(`createDate=${encodeURIComponent(createDate)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    try {
        const response = await fetch(`/api/manifests/search-manifest${queryString}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.status === 401 || response.status === 403) {
            handleAuthError(response.status);
            return;
        }
        const data = await response.json();
        if (!data.found) {
            const manifestContent = document.getElementById('manifest-content');
            manifestContent.innerHTML = `<div class="alert alert-warning" role="alert">No manifests found</div>`;
            manifestContent.scrollIntoView({ behavior: 'smooth' });
        } else {

            // Populate table with manifest data
            if (data.manifests.length === 1) {
                const manifest = data.manifests[0];
                const itemArray = data.items;
                populateManifestTable(manifest, itemArray);
            } else {
                
                // If more are found, show a list of manifests to select from
                const manifestContent = document.getElementById('manifest-content');
                let output = '<div class="list-group">';
                data.manifests.forEach(manifest => {
                    output += `<button type="button" class="list-group-item list-group-item-action" onclick='fetchManifestDetails("${manifest.manifestNumber}")'>Manifest Number: ${manifest.manifestNumber}<br>Create Date: ${new Date(manifest.createDate).toLocaleDateString()}<br>Status: ${manifest.status}</button>`;
                });
                output += '</div>';
                manifestContent.innerHTML = output;
                manifestContent.scrollIntoView({ behavior: 'smooth' });
            }
        }

    } catch (error) {
        console.error('Error searching manifests:', error);
        alert('An error occurred while searching for manifests. Please try again later.');
    }
});

const fetchManifestDetails = async (manifestNumber) => {
    try {
        const response = await fetch(`/api/manifests/search-manifest?manifestNumber=${encodeURIComponent(manifestNumber)}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.status === 401 || response.status === 403) {
            handleAuthError(response.status);
            return;
        }
        const data = await response.json();
        populateManifestTable(data.manifests[0], data.items);
    } catch (error) {
        console.error('Error fetching manifest details:', error);
        alert('An error occurred while fetching manifest details. Please try again later.');
    }
};

const populateManifestTable = (manifest, items) => {
    let output = `
    <h3>Manifest Details</h3>
    <table id="manifest-table" class="table table-striped">
        <tbody>
            <tr><th>Manifest Number</th><td>${manifest.manifestNumber}</td></tr>
            <tr><th>Tracking Number</th><td>${manifest.trackingNumber || 'N/A'}</td></tr>
            <tr><th>Create Date</th><td>${new Date(manifest.createDate).toLocaleDateString()}</td></tr>
            <tr><th>Status</th><td>${manifest.status}</td></tr>
            <tr><th>Receive Date</th><td>${manifest.receiveDate ? new Date(manifest.receiveDate).toLocaleDateString() : 'N/A'}</td></tr>
            <tr><th>Received By</th><td>${manifest.receivedBy || 'N/A'}</td></tr>
        </tbody>
    </table>
    <h3>Items</h3>
    <table id="manifest-items-table" class="table table-striped">
        <thead>
            <tr>
                <th>SKU</th>
                <th>Description</th>
                <th>Quantity</th>
            </tr>
        </thead>
        <tbody>
    `;
    items.forEach(item => {
        output += `
            <tr>
                <td>${item.sku}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
            </tr>
        `;
    });
    output += `
        </tbody>
    </table>
    `;
    document.getElementById('manifest-content').innerHTML = output;
    document.getElementById('manifest-content').scrollIntoView({ behavior: 'smooth' });

    if (manifest.status.toLowerCase() === 'shipped') {
        const receiveButton = document.createElement('button');
        receiveButton.className = 'btn btn-primary w-25 float-end mt-3';
        receiveButton.textContent = 'Receive';
        receiveButton.addEventListener('click', () => {
            window.location.href = `receiving?manifestNumber=${encodeURIComponent(manifest.manifestNumber)}`;
        });
        document.getElementById('manifest-content').appendChild(receiveButton);
    }
};


const createManifestButton = async () => {
    const userRole = await getUserRole();
    if (userRole.toLowerCase() === 'admin') {
        const manifestButton = document.createElement('button');
        manifestButton.className = 'btn btn-primary p-0 rounded-circle';
        manifestButton.href = './create-manifest';
        manifestButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
        `;
        manifestButton.addEventListener('click', () => {
            window.location.href = './create-manifest';
        });
        document.getElementById('createButtonWrapper').appendChild(manifestButton);
    }
};

document.addEventListener('DOMContentLoaded', createManifestButton);