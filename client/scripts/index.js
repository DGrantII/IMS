// index.js - Main page initialization and event handlers

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    const result = await loadUser();
    if (!result.user) {
        handleAuthError(result.status, 'login.html');
        return;
    }
    // If logged in, proceed to load the page
    document.getElementById('user-info').textContent = `Hello, ${result.user.name}`;
});