// login.js - Login form event handler with hidden session expiration

const LOGIN_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
let loginExpired = false;
let loginExpirationTimer = null;

const disableLoginForm = () => {
    document.getElementById('employeeID').disabled = true;
    document.getElementById('password').disabled = true;
    document.querySelector('#loginForm button[type="submit"]').disabled = true;
}

const showSessionExpiredModal = () => {
    const modalElement = document.getElementById('sessionExpiredModal');
    if (!modalElement) {
        alert('Your login session has expired. Please refresh the page to try again.');
        return;
    }

    const sessionExpiredModal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });

    sessionExpiredModal.show();
    disableLoginForm();
}

const expireLoginSession = () => {
    loginExpired = true;
    showSessionExpiredModal();
}

const startLoginExpirationTimer = () => {
    if (loginExpirationTimer) {
        clearTimeout(loginExpirationTimer);
    }
    loginExpirationTimer = setTimeout(expireLoginSession, LOGIN_EXPIRATION_MS);
}

document.addEventListener('DOMContentLoaded', () => {
    startLoginExpirationTimer();

    document.getElementById('loginForm').addEventListener('submit', (event) => {
        event.preventDefault();

        if (loginExpired) {
            showSessionExpiredModal();
            return;
        }

        const employeeID = document.getElementById('employeeID').value;
        const password = document.getElementById('password').value;

        // Simple client-side validation
        if (employeeID && password) {
            fetch('/api/account/login', {
                method: 'POST',
                credentials: 'include', // Include cookies for session management
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employeeID, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/';
                } else {
                    alert('Invalid Employee ID or Password');
                }
            })
            .catch(error => console.error('Error:', error));
        } else {
            alert('Please enter both Employee ID and Password');
        }
    });
});