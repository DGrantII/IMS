// nav.js - Dynamic navigation creation and active link setting
async function getUserRole() {
    try {
        const res = await fetch('/api/account/me', {
            credentials: 'include'
        });
        const data = await res.json();
        return data.role;
    } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
}

async function createNav() {
    const navItems = [
        { text: 'Home', href: './', page: 'index.html' },
        { text: 'Products', href: './products', page: 'products.html' },
        { text: 'Shipping', href: './shipping', page: 'shipping.html' },
        { text: 'Logout', href: '#', id: 'logoutBtn', icon: true }
    ];

    const userRole = await getUserRole();
    if (userRole.toLowerCase() === 'privileged' || userRole.toLowerCase() === 'admin') {
        navItems.splice(3, 0, { text: 'Inventory Adjustment', href: '#', page: '#' });
    }


    // Get current page filename
    const currentPath = window.location.pathname;
    let currentPage = currentPath.split('/').pop();
    if (currentPath === '/' || currentPage === '') {
        currentPage = 'index.html';
    }

    // Create nav element
    const nav = document.createElement('nav');
    nav.className = 'navbar';

    nav.innerHTML = `
        <div class="container-fluid">
            <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div class="offcanvas-body">
                    <ul class="navbar-nav justify-content-end flex-grow-1 pe-3">
                        ${navItems.map(item => {
                            const isActive = item.page === currentPage;
                            const activeClass = isActive ? ' active' : '';
                            const ariaCurrent = isActive ? ' aria-current="page"' : '';
                            const idAttr = item.id ? ` id="${item.id}"` : '';
                            const iconHtml = item.icon ? `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                                    <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                                </svg>
                            ` : '';
                            return `
                                <li class="nav-item">
                                    <a class="nav-link${activeClass}"${ariaCurrent}${idAttr} href="${item.href}">${item.text}${iconHtml}</a>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;

    // Insert nav into main element
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(nav, main.firstElementChild);
    }

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/account/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                window.location.href = 'login';
            } else {
                alert('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Logout failed');
        }
    });
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', createNav);