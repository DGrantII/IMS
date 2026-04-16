// index.js - Main page initialization and event handlers

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    const user = await loadUser();
    if (!user) {
        handleAuthError('Your session has expired due to inactivity. Please log in again.', 'login.html');
        return;
    }
    // If logged in, proceed to load the page
    document.getElementById('user-info').textContent = `Hello, ${user.name}`;
});