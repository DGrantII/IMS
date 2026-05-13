// Hide page content immediately to prevent flash of unauthenticated content
document.documentElement.style.visibility = 'hidden';

// Check authentication before loading the app
window.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuthOnLoad();
    console.log('Loaded user:', user);
    if (!user) {
        document.documentElement.style.visibility = 'visible';
        handleAuthError('Your session has expired due to inactivity. Please log in again.', 'login', 'Session Expired');
        return;
    }
    if (user.redirecting) return;
    document.documentElement.style.visibility = 'visible';
    document.getElementById('user-info').textContent = `Hello, ${user.name}`;
    document.getElementById('user-role').textContent = `Role: ${user.role}`;
    await loadDashboard(user);
});
