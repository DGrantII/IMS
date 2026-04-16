// admin.js - Admin page initialization and event handlers

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    const result = await loadUser();

    // If not logged in, handle auth error
    if (!result.user) {
        handleAuthError(result.status, 'login.html');
        return;
    }

    // If not admin, show access denied message and redirect to index page
    if (result.user.role.toLowerCase() !== 'admin') {
        showModal('Access Denied', 'You do not have access to this page. Redirecting to home page.', 'index.html');
        return;
    }

    // If logged in and admin, proceed to load the page
    document.getElementById('user-info').textContent = `Hello, ${result.user.name}`;
});