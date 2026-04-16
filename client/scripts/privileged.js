// privileged.js - Privileged page initialization and event handlers

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    const result = await loadUser();

    // If not logged in, handle auth error
    if (!result.user) {
        handleAuthError(result.status, 'login.html');
        return;
    }

    // If not privileged or admin, show access denied message and redirect to index page
    if (!result.user.privileged && !result.user.admin) {
        showModal('You do not have access to this page. Redirecting to home page.', 'index.html');
        return;
    }

    // If logged in and privileged, proceed to load the page
    document.getElementById('user-info').textContent = `Hello, ${result.user.name}`;
});