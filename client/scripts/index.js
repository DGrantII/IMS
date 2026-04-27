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