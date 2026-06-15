// ==========================================
// SPA Component Library
// ==========================================

// Helper: Formats dates cleanly
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// ------------------------------------------
// 1. LANDING PAGE VIEW
// ------------------------------------------
export async function renderLanding(container) {
    container.innerHTML = `
        <section class="hero-section">
            <div class="hero-content">
                <div class="hero-tag"><i class="fa-solid fa-leaf"></i> Zero Waste redistribution</div>
                <h2>Redistributing Surplus for a Stronger Community</h2>
                <p>SmartShare is an AI-powered smart logistics platform connecting surplus food, groceries, clothes, and medical resources with verified shelters and NGOs.</p>
                <div class="hero-actions">
                    <button class="btn btn-primary" onclick="window.router.navigate('/dashboard')"><i class="fa-solid fa-hand-holding-heart"></i> Donate Now</button>
                    <button class="btn btn-secondary" onclick="window.router.navigate('/listings')"><i class="fa-solid fa-boxes-stacked"></i> Browse Marketplace</button>
                </div>
            </div>
            <div class="hero-image">
                <div class="hero-image-container">
                    <i class="fa-solid fa-hands-holding-child hero-icon-overlay"></i>
                </div>
            </div>
        </section>

        <section class="stats-section">
            <div class="stats-heading">
                <span class="hero-tag" style="background-color:rgba(59, 130, 246, 0.08); border-color:rgba(59, 130, 246, 0.2); color:var(--secondary-blue);">Real-Time Platform Impact</span>
                <h3 style="font-size:32px; margin-top:10px;">Our Cumulative Community Contributions</h3>
            </div>
            
            <div class="stats-grid" id="analytics-stats-grid">
                <div class="glass-card stat-card">
                    <i class="fa-solid fa-bowl-food text-primary"></i>
                    <h3 id="stat-meals">...</h3>
                    <p>Meals Saved</p>
                </div>
                <div class="glass-card stat-card">
                    <i class="fa-solid fa-shirt" style="color: #8B5CF6;"></i>
                    <h3 id="stat-clothes">...</h3>
                    <p>Clothes Distributed</p>
                </div>
                <div class="glass-card stat-card">
                    <i class="fa-solid fa-kit-medical text-warning"></i>
                    <h3 id="stat-medicines">...</h3>
                    <p>Medicine Units Distributed</p>
                </div>
                <div class="glass-card stat-card">
                    <i class="fa-solid fa-droplet text-danger"></i>
                    <h3 id="stat-blood">...</h3>
                    <p>Blood Requests Met</p>
                </div>
                <div class="glass-card stat-card">
                    <i class="fa-solid fa-leaf text-success"></i>
                    <h3 id="stat-co2">... kg</h3>
                    <p>CO2 Emissions Avoided</p>
                </div>
            </div>
        </section>

        <section class="info-sections grid-3">
            <div class="glass-card">
                <h4 class="section-title"><i class="fa-solid fa-bolt"></i> Smart AI Assignment</h4>
                <p>Our matching engine automatically links donations with the nearest verified NGO and assigns optimal routes to active volunteers, minimizing pickup lag and carbon footprint.</p>
            </div>
            <div class="glass-card">
                <h4 class="section-title"><i class="fa-solid fa-circle-check"></i> Verified NGOs Only</h4>
                <p>We ensure all participating shelters and NGOs are vetted and verified by admins. This maintains safety protocols and guarantees that resources reach those truly in need.</p>
            </div>
            <div class="glass-card">
                <h4 class="section-title"><i class="fa-solid fa-award"></i> Volunteer Rewards</h4>
                <p>Volunteers earn reward points for every successful pickup and delivery, redeemable for green energy tokens, fuel vouchers, and platform achievement badges.</p>
            </div>
        </section>
    `;

    // Fetch and bind stats
    try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('stat-meals').textContent = data.mealsSaved;
            document.getElementById('stat-clothes').textContent = data.clothesDistributed;
            document.getElementById('stat-medicines').textContent = data.medicinesDistributed;
            document.getElementById('stat-blood').textContent = data.bloodRequestsFulfilled;
            document.getElementById('stat-co2').textContent = data.co2EmissionsReduced + " kg";
        }
    } catch (e) {
        console.error("Failed to load statistics feed", e);
    }
}

// ------------------------------------------
// 2. ABOUT US VIEW
// ------------------------------------------
export function renderAbout(container) {
    container.innerHTML = `
        <div class="glass-card" style="max-width: 800px; margin: 0 auto; padding: 40px;">
            <span class="hero-tag"><i class="fa-solid fa-heart"></i> About Our Mission</span>
            <h2 style="font-size:36px; margin: 15px 0 20px;">Smart Community Resource Redistribution</h2>
            <p style="font-size:16px; margin-bottom: 20px;">The Smart Community Resource Redistribution Platform was built to tackle resource inequality, combat localized scarcity, and reduce environmental landfill waste.</p>
            
            <h3 class="section-title" style="margin-top:30px;"><i class="fa-solid fa-shield-halved"></i> Security & NGO Verification</h3>
            <p style="margin-bottom: 20px;">Every NGO joining our platform must submit a license and regulatory verification ID. Admins vet all applicants manually to ensure complete trust before they can view and claim surplus resources.</p>
            
            <h3 class="section-title"><i class="fa-solid fa-seedling"></i> Environmental Footprint Tracking</h3>
            <p style="margin-bottom: 20px;">Our AI analytics engine computes the carbon emissions saved by preventing resource decay and food waste. Donors receive an "Eco Impact Score" dynamically on their profile based on these indicators, promoting corporate sustainability reports (CSR).</p>
            
            <h3 class="section-title"><i class="fa-solid fa-hands-holding"></i> Contact Community Support</h3>
            <p>For support, API integration requests, or sponsorship queries, contact us at: <a href="mailto:support@smartshare.org" style="color:var(--primary-green);">support@smartshare.org</a></p>
        </div>
    `;
}

// ------------------------------------------
// 3. AUTHENTICATION (LOGIN/REGISTER) VIEW
// ------------------------------------------
export function renderAuth(container, queryParams) {
    const activeTab = queryParams.tab || 'login';
    
    container.innerHTML = `
        <div class="glass-card auth-card">
            <div class="auth-tabs">
                <button class="auth-tab ${activeTab === 'login' ? 'active' : ''}" id="tab-login-btn">Sign In</button>
                <button class="auth-tab ${activeTab === 'register' ? 'active' : ''}" id="tab-register-btn">Register</button>
            </div>
            
            <!-- Login Form -->
            <form id="login-form" class="${activeTab === 'login' ? '' : 'hidden'}">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="login-username" placeholder="Enter username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" placeholder="Enter password" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px;">Sign In</button>
            </form>
            
            <!-- Registration Form -->
            <form id="register-form" class="${activeTab === 'register' ? '' : 'hidden'}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="reg-username" placeholder="Pick a username" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="reg-email" placeholder="email@address.com" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="reg-password" placeholder="Min 6 characters" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="reg-role" required>
                            <option value="donor">Donor (Individual / CSR)</option>
                            <option value="ngo">NGO Shelter / Partner</option>
                            <option value="volunteer">Volunteer Driver</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="reg-phone" placeholder="123-456-7890" required>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" id="reg-address" placeholder="123, Street name, City" required>
                </div>
                
                <!-- Simulated Lat/Lng Picker -->
                <div class="form-row">
                    <div class="form-group">
                        <label>Latitude (Coordinates)</label>
                        <input type="number" step="any" id="reg-lat" value="12.9716" required>
                    </div>
                    <div class="form-group">
                        <label>Longitude (Coordinates)</label>
                        <input type="number" step="any" id="reg-lng" value="77.5946" required>
                    </div>
                </div>
                <span class="btn-text" id="auto-coords-btn" style="cursor:pointer; font-size:11px; margin-bottom:12px; display:inline-block;"><i class="fa-solid fa-location-crosshairs"></i> Set coordinates for Indiranagar Hub</span>
                
                <!-- NGO Specific Fields -->
                <div id="ngo-fields" class="hidden">
                    <hr style="border-color:var(--border-color); margin: 20px 0;">
                    <div class="form-group">
                        <label>Organization Legal Name</label>
                        <input type="text" id="ngo-name" placeholder="Hope Foundation NGO">
                    </div>
                    <div class="form-group">
                        <label>NGO Regulatory ID / License Number</label>
                        <input type="text" id="ngo-license" placeholder="LIC-99371">
                    </div>
                    <div class="form-group">
                        <label>Specializations</label>
                        <input type="text" id="ngo-specs" placeholder="Food redistribution, medical items">
                    </div>
                </div>
                
                <!-- Volunteer Specific Fields -->
                <div id="volunteer-fields" class="hidden">
                    <hr style="border-color:var(--border-color); margin: 20px 0;">
                    <div class="form-group">
                        <label>Vehicle Type</label>
                        <select id="vol-vehicle">
                            <option value="bicycle">Bicycle (Eco Friendly)</option>
                            <option value="motorcycle">Motorcycle (Fast Courier)</option>
                            <option value="car">Car / Sedan</option>
                            <option value="van">Cargo Van (Bulk items)</option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:20px;">Register Account</button>
            </form>
        </div>
    `;

    // Bind tab clicks
    const tabLogin = document.getElementById('tab-login-btn');
    const tabReg = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const roleSelect = document.getElementById('reg-role');
    const ngoFields = document.getElementById('ngo-fields');
    const volFields = document.getElementById('volunteer-fields');
    
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        window.router.navigate('/auth?tab=login');
    });
    
    tabReg.addEventListener('click', () => {
        tabReg.classList.add('active');
        tabLogin.classList.remove('active');
        regForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        window.router.navigate('/auth?tab=register');
    });

    // Dynamic role fields
    roleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'ngo') {
            ngoFields.classList.remove('hidden');
            volFields.classList.add('hidden');
        } else if (val === 'volunteer') {
            volFields.classList.remove('hidden');
            ngoFields.classList.add('hidden');
        } else {
            ngoFields.classList.add('hidden');
            volFields.classList.add('hidden');
        }
    });

    // Simulated coordinate autofill
    document.getElementById('auto-coords-btn').addEventListener('click', () => {
        // Indiranagar Coordinates
        document.getElementById('reg-lat').value = "12.9784";
        document.getElementById('reg-lng').value = "77.6408";
    });

    // Login Form Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.loadingMask.show("Signing in...");
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            window.loadingMask.hide();
            if (res.ok) {
                window.appState.login(data.token, data.user);
            } else {
                alert(data.error || "Authentication failed");
            }
        } catch (err) {
            window.loadingMask.hide();
            alert("Error connecting to server");
        }
    });

    // Register Form Submit
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.loadingMask.show("Registering your profile...");
        
        const payload = {
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            role: roleSelect.value,
            phone: document.getElementById('reg-phone').value,
            address: document.getElementById('reg-address').value,
            lat: document.getElementById('reg-lat').value,
            lng: document.getElementById('reg-lng').value
        };
        
        if (payload.role === 'ngo') {
            payload.organization_name = document.getElementById('ngo-name').value;
            payload.license_number = document.getElementById('ngo-license').value;
            payload.specializations = document.getElementById('ngo-specs').value;
        } else if (payload.role === 'volunteer') {
            payload.vehicle_type = document.getElementById('vol-vehicle').value;
        }
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            window.loadingMask.hide();
            if (res.ok) {
                alert("Account created successfully!");
                window.appState.login(data.token, data.user);
            } else {
                alert(data.error || "Registration failed");
            }
        } catch (err) {
            window.loadingMask.hide();
            alert("Error registering account");
        }
    });
}

// ------------------------------------------
// 4. PROFILE VIEW
// ------------------------------------------
export async function renderProfile(container) {
    window.loadingMask.show("Fetching profile details...");
    try {
        const res = await window.appState.fetchWithAuth('/api/profile');
        const user = await res.json();
        window.loadingMask.hide();
        
        let roleName = user.role.toUpperCase();
        if (user.role === 'ngo') roleName = "NGO partner";
        
        container.innerHTML = `
            <div class="glass-card" style="max-width:700px; margin: 0 auto;">
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:30px;">
                    <div class="avatar-circle" style="width:64px; height:64px; font-size:24px;">
                        ${user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2>${user.username}</h2>
                        <span class="role-tag" style="font-size:12px !important;">${roleName}</span>
                    </div>
                </div>
                
                <div class="grid-3" style="margin-bottom:30px;">
                    <div class="glass-card" style="text-align:center; padding:15px; border-color:var(--primary-green);">
                        <i class="fa-solid fa-star text-success" style="font-size:24px; margin-bottom:8px;"></i>
                        <strong>${user.reward_points}</strong>
                        <span>Reward Points</span>
                    </div>
                    <div class="glass-card" style="text-align:center; padding:15px; border-color:var(--secondary-blue);">
                        <i class="fa-solid fa-leaf text-blue" style="font-size:24px; margin-bottom:8px;"></i>
                        <strong>${user.impact_score}</strong>
                        <span>Impact Score</span>
                    </div>
                    <div class="glass-card" style="text-align:center; padding:15px;">
                        <i class="fa-solid fa-calendar" style="font-size:24px; margin-bottom:8px; color:var(--text-secondary);"></i>
                        <strong>${formatDate(user.created_at)}</strong>
                        <span>Member Since</span>
                    </div>
                </div>
                
                <form id="profile-edit-form">
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" value="${user.email}" disabled style="opacity:0.5;">
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="text" id="prof-phone" value="${user.phone || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Delivery Address</label>
                        <input type="text" id="prof-address" value="${user.address || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Latitude</label>
                            <input type="number" step="any" id="prof-lat" value="${user.lat || 12.9716}" required>
                        </div>
                        <div class="form-group">
                            <label>Longitude</label>
                            <input type="number" step="any" id="prof-lng" value="${user.lng || 77.5946}" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; margin-top:20px;">Save Profile Settings</button>
                </form>
            </div>
        `;
        
        document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            window.loadingMask.show("Updating profile details...");
            
            const payload = {
                phone: document.getElementById('prof-phone').value,
                address: document.getElementById('prof-address').value,
                lat: document.getElementById('prof-lat').value,
                lng: document.getElementById('prof-lng').value
            };
            
            try {
                const up = await window.appState.fetchWithAuth('/api/profile', {
                    method: 'PUT',
                    body: payload
                });
                window.loadingMask.hide();
                if (up.ok) {
                    alert("Profile updated successfully!");
                    // Update user credentials cached in state
                    const curUser = window.appState.getCurrentUser();
                    Object.assign(curUser, payload);
                    localStorage.setItem('smartshare_user', JSON.stringify(curUser));
                    window.appState.updateHeaderUI();
                } else {
                    alert("Failed to save changes.");
                }
            } catch (err) {
                window.loadingMask.hide();
                alert("Error calling server updates");
            }
        });
        
    } catch (e) {
        window.loadingMask.hide();
        container.innerHTML = `<div class="glass-card">Error rendering profile settings: ${e.message}</div>`;
    }
}

// ------------------------------------------
// 5. RESOURCE LISTING / MARKETPLACE VIEW
// ------------------------------------------
export async function renderListings(container) {
    container.innerHTML = `
        <div class="filter-bar">
            <h3>Redistribution Marketplace</h3>
            <div class="filter-group">
                <select id="filter-category">
                    <option value="">All Categories</option>
                    <option value="Food">Food Donations</option>
                    <option value="Grocery">Groceries</option>
                    <option value="Clothes">Clothing</option>
                    <option value="Medicine">Medicines</option>
                </select>
                <select id="filter-status">
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="matched">Matched (Assigned)</option>
                    <option value="picked_up">Picked Up (In Transit)</option>
                    <option value="delivered">Delivered</option>
                </select>
            </div>
        </div>
        
        <div class="grid-3" id="listings-grid">
            <div class="glass-card" style="grid-column: 1/-1; text-align:center;">Loading listings...</div>
        </div>

        <!-- Detail Modal Container (Appends dynamically on card click) -->
        <div id="listing-modal" class="hidden"></div>
    `;

    const catSelect = document.getElementById('filter-category');
    const statusSelect = document.getElementById('filter-status');
    const grid = document.getElementById('listings-grid');
    
    async function loadListings() {
        const cat = catSelect.value;
        const stat = statusSelect.value;
        let url = `/api/donations`;
        const params = [];
        if (cat) params.push(`category=${cat}`);
        if (stat) params.push(`status=${stat}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.length === 0) {
                grid.innerHTML = `<div class="glass-card" style="grid-column:1/-1; text-align:center; padding:40px;">No matching resource listings found. Try adjusting filters.</div>`;
                return;
            }
            
            grid.innerHTML = data.map(item => {
                // Mock graphics or direct URL
                const catClass = `badge-${item.category.toLowerCase()}`;
                return `
                    <div class="glass-card item-card" style="padding:0; cursor:pointer;" data-id="${item.id}">
                        <div class="card-image-placeholder">
                            <span class="card-category-badge ${catClass}">${item.category}</span>
                            <i class="fa-solid ${item.category === 'Food' ? 'fa-bowl-food' : item.category === 'Grocery' ? 'fa-basket-shopping' : item.category === 'Clothes' ? 'fa-shirt' : 'fa-prescription-bottle-medical'}"></i>
                        </div>
                        <div class="item-card-body">
                            <h4>${item.title}</h4>
                            <div class="item-meta-row">
                                <span><i class="fa-solid fa-scale-balanced"></i> Qty: ${item.quantity}</span>
                                <span><i class="fa-solid fa-hourglass-half"></i> Exp: ${item.expiry_date || 'N/A'}</span>
                            </div>
                            <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:12px;"><i class="fa-solid fa-location-dot"></i> ${item.location_name}</p>
                            <div class="item-card-footer">
                                <span class="status-badge status-${item.status}">${item.status.replace('_', ' ')}</span>
                                <span class="btn-text">Inspect details <i class="fa-solid fa-arrow-right"></i></span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click event for modal details
            grid.querySelectorAll('.item-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.dataset.id;
                    openListingModal(id);
                });
            });
            
        } catch (e) {
            grid.innerHTML = `<div class="glass-card" style="grid-column:1/-1; text-align:center; color:var(--alert-danger);">Error fetching resource list.</div>`;
        }
    }

    catSelect.addEventListener('change', loadListings);
    statusSelect.addEventListener('change', loadListings);
    loadListings();
}

// Listing Detail Modal Dialog
async function openListingModal(donationId) {
    const modal = document.getElementById('listing-modal');
    window.loadingMask.show("Fetching donation tracking data...");
    
    try {
        const res = await fetch(`/api/donations/${donationId}`);
        const item = await res.json();
        window.loadingMask.hide();
        
        modal.className = "notif-drawer open";
        modal.style.width = "480px";
        modal.style.right = "0";
        modal.style.backgroundColor = "#0A0F1D";
        
        // Define steps states
        const stepAvail = 'completed';
        const stepMatched = (item.status === 'matched' || item.status === 'picked_up' || item.status === 'delivered') ? 'completed' : '';
        const stepPicked = (item.status === 'picked_up' || item.status === 'delivered') ? 'completed' : '';
        const stepDelivered = (item.status === 'delivered') ? 'completed' : '';
        
        modal.innerHTML = `
            <div class="drawer-header">
                <h3><i class="fa-solid fa-box-open"></i> Resource Tracking</h3>
                <button class="close-drawer-btn" id="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="drawer-content" style="padding: 24px;">
                <div class="status-badge status-${item.status}" style="display:inline-block; margin-bottom:16px;">
                    ${item.status.replace('_', ' ')}
                </div>
                <h2 style="margin-bottom:8px;">${item.title}</h2>
                <p style="color:var(--text-secondary); margin-bottom:20px;">Category: <strong>${item.category}</strong> | Quantity: <strong>${item.quantity}</strong></p>
                
                <h4 class="section-title"><i class="fa-solid fa-road"></i> Delivery Timeline</h4>
                <div class="status-steps">
                    <div class="step-node ${stepAvail}">
                        <div class="step-circle">1</div>
                        <div class="step-label">Posted</div>
                    </div>
                    <div class="step-node ${stepMatched}">
                        <div class="step-circle">2</div>
                        <div class="step-label">Matched</div>
                    </div>
                    <div class="step-node ${stepPicked}">
                        <div class="step-circle">3</div>
                        <div class="step-label">Transit</div>
                    </div>
                    <div class="step-node ${stepDelivered}">
                        <div class="step-circle">4</div>
                        <div class="step-label">Delivered</div>
                    </div>
                </div>

                <div class="glass-card" style="padding:16px; margin: 24px 0 20px; background:rgba(255,255,255,0.02)">
                    <p style="font-size:13px; margin-bottom:8px;"><i class="fa-solid fa-user"></i> Donor: <strong>${item.donor_name}</strong> (${item.donor_phone || 'N/A'})</p>
                    <p style="font-size:13px; margin-bottom:8px;"><i class="fa-solid fa-house-chimney"></i> NGO Shelter: <strong>${item.ngo_name || 'Searching...'}</strong></p>
                    <p style="font-size:13px; margin-bottom:8px;"><i class="fa-solid fa-motorcycle"></i> Courier Assigned: <strong>${item.volunteer_name || 'Searching...'}</strong></p>
                    <p style="font-size:13px;"><i class="fa-solid fa-hourglass-half"></i> Expiry: <strong>${formatDate(item.expiry_date)}</strong></p>
                </div>

                <div class="form-group">
                    <label>Pickup Location</label>
                    <input type="text" value="${item.location_name}" disabled style="font-size:12px;">
                </div>

                <!-- Leaflet Details Map Container -->
                <h4 class="section-title" style="margin-top:20px;"><i class="fa-solid fa-map-location-dot"></i> Routing Coordinates</h4>
                <div id="modal-map" style="height: 200px; border-radius:var(--radius-md); border:1px solid var(--border-color); overflow:hidden;"></div>
            </div>
        `;
        
        // Setup Close Modal click
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            modal.className = "hidden";
        });

        // Initialize modal Leaflet Map
        setTimeout(() => {
            const map = L.map('modal-map', { zoomControl: false }).setView([item.lat, item.lng], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            L.marker([item.lat, item.lng]).addTo(map).bindPopup("Donation Source").openPopup();
            
            // Mark NGO Dropoff location if coordinates exist
            if (item.ngo_username) {
                // Approximate coordinate offset for NGO to render path
                const ngo_lat = item.lat + 0.015;
                const ngo_lng = item.lng - 0.012;
                L.marker([ngo_lat, ngo_lng]).addTo(map).bindPopup("Destination Shelter");
                
                // Draw route line
                L.polyline([[item.lat, item.lng], [item.lat + 0.007, item.lng - 0.006], [ngo_lat, ngo_lng]], {color: '#10B981', weight: 4}).addTo(map);
            }
        }, 150);

    } catch (e) {
        window.loadingMask.hide();
        alert("Failed to render donation listing details modal panel: " + e.message);
    }
}

// ------------------------------------------
// 6. BLOOD DONATION MODULE VIEW
// ------------------------------------------
export async function renderBloodHub(container) {
    container.innerHTML = `
        <div class="dashboard-grid">
            <div>
                <div class="glass-card" style="margin-bottom:30px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 class="section-title" style="margin:0;"><i class="fa-solid fa-droplet text-danger"></i> Emergency Blood Requests</h3>
                        <button class="btn btn-primary btn-small" id="open-blood-form-btn"><i class="fa-solid fa-plus"></i> Request Blood</button>
                    </div>

                    <div style="display:flex; gap:12px; margin-bottom:20px;">
                        <select id="blood-group-filter" style="flex:1;">
                            <option value="">Filter by Blood Group (All)</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>

                    <div id="blood-requests-list" style="display:flex; flex-direction:column; gap:16px;">
                        <!-- Dynamic Lists -->
                        <div class="glass-card" style="text-align:center;">Querying blood hub database...</div>
                    </div>
                </div>
            </div>

            <div>
                <!-- Right Side: Nearest Donor matching -->
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-map-location-dot text-primary"></i> Nearby Donor Matching Map</h3>
                    <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">Matched donors receive emergency system notification broadcasts instantly.</p>
                    
                    <div id="blood-matching-map" style="height: 320px; border-radius:var(--radius-md); border:1px solid var(--border-color); overflow:hidden;"></div>
                </div>

                <!-- Emergency Submit Form Modal -->
                <div class="glass-card hidden" id="blood-request-form-card" style="margin-top:20px;">
                    <h3 class="section-title"><i class="fa-solid fa-circle-exclamation text-danger"></i> Create Blood Request</h3>
                    <form id="blood-submit-form">
                        <div class="form-group">
                            <label>Patient Full Name</label>
                            <input type="text" id="br-patient" placeholder="e.g. Robert Martin" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Required Blood Group</label>
                                <select id="br-group" required>
                                    <option value="O+">O+ (Positive)</option>
                                    <option value="O-">O- (Negative)</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Units Needed</label>
                                <input type="number" id="br-units" value="2" min="1" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Hospital Location / Details</label>
                            <input type="text" id="br-hospital" placeholder="City General Hospital Wing B" required>
                        </div>
                        <button type="submit" class="btn btn-danger" style="width:100%; margin-top:10px;"><i class="fa-solid fa-satellite-dish"></i> Broadcast Emergency Alert</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    const formCard = document.getElementById('blood-request-form-card');
    const openFormBtn = document.getElementById('open-blood-form-btn');
    const bloodFilter = document.getElementById('blood-group-filter');
    const requestList = document.getElementById('blood-requests-list');
    
    // Toggle submit form
    openFormBtn.addEventListener('click', () => {
        const user = window.appState.getCurrentUser();
        if (!user) {
            window.router.navigate('/auth?tab=login');
            return;
        }
        formCard.classList.toggle('hidden');
    });

    async function loadBloodRequests() {
        try {
            const res = await fetch('/api/blood-requests');
            const data = await res.json();
            const filterVal = bloodFilter.value;
            
            const filtered = filterVal ? data.filter(r => r.blood_group === filterVal) : data;
            
            if (filtered.length === 0) {
                requestList.innerHTML = `<div class="glass-card" style="text-align:center; padding:30px;">No active emergency blood requests.</div>`;
                return;
            }
            
            requestList.innerHTML = filtered.map(req => `
                <div class="glass-card" style="border-left: 4px solid var(--alert-danger); padding:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="color:var(--alert-danger); font-size:18px;"><i class="fa-solid fa-droplet"></i> ${req.blood_group} Required</h4>
                        <span class="status-badge" style="background-color:rgba(239, 68, 68, 0.1); color:var(--alert-danger); font-weight:700;">URGENT</span>
                    </div>
                    <p style="font-size:13.5px; margin-bottom:4px;">Patient: <strong>${req.patient_name}</strong> | Units needed: <strong>${req.units_needed}</strong></p>
                    <p style="font-size:13px; color:var(--text-secondary);"><i class="fa-solid fa-hospital"></i> Hospital: ${req.hospital_name}</p>
                    <span style="font-size:11px; color:var(--text-muted); display:block; margin-top:8px;">Requested: ${formatDate(req.created_at)}</span>
                </div>
            `).join('');
            
        } catch (e) {
            requestList.innerHTML = `<div class="glass-card" style="text-align:center; color:var(--alert-danger);">Error fetching blood database records.</div>`;
        }
    }

    // Blood Request Submit form handler
    document.getElementById('blood-submit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        window.loadingMask.show("Broadcasting emergency alerts...");
        
        const payload = {
            patient_name: document.getElementById('br-patient').value,
            blood_group: document.getElementById('br-group').value,
            units_needed: document.getElementById('br-units').value,
            hospital_name: document.getElementById('br-hospital').value
        };
        
        try {
            const res = await window.appState.fetchWithAuth('/api/blood-requests', {
                method: 'POST',
                body: payload
            });
            window.loadingMask.hide();
            if (res.ok) {
                alert("Emergency Blood request broadcasted to all matching donors nearby!");
                formCard.classList.add('hidden');
                loadBloodRequests();
            } else {
                alert("Failed to submit request.");
            }
        } catch (err) {
            window.loadingMask.hide();
            alert("Error sending emergency details");
        }
    });

    // Initialize Leaflet matching map
    setTimeout(() => {
        const map = L.map('blood-matching-map', { zoomControl: false }).setView([12.9716, 77.5946], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Add dummy donor marker indicators
        L.marker([12.9784, 77.6408]).addTo(map).bindPopup("Verified Donor: NGO Center O+ Available");
        L.marker([12.9307, 77.5801]).addTo(map).bindPopup("Volunteer Donor Match: AB- Available");
        L.marker([12.9105, 77.6450]).addTo(map).bindPopup("Volunteer Donor Match: O- Available");
    }, 150);

    bloodFilter.addEventListener('change', loadBloodRequests);
    loadBloodRequests();
}

// ------------------------------------------
// 7. DYNAMIC ROLE DASHBOARD VIEW
// ------------------------------------------
export function renderDashboard(container) {
    const user = window.appState.getCurrentUser();
    if (!user) {
        window.router.navigate('/auth?tab=login');
        return;
    }
    
    if (user.role === 'donor') {
        renderDonorDashboard(container, user);
    } else if (user.role === 'ngo') {
        renderNgoDashboard(container, user);
    } else if (user.role === 'volunteer') {
        renderVolunteerDashboard(container, user);
    } else if (user.role === 'admin') {
        renderAdminDashboard(container, user);
    }
}

// 7A. DONOR DASHBOARD VIEW
async function renderDonorDashboard(container, user) {
    container.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h2>Welcome, ${user.username}!</h2>
                <p>Support your community by listing your surplus resources below.</p>
            </div>
            <div class="dashboard-actions">
                <span class="hero-tag" style="margin:0;"><i class="fa-solid fa-leaf text-success"></i> Score: ${user.impact_score}</span>
                <span class="hero-tag" style="margin:0; background-color:rgba(59,130,246,0.08); color:var(--secondary-blue); border-color:rgba(59,130,246,0.2)"><i class="fa-solid fa-star text-blue"></i> Points: ${user.reward_points}</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Left Side: Create Donation & History -->
            <div>
                <!-- Create Donation Form -->
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-hand-holding-heart"></i> Create Resource Donation Listing</h3>
                    <form id="donation-submit-form">
                        <div class="form-group">
                            <label>Resource Title</label>
                            <input type="text" id="don-title" placeholder="e.g. 15 Fresh Sandwiches, Surplus Blankets" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Category</label>
                                <select id="don-category" required>
                                    <option value="Food">Food Donations</option>
                                    <option value="Grocery">Groceries</option>
                                    <option value="Clothes">Clothes / Clothing</option>
                                    <option value="Medicine">Medicines</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Quantity / Units</label>
                                <input type="text" id="don-qty" placeholder="e.g. 10 kg, 5 boxes" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Expiry Date (Required for Food/Med)</label>
                                <input type="date" id="don-expiry">
                            </div>
                            <div class="form-group">
                                <label>Upload Mock Image URL</label>
                                <input type="text" id="don-img" placeholder="Optional URL">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Pickup Location Coordinates (Simulation defaults to your address)</label>
                            <div class="form-row">
                                <input type="text" id="don-address" value="${user.address}" style="flex:2;" required>
                                <input type="number" step="any" id="don-lat" value="${user.lat}" placeholder="Lat" style="flex:1;" required>
                                <input type="number" step="any" id="don-lng" value="${user.lng}" placeholder="Lng" style="flex:1;" required>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px;"><i class="fa-solid fa-magic"></i> AI Smart Matching & Post</button>
                    </form>
                </div>
            </div>

            <!-- Right Side: My listings and status -->
            <div>
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> My Contributions History</h3>
                    <div id="donor-history-list" style="display:flex; flex-direction:column; gap:16px;">
                        <div style="text-align:center;">Loading history...</div>
                    </div>
                </div>

                <!-- CSR impact badges widget -->
                <div class="glass-card">
                    <h3 class="section-title"><i class="fa-solid fa-medal text-warning"></i> Carbon Reduction CSR Rating</h3>
                    <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">Based on your surplus redistribution, you avoided carbon emissions equivalent to:</p>
                    <div class="impact-badge-container">
                        <div class="impact-badge-card">
                            <i class="fa-solid fa-tree text-success"></i>
                            <strong>${Math.round(user.impact_score / 10)}</strong>
                            <span>Trees Planted</span>
                        </div>
                        <div class="impact-badge-card">
                            <i class="fa-solid fa-car text-blue"></i>
                            <strong>${Math.round(user.impact_score * 4)} km</strong>
                            <span>Driving Avoided</span>
                        </div>
                        <div class="impact-badge-card">
                            <i class="fa-solid fa-bolt text-warning"></i>
                            <strong>${Math.round(user.impact_score * 0.8)} kWh</strong>
                            <span>Energy Saved</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const historyList = document.getElementById('donor-history-list');

    async function loadDonorHistory() {
        try {
            const res = await fetch('/api/donations');
            const data = await res.json();
            
            // Filter user donations
            const userDonations = data.filter(d => d.donor_id === user.id);
            if (userDonations.length === 0) {
                historyList.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary);">You haven't posted any donations yet. Let's make your first contribution!</div>`;
                return;
            }
            
            historyList.innerHTML = userDonations.map(item => `
                <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02)">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="font-size:14.5px;">${item.title}</h4>
                        <span class="status-badge status-${item.status}">${item.status.replace('_', ' ')}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary);">
                        <span>Category: ${item.category}</span>
                        <span>Qty: ${item.quantity}</span>
                    </div>
                    <span style="font-size:10px; color:var(--text-muted); display:block; margin-top:8px;">Posted: ${formatDate(item.created_at)}</span>
                </div>
            `).join('');
            
        } catch (e) {
            historyList.innerHTML = `<div style="text-align:center; color:var(--alert-danger);">Error fetching contribution logs.</div>`;
        }
    }

    // Submit Donation Form
    document.getElementById('donation-submit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        window.loadingMask.show("AI Matching donation...");
        
        const payload = {
            title: document.getElementById('don-title').value,
            category: document.getElementById('don-category').value,
            quantity: document.getElementById('don-qty').value,
            expiry_date: document.getElementById('don-expiry').value,
            location_name: document.getElementById('don-address').value,
            lat: document.getElementById('don-lat').value,
            lng: document.getElementById('don-lng').value,
            image_url: document.getElementById('don-img').value || ''
        };
        
        try {
            const res = await window.appState.fetchWithAuth('/api/donations', {
                method: 'POST',
                body: payload
            });
            const data = await res.json();
            window.loadingMask.hide();
            
            if (res.ok) {
                alert("Donation successfully matching with the nearest shelter & rider assigned!");
                document.getElementById('donation-submit-form').reset();
                // Reset coordinate inputs to default user state
                document.getElementById('don-address').value = user.address;
                document.getElementById('don-lat').value = user.lat;
                document.getElementById('don-lng').value = user.lng;
                
                // Reload profile data (reward points / impact updates)
                const upProf = await window.appState.fetchWithAuth('/api/profile');
                if (upProf.ok) {
                    const upUser = await upProf.json();
                    window.appState.user = upUser;
                    localStorage.setItem('smartshare_user', JSON.stringify(upUser));
                    window.appState.updateHeaderUI();
                }
                
                // Re-render
                renderDonorDashboard(container, window.appState.getCurrentUser());
            } else {
                alert(data.error || "Failed to post donation.");
            }
        } catch (err) {
            window.loadingMask.hide();
            alert("Error sending donation data to the server");
        }
    });

    loadDonorHistory();
}

// 7B. NGO DASHBOARD VIEW
async function renderNgoDashboard(container, user) {
    container.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h2>Shelter Dashboard: ${user.username}</h2>
                <p>Track unclaimed listings, manage claims, and participate in NGO resource sharing.</p>
            </div>
            <div>
                <span class="hero-tag" id="ngo-status-tag" style="margin:0;"><i class="fa-solid fa-spinner fa-spin"></i> Checking Verification</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Left Side: Claimed Donations & Market requests -->
            <div>
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-truck-ramp-box"></i> Active Deliveries / Resource Matches</h3>
                    <div id="ngo-deliveries-list" style="display:flex; flex-direction:column; gap:16px;">
                        <div style="text-align:center;">Loading claimed matches...</div>
                    </div>
                </div>

                <!-- NGO to NGO resource marketplace sharing -->
                <div class="glass-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 class="section-title" style="margin:0;"><i class="fa-solid fa-handshake"></i> NGO-to-NGO Resource Sharing</h3>
                        <button class="btn btn-primary btn-small" id="open-share-btn"><i class="fa-solid fa-share-nodes"></i> Share Supply</button>
                    </div>

                    <div id="ngo-share-form-card" class="glass-card hidden" style="margin-bottom:20px; background:rgba(255,255,255,0.01);">
                        <form id="sharing-submit-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Recipient NGO User ID</label>
                                    <input type="number" id="sr-recipient" placeholder="Recipient NGO ID (e.g. 2, 3)" required>
                                </div>
                                <div class="form-group">
                                    <label>Resource Type</label>
                                    <input type="text" id="sr-resource" placeholder="e.g. Excess Groceries" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Quantity</label>
                                <input type="text" id="sr-qty" placeholder="e.g. 50 kg" required>
                            </div>
                            <button type="submit" class="btn btn-accent btn-small" style="width:100%;">Post Sharing Offer</button>
                        </form>
                    </div>

                    <div id="ngo-sharing-requests-list" style="display:flex; flex-direction:column; gap:16px;">
                        <div style="text-align:center;">Loading sharing logs...</div>
                    </div>
                </div>
            </div>

            <!-- Right Side: Available Donations Grid -->
            <div>
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-basket-shopping text-primary"></i> Available surplus in your area</h3>
                    <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">Browse resource listings to assign manually if AI matching was skipped.</p>
                    
                    <div id="ngo-unclaimed-list" style="display:flex; flex-direction:column; gap:16px;">
                        <div style="text-align:center;">Querying database...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const delList = document.getElementById('ngo-deliveries-list');
    const shareList = document.getElementById('ngo-sharing-requests-list');
    const unclaimedList = document.getElementById('ngo-unclaimed-list');
    const shareFormCard = document.getElementById('ngo-share-form-card');
    
    // Toggle sharing offer form
    document.getElementById('open-share-btn').addEventListener('click', () => {
        shareFormCard.classList.toggle('hidden');
    });

    async function loadNgoDashboardData() {
        try {
            // Check verification status
            const profRes = await window.appState.fetchWithAuth('/api/profile');
            const profile = await profRes.json();
            const tag = document.getElementById('ngo-status-tag');
            
            if (profile.ngo) {
                const status = profile.ngo.verification_status;
                if (status === 'verified') {
                    tag.className = "hero-tag";
                    tag.style.backgroundColor = "rgba(16, 185, 129, 0.08)";
                    tag.style.color = "var(--primary-green)";
                    tag.style.borderColor = "rgba(16, 185, 129, 0.2)";
                    tag.innerHTML = `<i class="fa-solid fa-circle-check"></i> Verified NGO`;
                } else {
                    tag.className = "hero-tag";
                    tag.style.backgroundColor = "rgba(245, 158, 11, 0.08)";
                    tag.style.color = "var(--alert-warning)";
                    tag.style.borderColor = "rgba(245, 158, 11, 0.2)";
                    tag.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> Verification Pending`;
                }
            }

            // Load claims/deliveries matching this NGO
            const donRes = await fetch('/api/donations');
            const donations = await donRes.json();
            
            const myMatched = donations.filter(d => d.ngo_id === user.id);
            if (myMatched.length === 0) {
                delList.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">No active deliveries matching your shelter.</div>`;
            } else {
                delList.innerHTML = myMatched.map(item => `
                    <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02)">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <h4 style="font-size:14.5px;">${item.title}</h4>
                            <span class="status-badge status-${item.status}">${item.status.replace('_', ' ')}</span>
                        </div>
                        <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:4px;">Donor: <strong>${item.donor_name}</strong></p>
                        <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${item.location_name}</p>
                    </div>
                `).join('');
            }

            // Load sharing requests
            const shareRes = await window.appState.fetchWithAuth('/api/sharing/requests');
            const sharing = await shareRes.json();
            
            if (sharing.length === 0) {
                shareList.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">No active sharing offers.</div>`;
            } else {
                shareList.innerHTML = sharing.map(req => {
                    const isReceiver = req.receiver_ngo_id === user.id;
                    const canAct = isReceiver && req.status === 'pending';
                    
                    return `
                        <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02)">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <h4 style="font-size:14px;"><i class="fa-solid fa-share-nodes text-blue"></i> ${req.resource_type}</h4>
                                <span class="status-badge status-${req.status}">${req.status}</span>
                            </div>
                            <p style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">
                                From: <strong>NGO ${req.sender_name}</strong> | Qty: <strong>${req.quantity}</strong>
                            </p>
                            ${canAct ? `
                                <div style="display:flex; gap:10px; margin-top:10px;">
                                    <button class="btn btn-primary btn-small" onclick="handleSharingAction(${req.id}, 'accepted')">Accept</button>
                                    <button class="btn btn-danger btn-small" onclick="handleSharingAction(${req.id}, 'declined')">Decline</button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            }

            // Load unclaimed/available listings
            const unclaimed = donations.filter(d => d.status === 'available');
            if (unclaimed.length === 0) {
                unclaimedList.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">No available surplus listings nearby.</div>`;
            } else {
                unclaimedList.innerHTML = unclaimed.map(item => `
                    <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02); cursor:pointer;" onclick="window.router.navigate('/listings')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h4 style="font-size:14px; color:var(--primary-green);">${item.title}</h4>
                            <span class="status-badge status-available">CLAIM</span>
                        </div>
                        <p style="font-size:12px; color:var(--text-secondary); margin-top:6px;">Qty: ${item.quantity} | Location: ${item.location_name}</p>
                    </div>
                `).join('');
            }

        } catch (e) {
            console.error("NGO dashboard load error", e);
        }
    }

    // Submit Sharing Request
    document.getElementById('sharing-submit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        window.loadingMask.show("Posting NGO sharing offer...");
        
        const payload = {
            receiver_ngo_id: document.getElementById('sr-recipient').value,
            resource_type: document.getElementById('sr-resource').value,
            quantity: document.getElementById('sr-qty').value
        };
        
        try {
            const res = await window.appState.fetchWithAuth('/api/sharing/requests', {
                method: 'POST',
                body: payload
            });
            window.loadingMask.hide();
            if (res.ok) {
                alert("Resource sharing offer posted successfully!");
                shareFormCard.classList.add('hidden');
                document.getElementById('sharing-submit-form').reset();
                loadNgoDashboardData();
            } else {
                alert("Failed to submit sharing offer.");
            }
        } catch (err) {
            window.loadingMask.hide();
            alert("Error sending sharing details");
        }
    });

    // Make handling function globally available inside component lifecycle
    window.handleSharingAction = async function(reqId, action) {
        window.loadingMask.show("Processing sharing transaction...");
        try {
            const res = await window.appState.fetchWithAuth(`/api/sharing/requests/${reqId}/action`, {
                method: 'POST',
                body: { action }
            });
            window.loadingMask.hide();
            if (res.ok) {
                alert(`Offer ${action} successfully!`);
                loadNgoDashboardData();
            } else {
                alert("Failed to execute sharing transaction action.");
            }
        } catch (err) {
            window.loadingMask.hide();
            alert("Connection error");
        }
    };

    loadNgoDashboardData();
}

// 7C. VOLUNTEER DASHBOARD VIEW
async function renderVolunteerDashboard(container, user) {
    container.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h2>Rider Panel: ${user.username}</h2>
                <p>View your active deliveries and track your reward points.</p>
            </div>
            <div>
                <span class="hero-tag" style="margin:0;"><i class="fa-solid fa-star text-blue"></i> Reward Points: ${user.reward_points}</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Left Side: Map routing & tracking -->
            <div>
                <div class="glass-card" style="margin-bottom:30px; padding:0; overflow:hidden;">
                    <div class="map-header">
                        <h3 class="section-title" style="margin:0;"><i class="fa-solid fa-map-location-dot"></i> Live Routing & Dispatch</h3>
                        <span class="status-badge status-matched" id="delivery-tracking-status">NO ACTIVE JOB</span>
                    </div>
                    
                    <div id="volunteer-map" style="height: 380px;"></div>
                </div>

                <div class="glass-card hidden" id="delivery-action-panel">
                    <h3 class="section-title"><i class="fa-solid fa-pen-to-square"></i> Job Operations</h3>
                    <div style="display:flex; gap:16px;">
                        <button class="btn btn-primary" id="btn-pickup-job" style="flex:1;"><i class="fa-solid fa-truck-loading"></i> Mark Picked Up</button>
                        <button class="btn btn-accent" id="btn-deliver-job" style="flex:1;"><i class="fa-solid fa-circle-check"></i> Mark Delivered</button>
                    </div>
                </div>
            </div>

            <!-- Right Side: Job specs and points rewards -->
            <div>
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-circle-info"></i> Active Delivery specs</h3>
                    <div id="volunteer-job-specs" style="font-size:13.5px;">
                        <p style="text-align:center; color:var(--text-secondary);">No active delivery jobs. Visit the marketplace to claim/coordinate.</p>
                    </div>
                </div>

                <!-- Reward Claim Box -->
                <div class="glass-card">
                    <h3 class="section-title"><i class="fa-solid fa-gift text-warning"></i> Volunteer Points Store</h3>
                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Exchange reward points for eco-sponsorship certificates or gift vouchers.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
                            <div>
                                <h5 style="font-size:13.5px;">Fuel Voucher ($10)</h5>
                                <span style="font-size:11px; color:var(--text-muted);">Cost: 200 points</span>
                            </div>
                            <button class="btn btn-accent btn-small" onclick="claimReward('Fuel Voucher', 200)">Claim</button>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
                            <div>
                                <h5 style="font-size:13.5px;">Eco Helper Badge</h5>
                                <span style="font-size:11px; color:var(--text-muted);">Cost: 400 points</span>
                            </div>
                            <button class="btn btn-primary btn-small" onclick="claimReward('Eco Helper Certificate', 400)">Claim</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const jobSpecs = document.getElementById('volunteer-job-specs');
    const actPanel = document.getElementById('delivery-action-panel');
    const trackingStatus = document.getElementById('delivery-tracking-status');
    const btnPickup = document.getElementById('btn-pickup-job');
    const btnDeliver = document.getElementById('btn-deliver-job');

    let activeDelivery = null;

    async function loadVolunteerDelivery() {
        try {
            const res = await window.appState.fetchWithAuth('/api/deliveries');
            const deliveries = await res.json();
            
            if (deliveries.length === 0) {
                jobSpecs.innerHTML = `<p style="text-align:center; color:var(--text-secondary);">No active delivery jobs assigned to you at the moment.</p>`;
                actPanel.classList.add('hidden');
                trackingStatus.textContent = "IDLE";
                trackingStatus.className = "status-badge status-available";
                
                // Initialize default map view
                const map = L.map('volunteer-map', { zoomControl: false }).setView([user.lat, user.lng], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(map);
                L.marker([user.lat, user.lng]).addTo(map).bindPopup("My Current Location").openPopup();
                return;
            }

            activeDelivery = deliveries[0];
            trackingStatus.textContent = activeDelivery.status.toUpperCase();
            trackingStatus.className = `status-badge status-${activeDelivery.status}`;
            actPanel.classList.remove('hidden');

            jobSpecs.innerHTML = `
                <div style="background:rgba(255,255,255,0.02); padding:16px; border-radius:var(--radius-md);">
                    <h4 style="margin-bottom:12px; color:var(--primary-green);"><i class="fa-solid fa-box"></i> ${activeDelivery.donation_title}</h4>
                    <p style="margin-bottom:8px;">Quantity: <strong>${activeDelivery.quantity}</strong> | Category: <strong>${activeDelivery.category}</strong></p>
                    <hr style="border-color:var(--border-color); margin:12px 0;">
                    <p style="margin-bottom:8px;"><i class="fa-solid fa-user"></i> Donor: <strong>${activeDelivery.donor_name}</strong> (${activeDelivery.donor_phone})</p>
                    <p style="margin-bottom:8px;"><i class="fa-solid fa-location-dot"></i> Pickup: <strong>${activeDelivery.pickup_location}</strong></p>
                    <p style="margin-bottom:8px;"><i class="fa-solid fa-house-chimney"></i> Deliver to: <strong>${activeDelivery.ngo_name}</strong></p>
                    <p><i class="fa-solid fa-map-pin"></i> Dropoff address: <strong>${activeDelivery.ngo_address}</strong></p>
                </div>
            `;

            // Render Route Map with Leaflet
            setTimeout(() => {
                const map = L.map('volunteer-map', { zoomControl: false }).setView([activeDelivery.donor_lat, activeDelivery.donor_lng], 12);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(map);

                const donorMarker = L.marker([activeDelivery.donor_lat, activeDelivery.donor_lng]).addTo(map).bindPopup("Pickup: " + activeDelivery.donor_name).openPopup();
                const ngoMarker = L.marker([activeDelivery.ngo_lat, activeDelivery.ngo_lng]).addTo(map).bindPopup("Dropoff: " + activeDelivery.ngo_name);
                
                // Draw route line
                if (activeDelivery.route_steps) {
                    const latlngs = JSON.parse(activeDelivery.route_steps);
                    L.polyline(latlngs, {color: '#3B82F6', weight: 5}).addTo(map);
                }
            }, 100);

        } catch (e) {
            console.error("Volunteer delivery map render error", e);
        }
    }

    // Pickup Click
    btnPickup.addEventListener('click', async () => {
        if (!activeDelivery) return;
        window.loadingMask.show("Registering pickup action...");
        try {
            const res = await window.appState.fetchWithAuth(`/api/donations/${activeDelivery.donation_id}/status`, {
                method: 'POST',
                body: { status: 'picked_up' }
            });
            window.loadingMask.hide();
            if (res.ok) {
                alert("Donation marked as picked up! In transit to shelter dropoff.");
                renderVolunteerDashboard(container, user);
            }
        } catch (e) {
            window.loadingMask.hide();
        }
    });

    // Deliver Click
    btnDeliver.addEventListener('click', async () => {
        if (!activeDelivery) return;
        window.loadingMask.show("Registering delivery dropoff...");
        try {
            const res = await window.appState.fetchWithAuth(`/api/donations/${activeDelivery.donation_id}/status`, {
                method: 'POST',
                body: { status: 'delivered' }
            });
            window.loadingMask.hide();
            if (res.ok) {
                alert("Redistribution complete! Thank you for reducing waste.");
                // Reload profile data (reward points / impact updates)
                const upProf = await window.appState.fetchWithAuth('/api/profile');
                if (upProf.ok) {
                    const upUser = await upProf.json();
                    window.appState.user = upUser;
                    localStorage.setItem('smartshare_user', JSON.stringify(upUser));
                    window.appState.updateHeaderUI();
                }
                renderVolunteerDashboard(container, window.appState.getCurrentUser());
            }
        } catch (e) {
            window.loadingMask.hide();
        }
    });

    window.claimReward = function(name, cost) {
        if (user.reward_points < cost) {
            alert("Insufficient reward points to purchase reward voucher!");
            return;
        }
        alert(`Congratulations! You claimed ${name}. Voucher sent to registered email address.`);
    };

    loadVolunteerDelivery();
}

// 7D. ADMIN DASHBOARD VIEW
async function renderAdminDashboard(container, user) {
    container.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h2>Admin Control Desk</h2>
                <p>Approve NGO verifications, view global platform activity stats, and toggle Disaster Relief Mode.</p>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Left Side: NGO verifications and campaign config -->
            <div>
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-shield-halved"></i> Pending NGO Verifications</h3>
                    <div id="admin-ngos-list" style="display:flex; flex-direction:column; gap:16px;">
                        <div style="text-align:center;">Loading verification roster...</div>
                    </div>
                </div>

                <!-- Disaster relief configuration -->
                <div class="glass-card">
                    <h3 class="section-title"><i class="fa-solid fa-triangle-exclamation text-danger"></i> Disaster Relief Mode Settings</h3>
                    <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">Activate emergency disaster mode to trigger a platform-wide alert and coordinate emergency supplies redistribution.</p>
                    
                    <form id="disaster-toggle-form">
                        <div class="form-group">
                            <label>Campaign Urgency Title</label>
                            <input type="text" id="dc-title" placeholder="e.g. Monsoon Floods Assistance Program" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Affected Location/District</label>
                                <input type="text" id="dc-location" placeholder="e.g. South Sector Lowlands" required>
                            </div>
                            <div class="form-group">
                                <label>Urgency Level</label>
                                <select id="dc-urgency">
                                    <option value="high">High priority</option>
                                    <option value="critical">Critical / Emergency</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Needs & Descriptions</label>
                            <textarea id="dc-desc" placeholder="Details of specific food/medical resources requested..." rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-danger" style="width:100%;"><i class="fa-solid fa-tower-broadcast"></i> Activate Relief Campaign</button>
                    </form>
                </div>
            </div>

            <!-- Right Side: User rosters & demand prediction zones -->
            <div>
                <!-- Demand Prediction AI widget -->
                <div class="glass-card" style="margin-bottom:30px;">
                    <h3 class="section-title"><i class="fa-solid fa-brain text-primary"></i> AI Resource Demand Forecast</h3>
                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Predicted demand values based on regional geolocation coordinates.</p>
                    
                    <div style="display:flex; gap:10px; margin-bottom:16px;">
                        <button class="btn btn-secondary btn-small" onclick="loadDemandAI(12.9784, 77.6408, 'Indiranagar')">Indiranagar</button>
                        <button class="btn btn-secondary btn-small" onclick="loadDemandAI(12.9352, 77.6245, 'Koramangala')">Koramangala</button>
                        <button class="btn btn-secondary btn-small" onclick="loadDemandAI(12.9698, 77.7499, 'Whitefield')">Whitefield</button>
                    </div>

                    <div id="ai-prediction-list" style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
                        <p style="text-align:center; color:var(--text-muted);">Select a zone above to execute the AI demand model.</p>
                    </div>
                </div>
                
                <div class="glass-card">
                    <h3 class="section-title"><i class="fa-solid fa-users"></i> Platform User Roster</h3>
                    <div id="admin-users-list" style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow-y:auto; font-size:12.5px;">
                        <div style="text-align:center;">Loading users...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const ngosList = document.getElementById('admin-ngos-list');
    const usersList = document.getElementById('admin-users-list');
    const predictionList = document.getElementById('ai-prediction-list');

    async function loadAdminData() {
        try {
            const res = await window.appState.fetchWithAuth('/api/admin/users');
            const data = await res.json();
            
            // Pending NGOs
            const pendingNgos = data.filter(u => u.role === 'ngo' && u.verification_status === 'pending');
            if (pendingNgos.length === 0) {
                ngosList.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">No pending NGO verifications. All clear!</div>`;
            } else {
                ngosList.innerHTML = pendingNgos.map(ngo => `
                    <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02)">
                        <h4 style="font-size:14.5px;">${ngo.ngo_name}</h4>
                        <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:10px;">Username: <strong>${ngo.username}</strong> | Email: ${ngo.email}</p>
                        <div style="display:flex; gap:12px;">
                            <button class="btn btn-primary btn-small" onclick="verifyNgo(${ngo.id}, 'verified')">Approve Verification</button>
                            <button class="btn btn-danger btn-small" onclick="verifyNgo(${ngo.id}, 'rejected')">Reject</button>
                        </div>
                    </div>
                `).join('');
            }

            // User Roster
            usersList.innerHTML = data.map(u => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color);">
                    <div>
                        <strong>${u.username}</strong>
                        <span style="color:var(--text-muted); font-size:11px; margin-left:6px;">(${u.role})</span>
                    </div>
                    <span>Score: ${u.impact_score || 0}</span>
                </div>
            `).join('');

        } catch (e) {
            console.error("Admin dashboard load error", e);
        }
    }

    // Verify NGO Action
    window.verifyNgo = async function(ngoUserId, status) {
        window.loadingMask.show("Updating NGO registration...");
        try {
            const res = await window.appState.fetchWithAuth(`/api/admin/ngos/${ngoUserId}/verify`, {
                method: 'POST',
                body: { status }
            });
            window.loadingMask.hide();
            if (res.ok) {
                alert(`NGO has been ${status} successfully.`);
                loadAdminData();
            }
        } catch (e) {
            window.loadingMask.hide();
        }
    };

    // AI demand loading click
    window.loadDemandAI = async function(lat, lng, zoneName) {
        predictionList.innerHTML = `<p style="text-align:center;"><i class="fa-solid fa-spinner fa-spin text-primary"></i> Querying zone predictive model...</p>`;
        try {
            const res = await fetch(`/api/ai/predict-demand?lat=${lat}&lng=${lng}`);
            const predictions = await res.json();
            
            predictionList.innerHTML = `
                <div style="margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                    <strong>AI Forecasting: ${zoneName} Zone</strong>
                </div>
                ${predictions.map(p => `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span>${p.category}:</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <strong style="color:${p.demand_score > 60 ? 'var(--alert-danger)' : p.demand_score > 40 ? 'var(--alert-warning)' : 'var(--primary-green)'}">${p.demand_score}% Demand</strong>
                            <span class="status-badge" style="font-size:8px; background-color:rgba(255,255,255,0.03);">${p.urgency}</span>
                        </div>
                    </div>
                `).join('')}
            `;
        } catch (e) {
            predictionList.innerHTML = `<p style="color:var(--alert-danger);">Failed to connect with AI model.</p>`;
        }
    };

    // Toggle disaster mode submit
    document.getElementById('disaster-toggle-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        window.loadingMask.show("Broadcasting disaster warnings...");
        
        const payload = {
            title: document.getElementById('dc-title').value,
            location: document.getElementById('dc-location').value,
            description: document.getElementById('dc-desc').value,
            urgency: document.getElementById('dc-urgency').value
        };
        
        try {
            const res = await window.appState.fetchWithAuth('/api/disaster/toggle', {
                method: 'POST',
                body: payload
            });
            window.loadingMask.hide();
            if (res.ok) {
                alert("Disaster Relief Campaign initiated! Global emergency warnings broadcasted.");
                document.getElementById('disaster-toggle-form').reset();
                window.appState.checkDisasterStatus(); // refresh top banner
                loadAdminData();
            } else {
                alert("Failed to activate campaign.");
            }
        } catch (err) {
            window.loadingMask.hide();
            alert("Error sending disaster parameters");
        }
    });

    loadAdminData();
}
