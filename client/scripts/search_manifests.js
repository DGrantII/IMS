// Get form elements
const manifestNumber = document.getElementById('manifestNumber');
const trackingNumber = document.getElementById('trackingNumber');
const itemNumber = document.getElementById('itemNumberShipping');
const createDateStart = document.getElementById('createDateStart');
const createDateEnd = document.getElementById('createDateEnd');
const status = document.getElementById('status');

// Function to update disabled state of fields
const updateDisabled = () => {
    const hasManifestOrTracking = manifestNumber.value.trim() || trackingNumber.value.trim();
    const hasOther = itemNumber.value.trim() || createDateStart.value || createDateEnd.value || status.value;

    if (manifestNumber.value.trim()) {
        // Disable other fields when manifestNumber has value
        itemNumber.disabled = true;
        createDateStart.disabled = true;
        createDateEnd.disabled = true;
        status.disabled = true;
        manifestNumber.disabled = false;
        trackingNumber.disabled = true;
    } else if (trackingNumber.value.trim()) {
        // Disable other fields when trackingNumber has value
        itemNumber.disabled = true;
        createDateStart.disabled = true;
        createDateEnd.disabled = true;
        status.disabled = true;
        manifestNumber.disabled = true;
        trackingNumber.disabled = false;
    } else if (hasOther) {
        // Disable manifestNumber and trackingNumber when other fields have value
        manifestNumber.disabled = true;
        trackingNumber.disabled = true;
        itemNumber.disabled = false;
        createDateStart.disabled = false;
        createDateEnd.disabled = false;
        status.disabled = false;
    } else {
        // Enable all fields when no fields have value
        manifestNumber.disabled = false;
        trackingNumber.disabled = false;
        itemNumber.disabled = false;
        createDateStart.disabled = false;
        createDateEnd.disabled = false;
        status.disabled = false;
    }
}

// Add event listeners to update disabled state on input/change
manifestNumber.addEventListener('input', updateDisabled);
trackingNumber.addEventListener('input', updateDisabled);
itemNumber.addEventListener('input', updateDisabled);
createDateStart.addEventListener('input', updateDisabled);
createDateEnd.addEventListener('input', updateDisabled);
status.addEventListener('change', updateDisabled);

// Create a function to clear the search form
const clearForm = () => {
    manifestNumber.value = '';
    trackingNumber.value = '';
    itemNumber.value = '';
    createDateStart.value = '';
    createDateEnd.value = '';
    status.value = '';
    updateDisabled();
}

// Attach event listener to the clear button
const clearButton = document.getElementById('clearButton');
clearButton.addEventListener('click', clearForm);

// Function to update URL with search parameters
const updateURLWithSearchParams = (params) => {
    const url = new URL(window.location);
    url.search = ''; // Clear existing params
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        }
    });
    window.history.replaceState({}, '', url);
};

// Function to perform the search API request
const performManifestSearch = async (params) => {
    let queryParams = [];
    if (params.manifestNumber) queryParams.push(`manifestNumber=${encodeURIComponent(params.manifestNumber)}`);
    if (params.trackingNumber) queryParams.push(`trackingNumber=${encodeURIComponent(params.trackingNumber)}`);
    if (params.itemNumber) queryParams.push(`itemNumber=${encodeURIComponent(params.itemNumber)}`);
    if (params.createDateStart) queryParams.push(`createDateStart=${encodeURIComponent(params.createDateStart)}`);
    if (params.createDateEnd) queryParams.push(`createDateEnd=${encodeURIComponent(params.createDateEnd)}`);
    if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    try {
        // Make API call to search for manifests
        const response = await fetch(`/api/manifests/search-manifest${queryString}`, {
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

        // Handle case where no manifests are found
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
                    output += `<button type="button" class="list-group-item list-group-item-action" onclick='fetchManifestDetails("${manifest.manifestNumber}")'>
                        Manifest Number: ${manifest.manifestNumber}<br />
                        Create Date: ${new Date(manifest.createDate).toLocaleDateString()}<br />
                        Status: ${manifest.status}
                    </button>`;
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
};

// Function to load search parameters from URL and populate fields
const loadSearchParamsFromURL = async () => {
    const url = new URL(window.location);
    const manifestNumberParam = url.searchParams.get('manifestNumber');
    const trackingNumberParam = url.searchParams.get('trackingNumber');
    const itemNumberParam = url.searchParams.get('itemNumberShipping');
    const createDateStartParam = url.searchParams.get('createDateStart');
    const createDateEndParam = url.searchParams.get('createDateEnd');
    const statusParam = url.searchParams.get('status');

    if (manifestNumberParam || trackingNumberParam || itemNumberParam || createDateStartParam || createDateEndParam || statusParam) {
        if (manifestNumberParam) manifestNumber.value = manifestNumberParam;
        if (trackingNumberParam) trackingNumber.value = trackingNumberParam;
        if (itemNumberParam) itemNumber.value = itemNumberParam;
        if (createDateStartParam) createDateStart.value = createDateStartParam;
        if (createDateEndParam) createDateEnd.value = createDateEndParam;
        if (statusParam) status.value = statusParam;
        
        updateDisabled();
        
        // Automatically perform the search
        await performManifestSearch({
            manifestNumber: manifestNumberParam || '',
            trackingNumber: trackingNumberParam || '',
            itemNumber: itemNumberParam || '',
            createDateStart: createDateStartParam || '',
            createDateEnd: createDateEndParam || '',
            status: statusParam || ''
        });
    }
};

// Handle form submission
const manifestForm = document.querySelector('#manifestForm');
manifestForm.addEventListener('submit', async (e) => {

    // Clear any existing receive button
    const receiveBtnWrapper = document.getElementById('receiveBtnWrapper');
    receiveBtnWrapper.innerHTML = '';

    e.preventDefault();
    const manifestNumberValue = document.getElementById('manifestNumber').value.trim();
    const trackingNumberValue = document.getElementById('trackingNumber').value.trim();
    const itemNumberValue = document.getElementById('itemNumberShipping').value.trim();
    const createDateStartValue = document.getElementById('createDateStart').value;
    const createDateEndValue = document.getElementById('createDateEnd').value;
    const statusValue = document.getElementById('status').value;

    // Checking if at least one search parameter is provided
    if (!manifestNumberValue && !trackingNumberValue && !itemNumberValue && !createDateStartValue && !createDateEndValue && !statusValue) {
        alert('Please provide at least one search parameter.');
        return;
    }

    // Update URL with search parameters
    updateURLWithSearchParams({
        manifestNumber: manifestNumberValue,
        trackingNumber: trackingNumberValue,
        itemNumberShipping: itemNumberValue,
        createDateStart: createDateStartValue,
        createDateEnd: createDateEndValue,
        status: statusValue
    });
    
    // Perform the search
    await performManifestSearch({
        manifestNumber: manifestNumberValue,
        trackingNumber: trackingNumberValue,
        itemNumber: itemNumberValue,
        createDateStart: createDateStartValue,
        createDateEnd: createDateEndValue,
        status: statusValue
    });
});

// Function to fetch manifest details when a manifest is selected from the list
const fetchManifestDetails = async (manifestNumber) => {
    try {
        // Make API call to fetch manifest details
        const response = await fetch(`/api/manifests/search-manifest?manifestNumber=${encodeURIComponent(manifestNumber)}`, {
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
        populateManifestTable(data.manifests[0], data.items);
    } catch (error) {
        console.error('Error fetching manifest details:', error);
        alert('An error occurred while fetching manifest details. Please try again later.');
    }
};

// Function to populate manifest details and items in the table
const populateManifestTable = (manifest, items) => {
    // Build HTML output for manifest details and items
    let output = `
    <h3>Manifest Details</h3>
    <div class="table-responsive">
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
    </div>
    <h3>Items</h3>
    <table id="manifest-items-table" class="table table-striped">
        <thead>
            <tr>
                <th>SKU</th>
                <th>UPC</th>
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
                <td>${item.upc}</td>
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
        receiveButton.className = 'btn btn-primary w-100 mt-3';
        receiveButton.textContent = 'Receive';
        receiveButton.addEventListener('click', () => {
            window.location.href = `receiving?manifestNumber=${encodeURIComponent(manifest.manifestNumber)}`;
        });
        document.getElementById('receiveBtnWrapper').appendChild(receiveButton);
    }
};

// Function to create manifest button for admin users
const createManifestButton = async () => {
    const userRole = await getUserRole();
    if (userRole.toLowerCase() === 'admin') {
        const manifestButton = document.createElement('button');
        manifestButton.className = 'btn btn-primary p-2';
        manifestButton.href = './create-manifest';
        manifestButton.innerHTML = `
                        Create Manifest
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
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

document.addEventListener('DOMContentLoaded', async () => {
    await loadSearchParamsFromURL();
    createManifestButton();
});