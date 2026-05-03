// privileged.js - Privileged page initialization and event handlers

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuthOnLoad();

    // If not logged in, show session expired modal and redirect to login page
    if (!user) {
        handleAuthError('Your session has expired due to inactivity. Please log in again.', 'login', 'Session Expired');
        return;
    }
    if (user.redirecting) return;

    // If not privileged or admin, show access denied message and redirect to index page
    if (user.role.toLowerCase() !== 'privileged' && user.role.toLowerCase() !== 'admin') {
        handleAuthError('You do not have access to this page. Redirecting to home page.', 'index', 'Access Denied');
        return;
    }

    // If logged in and privileged, proceed to load the page
    document.getElementById('user-info').textContent = `Hello, ${user.name}`;
});