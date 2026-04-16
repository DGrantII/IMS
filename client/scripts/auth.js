async function loadUser() {
    const res = await fetch('/api/account/me', {
        credentials: 'include'
    });

    if (!res.ok) {
        console.log('Authentication failed');
        return { user: null, status: res.status };
    }

    const user = await res.json();
    return { user, status: res.status };
}

function showModal(title = 'Session Expired', message = 'Your session has expired. Please log in again.', redirectUrl = 'login.html') {

    const modalElement = document.getElementById('sessionExpiredModal');
    if (!modalElement || typeof bootstrap === 'undefined') {
        alert(message);
        window.location.href = redirectUrl;
        return;
    }

    modalElement.querySelector('.modal-body').textContent = message;
    modalElement.querySelector('.modal-title').textContent = title;
    const sessionModal = new bootstrap.Modal(modalElement);
    const okButton = modalElement.querySelector('#sessionExpiredModalOk');

    okButton.onclick = () => {
        sessionModal.hide();
    };

    modalElement.addEventListener('hidden.bs.modal', () => {
        window.location.href = redirectUrl;
    }, { once: true });

    sessionModal.show();
}

function handleAuthError(status, redirectUrl = 'login.html', message) {
    if (status === 401 && !message) {
        // User was never logged in, redirect directly
        window.location.href = redirectUrl;
    } else {
        // Session expired or API error, show modal
        const modalMessage = message || (status === 403 ? 'Your session has expired. Please log in again.' : 'Authentication error. Please log in again.');
        showModal(modalMessage, redirectUrl);
    }
}