const loadUser = async () => {
    const res = await fetch('/api/account/me', {
        credentials: 'include'
    });

    if (!res.ok) {
        console.log('Not logged in');
        return null;
    }

    const user = await res.json();
    return user;
}

const showModal = (title = 'Session Expired', message = 'Your session has expired. Please log in again.', redirectUrl = 'login') => {
    const modalElement = document.getElementById('sessionExpiredModal');
    if (!modalElement || typeof bootstrap === 'undefined') {
        alert(message);
        window.location.href = redirectUrl;
        return;
    }

    modalElement.querySelector('.modal-title').textContent = title;
    modalElement.querySelector('.modal-body').textContent = message;
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

const handleAuthError = (message, redirectUrl, title = 'Session Expired') => {
    showModal(title, message, redirectUrl);
}