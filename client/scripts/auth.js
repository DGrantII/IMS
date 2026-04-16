async function loadUser() {
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

function showModal(message = 'Your session has expired. Please log in again.', redirectUrl = 'login.html') {
    const modalElement = document.getElementById('sessionExpiredModal');
    if (!modalElement || typeof bootstrap === 'undefined') {
        alert(message);
        window.location.href = redirectUrl;
        return;
    }

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

function handleAuthError(message, redirectUrl) {
    showModal(message, redirectUrl);
}