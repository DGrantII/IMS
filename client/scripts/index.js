// Hide page content immediately to prevent flash of unauthenticated content
document.documentElement.style.visibility = 'hidden';

// Check authentication before loading the app
window.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuthOnLoad();
    console.log('Loaded user:', user);
    if (!user) {
        handleAuthError('Your session has expired due to inactivity. Please log in again.', 'login', 'Session Expired');
        return;
    }
    if (user.redirecting) return;
    document.documentElement.style.visibility = '';
    document.getElementById('user-info').textContent = `Hello, ${user.name}`;
    await loadDashboard(user);
});
