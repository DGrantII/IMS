// index.js - Main page initialization and event handlers

const renderList = (listId, items, buildHref, labelKey, access) => {
    const list = document.getElementById(listId);
    if (!items || items.length === 0) {
        list.innerHTML = '<li class="text-muted">None</li>';
        return;
    }
    list.innerHTML = items.map(item => {
        const label = item[labelKey];
        return access ? `<li><a href="${buildHref(label)}">${label}</a></li>` : `<li class="text-muted">${label}</li>`;
    }).join('');
};

const loadDashboard = async (user) => {
    try {
        const response = await fetch('/api/dashboard', { credentials: 'include' });

        if (response.status === 401 || response.status === 403) {
            handleAuthError('Your session has expired due to inactivity. Please log in again.', 'login', 'Session Expired');
            return;
        }

        const { agingManifests, suspendedAdjustments, monthlyShrink } = await response.json();

        renderList(
            'aging-manifests-list',
            agingManifests,
            mn => `./receiving?manifestNumber=${encodeURIComponent(mn)}`,
            'manifestNumber',
            true // all employees can see aging manifests
        );

        renderList(
            'suspended-adjustments-list',
            suspendedAdjustments,
            id => `./adjustment-details?adjustmentNumber=${encodeURIComponent(id)}`,
            'inventoryAdjustmentID',
            user && (user.role.toLowerCase() === 'privileged' || user.role.toLowerCase() === 'admin') // only privileged and admin can see suspended adjustments
        );

        const shrink = Number(monthlyShrink[0]?.monthlyShrink ?? 0);
        document.getElementById('monthly-shrink-value').textContent =
            `$${shrink.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    } catch (err) {
        console.error('Error loading dashboard:', err);
        ['aging-manifests-list', 'suspended-adjustments-list'].forEach(id => {
            document.getElementById(id).innerHTML = '<li class="text-danger">Error loading data</li>';
        });
        document.getElementById('monthly-shrink-value').textContent = 'Error';
    }
};

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    const user = await loadUser();
    if (!user) {
        handleAuthError('Your session has expired due to inactivity. Please log in again.', 'login', 'Session Expired');
        return;
    }
    document.getElementById('user-info').textContent = `Hello, ${user.name}`;
    await loadDashboard(user);
});