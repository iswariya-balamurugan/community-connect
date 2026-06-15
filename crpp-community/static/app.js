import { 
    renderLanding, renderAbout, renderAuth, renderProfile, 
    renderListings, renderBloodHub, renderDashboard 
} from './components.js';

class AppRouter {
    constructor() {
        this.routes = {
            '#/': renderLanding,
            '#/about': renderAbout,
            '#/auth': renderAuth,
            '#/profile': renderProfile,
            '#/listings': renderListings,
            '#/blood': renderBloodHub,
            '#/dashboard': renderDashboard
        };
        
        window.addEventListener('hashchange', () => this.handleRouting());
        // Handle normal link clicks with data-route or custom hrefs
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('#/')) {
                // Let hash change fire naturally
            } else if (link && link.dataset.route) {
                e.preventDefault();
                this.navigate(link.dataset.route);
            }
        });
    }

    navigate(path) {
        // Translate normal paths to hash routes
        if (!path.startsWith('#')) {
            path = '#' + (path.startsWith('/') ? path : '/' + path);
        }
        window.location.hash = path;
    }

    handleRouting() {
        const hash = window.location.hash || '#/';
        // Split path and query parameters
        const [path, queryString] = hash.split('?');
        const queryParams = {};
        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                queryParams[key] = decodeURIComponent(value);
            });
        }

        // Match base route
        const renderFunc = this.routes[path] || renderLanding;
        
        // Highlight active navbar link
        document.querySelectorAll('.nav-link').forEach(link => {
            const route = link.dataset.route;
            if (route && ('#' + route) === path) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Ensure authorization checks
        const user = window.appState.getCurrentUser();
        const protectedRoutes = ['#/dashboard', '#/profile'];
        
        if (protectedRoutes.includes(path) && !user) {
            this.navigate('/auth?tab=login');
            return;
        }

        // Render page
        const rootNode = document.getElementById('app-root');
        if (rootNode) {
            rootNode.innerHTML = ''; // Clear prior content
            renderFunc(rootNode, queryParams);
        }
    }
}

// Global App State Management
window.appState = {
    user: null,
    token: null,
    
    init() {
        this.token = localStorage.getItem('smartshare_token');
        const cachedUser = localStorage.getItem('smartshare_user');
        if (cachedUser) {
            try {
                this.user = JSON.parse(cachedUser);
            } catch (e) {
                this.logout();
            }
        }
        this.updateHeaderUI();
        this.checkDisasterStatus();
        
        if (this.token) {
            this.startNotificationPolling();
        }
    },
    
    login(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('smartshare_token', token);
        localStorage.setItem('smartshare_user', JSON.stringify(user));
        this.updateHeaderUI();
        this.startNotificationPolling();
        window.router.navigate('/dashboard');
    },
    
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('smartshare_token');
        localStorage.removeItem('smartshare_user');
        this.updateHeaderUI();
        this.stopNotificationPolling();
        document.getElementById('notif-badge').classList.add('hidden');
        window.router.navigate('/');
    },
    
    getCurrentUser() {
        return this.user;
    },
    
    getToken() {
        return this.token;
    },
    
    async fetchWithAuth(url, options = {}) {
        options.headers = options.headers || {};
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }
        if (options.body && typeof options.body === 'object') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                this.logout();
                throw new Error("Session expired. Please sign in again.");
            }
            return response;
        } catch (err) {
            console.error("Fetch API error:", err);
            throw err;
        }
    },
    
    updateHeaderUI() {
        const guestLinks = document.getElementById('auth-guest-links');
        const userMenu = document.getElementById('auth-user-menu');
        const navDashboard = document.getElementById('nav-dashboard');
        
        if (this.user) {
            guestLinks.classList.add('hidden');
            userMenu.classList.remove('hidden');
            navDashboard.classList.remove('hidden');
            
            // Set profile tags
            document.getElementById('user-display-name').textContent = this.user.username;
            
            // Format role label
            let roleLabel = this.user.role.toUpperCase();
            if (this.user.role === 'ngo') roleLabel = 'NGO Partner';
            document.getElementById('user-display-role').textContent = roleLabel;
            
            // Set avatar initials
            const initials = this.user.username.substring(0, 2).toUpperCase();
            document.getElementById('avatar-letters').textContent = initials;
        } else {
            guestLinks.classList.remove('hidden');
            userMenu.classList.add('hidden');
            navDashboard.classList.add('hidden');
        }
    },
    
    async checkDisasterStatus() {
        try {
            const res = await fetch('/api/disaster/campaigns');
            if (res.ok) {
                const campaigns = await res.json();
                const active = campaigns.find(c => c.status === 'active');
                const banner = document.getElementById('disaster-banner');
                const bannerText = document.getElementById('disaster-banner-text');
                
                if (active) {
                    bannerText.textContent = `EMERGENCY ALERT: ${active.title} - ${active.location}. Relief donations requested.`;
                    banner.classList.remove('hidden');
                } else {
                    banner.classList.add('hidden');
                }
            }
        } catch (e) {
            console.error("Failed to load disaster campaign state", e);
        }
    },
    
    startNotificationPolling() {
        this.pollNotifications();
        this.pollInterval = setInterval(() => this.pollNotifications(), 10000);
    },
    
    stopNotificationPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    },
    
    async pollNotifications() {
        try {
            const res = await this.fetchWithAuth('/api/notifications');
            if (res.ok) {
                const notifs = await res.json();
                const unread = notifs.filter(n => n.read === 0);
                const badge = document.getElementById('notif-badge');
                
                if (unread.length > 0) {
                    badge.textContent = unread.length;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
                
                // Draw notifications into side list drawer
                const container = document.getElementById('notif-drawer-list');
                if (notifs.length === 0) {
                    container.innerHTML = '<div class="notif-empty">No notifications</div>';
                    return;
                }
                
                container.innerHTML = notifs.map(n => `
                    <div class="notif-item ${n.read === 0 ? 'unread' : ''}">
                        <h5><i class="fa-solid ${n.type === 'blood' ? 'fa-heart-pulse text-danger' : n.type === 'delivery' ? 'fa-truck text-blue' : 'fa-info-circle text-primary'}"></i> ${n.type.toUpperCase()}</h5>
                        <p>${n.message}</p>
                        <span>${new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                `).join('');
            }
        } catch (e) {
            console.error("Notification fetching error", e);
        }
    }
};

// Global Loading Mask controller
window.loadingMask = {
    show(message = "Processing...") {
        const mask = document.getElementById('global-loading-mask');
        const text = mask.querySelector('p');
        text.textContent = message;
        mask.classList.remove('hidden');
    },
    hide() {
        document.getElementById('global-loading-mask').classList.add('hidden');
    }
};

// Initialize Application routing
document.addEventListener('DOMContentLoaded', () => {
    // Setup Navigation Menu toggles
    const dropdownBtn = document.getElementById('profile-dropdown-btn');
    const dropdownMenu = document.getElementById('profile-dropdown-menu');
    
    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });
    }
    
    document.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
    });
    
    // Notification Panel Toggles
    const bell = document.getElementById('notif-bell');
    const drawer = document.getElementById('notif-drawer-panel');
    const closeBtn = document.getElementById('close-notif-drawer-btn');
    const overlay = document.getElementById('drawer-overlay-bg');
    
    if (bell) {
        bell.addEventListener('click', () => {
            drawer.classList.add('open');
            overlay.classList.remove('hidden');
        });
    }
    
    const closeDrawer = () => {
        drawer.classList.remove('open');
        overlay.classList.add('hidden');
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
    
    // Mark notifications as read action
    const markReadBtn = document.getElementById('mark-all-read-btn');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', async () => {
            const res = await window.appState.fetchWithAuth('/api/notifications/read', { method: 'POST' });
            if (res.ok) {
                window.appState.pollNotifications();
            }
        });
    }
    
    // Mobile navigation bar toggle
    const toggleBtn = document.getElementById('menu-toggle-btn');
    const navBar = document.getElementById('main-nav-bar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            navBar.classList.toggle('open');
        });
    }
    
    // Logout Action
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.appState.logout();
        });
    }

    // Startup routing hooks
    window.router = new AppRouter();
    window.appState.init();
    window.router.handleRouting();
});
