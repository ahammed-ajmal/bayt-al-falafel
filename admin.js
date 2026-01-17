// Bayt Al Falafel - Admin Panel JavaScript

// Global state
let currentUser = null;
let editingMenuItemId = null;
let editingBranchId = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    initializeEventListeners();
});

// Authentication
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showAdminDashboard();
            loadMenuItems();
            loadBranches();
            loadAnalytics();
        } else {
            showLoginScreen();
        }
    });
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
}

function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchSection(e.target.dataset.section);
        });
    });
    
    // Menu management
    document.getElementById('addMenuItemBtn').addEventListener('click', () => openMenuItemModal());
    document.getElementById('closeMenuItemModal').addEventListener('click', closeMenuItemModal);
    document.getElementById('cancelMenuItemBtn').addEventListener('click', closeMenuItemModal);
    document.getElementById('menuItemForm').addEventListener('submit', handleMenuItemSubmit);
    
    // Branch management
    document.getElementById('addBranchBtn').addEventListener('click', () => openBranchModal());
    document.getElementById('closeBranchModal').addEventListener('click', closeBranchModal);
    document.getElementById('cancelBranchBtn').addEventListener('click', closeBranchModal);
    document.getElementById('branchForm').addEventListener('submit', handleBranchSubmit);
    
    // Analytics
    document.getElementById('analyticsPeriod').addEventListener('change', loadAnalytics);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const menuModal = document.getElementById('menuItemModal');
        const branchModal = document.getElementById('branchModal');
        if (e.target === menuModal) closeMenuItemModal();
        if (e.target === branchModal) closeBranchModal();
    });
}

// Login/Logout
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.style.display = 'none';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Login successful, handled by auth state change
        })
        .catch(error => {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        });
}

function handleLogout() {
    auth.signOut()
        .then(() => {
            showLoginScreen();
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
}

// Section Navigation
function switchSection(sectionName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionName) {
            btn.classList.add('active');
        }
    });
    
    // Update sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    // Load data for active section
    if (sectionName === 'analytics') {
        loadAnalytics();
    }
}

// Menu Item Management
function loadMenuItems() {
    db.collection('menuItems')
        .orderBy('nameAr')
        .get()
        .then(snapshot => {
            const menuItemsList = document.getElementById('menuItemsList');
            
            if (snapshot.empty) {
                menuItemsList.innerHTML = '<div class="loading">No menu items. Click "Add Menu Item" to get started.</div>';
                return;
            }
            
            menuItemsList.innerHTML = snapshot.docs.map(doc => {
                const item = doc.data();
                const itemImage = `<img src="${item.imageUrl || 'images/fresh-falafel.jpg'}" alt="${item.nameAr}" class="admin-item-image" onerror="this.src='images/fresh-falafel.jpg'">`;
                return `
                    <div class="menu-item-card">
                        ${itemImage}
                        <div class="item-info">
                            <div class="item-name">${item.nameAr} / ${item.nameEn}</div>
                            <div class="item-details">Price: ${item.price} SAR</div>
                            ${item.imageUrl ? '<div class="item-details" style="color: #28a745;">✓ Has Image</div>' : ''}
                            <div class="item-availability ${item.available ? 'in-stock' : 'out-of-stock'}">
                                ${item.available ? 'In Stock' : 'Out of Stock'}
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-edit" onclick="editMenuItem('${doc.id}')">Edit</button>
                            <button class="btn-delete" onclick="deleteMenuItem('${doc.id}')">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(err => {
            console.error('Error loading menu items:', err);
            document.getElementById('menuItemsList').innerHTML = 
                '<div class="loading">Error loading menu items</div>';
        });
}

function openMenuItemModal(itemId = null) {
    editingMenuItemId = itemId;
    const modal = document.getElementById('menuItemModal');
    const form = document.getElementById('menuItemForm');
    const title = document.getElementById('modalTitle');
    
    if (itemId) {
        title.textContent = 'Edit Menu Item';
        // Load item data
        db.collection('menuItems').doc(itemId).get()
            .then(doc => {
                if (doc.exists) {
                    const item = doc.data();
                    document.getElementById('itemNameAr').value = item.nameAr;
                    document.getElementById('itemNameEn').value = item.nameEn;
                    document.getElementById('itemPrice').value = item.price;
                    document.getElementById('itemType').value = item.type || 'sandwich';
                    document.getElementById('itemImageUrl').value = item.imageUrl || '';
                    document.getElementById('itemAvailable').checked = item.available;
                }
            });
    } else {
        title.textContent = 'Add Menu Item';
        form.reset();
        document.getElementById('itemType').value = 'sandwich';
        document.getElementById('itemAvailable').checked = true;
        document.getElementById('itemImageUrl').value = '';
    }
    
    modal.style.display = 'flex';
}

function closeMenuItemModal() {
    document.getElementById('menuItemModal').style.display = 'none';
    editingMenuItemId = null;
    document.getElementById('menuItemForm').reset();
}

function handleMenuItemSubmit(e) {
    e.preventDefault();
    
    const imageUrl = document.getElementById('itemImageUrl').value.trim();
    const itemData = {
        nameAr: document.getElementById('itemNameAr').value,
        nameEn: document.getElementById('itemNameEn').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        type: document.getElementById('itemType').value,
        available: document.getElementById('itemAvailable').checked
    };
    
    // Only add imageUrl if it's provided
    if (imageUrl) {
        itemData.imageUrl = imageUrl;
    }
    
    if (editingMenuItemId) {
        // Update existing item
        db.collection('menuItems').doc(editingMenuItemId).update(itemData)
            .then(() => {
                closeMenuItemModal();
                loadMenuItems();
            })
            .catch(err => {
                console.error('Error updating menu item:', err);
                alert('Error updating menu item');
            });
    } else {
        // Add new item
        db.collection('menuItems').add(itemData)
            .then(() => {
                closeMenuItemModal();
                loadMenuItems();
            })
            .catch(err => {
                console.error('Error adding menu item:', err);
                alert('Error adding menu item');
            });
    }
}

function editMenuItem(itemId) {
    openMenuItemModal(itemId);
}

function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    db.collection('menuItems').doc(itemId).delete()
        .then(() => {
            loadMenuItems();
        })
        .catch(err => {
            console.error('Error deleting menu item:', err);
            alert('Error deleting menu item');
        });
}

// Branch Management
function loadBranches() {
    db.collection('branches')
        .orderBy('name')
        .get()
        .then(snapshot => {
            const branchesList = document.getElementById('branchesList');
            
            if (snapshot.empty) {
                branchesList.innerHTML = '<div class="loading">No branches. Click "Add Branch" to get started.</div>';
                return;
            }
            
            branchesList.innerHTML = snapshot.docs.map(doc => {
                const branch = doc.data();
                return `
                    <div class="branch-card">
                        <div class="branch-info">
                            <div class="branch-name">${branch.name}</div>
                            <div class="branch-details">${branch.address}</div>
                            <div class="branch-details">Phone: ${branch.phone}</div>
                            <div class="branch-details">Hours: ${branch.hours}</div>
                            <div class="item-availability ${branch.active ? 'in-stock' : 'out-of-stock'}">
                                ${branch.active ? 'Active (Receiving Orders)' : 'Inactive'}
                            </div>
                        </div>
                        <div class="branch-actions">
                            <button class="btn-edit" onclick="editBranch('${doc.id}')">Edit</button>
                            <button class="btn-delete" onclick="deleteBranch('${doc.id}')">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(err => {
            console.error('Error loading branches:', err);
            document.getElementById('branchesList').innerHTML = 
                '<div class="loading">Error loading branches</div>';
        });
}

function openBranchModal(branchId = null) {
    editingBranchId = branchId;
    const modal = document.getElementById('branchModal');
    const form = document.getElementById('branchForm');
    const title = document.getElementById('branchModalTitle');
    
    if (branchId) {
        title.textContent = 'Edit Branch';
        // Load branch data
        db.collection('branches').doc(branchId).get()
            .then(doc => {
                if (doc.exists) {
                    const branch = doc.data();
                    document.getElementById('branchName').value = branch.name;
                    document.getElementById('branchAddress').value = branch.address;
                    document.getElementById('branchMapLink').value = branch.mapLink;
                    document.getElementById('branchPhone').value = branch.phone;
                    document.getElementById('branchHours').value = branch.hours;
                    document.getElementById('branchActive').checked = branch.active;
                }
            });
    } else {
        title.textContent = 'Add Branch';
        form.reset();
        document.getElementById('branchActive').checked = true;
    }
    
    modal.style.display = 'flex';
}

function closeBranchModal() {
    document.getElementById('branchModal').style.display = 'none';
    editingBranchId = null;
    document.getElementById('branchForm').reset();
}

function handleBranchSubmit(e) {
    e.preventDefault();
    
    const branchData = {
        name: document.getElementById('branchName').value,
        address: document.getElementById('branchAddress').value,
        mapLink: document.getElementById('branchMapLink').value,
        phone: document.getElementById('branchPhone').value,
        hours: document.getElementById('branchHours').value,
        active: document.getElementById('branchActive').checked
    };
    
    if (editingBranchId) {
        // Update existing branch
        db.collection('branches').doc(editingBranchId).update(branchData)
            .then(() => {
                closeBranchModal();
                loadBranches();
            })
            .catch(err => {
                console.error('Error updating branch:', err);
                alert('Error updating branch');
            });
    } else {
        // Add new branch
        db.collection('branches').add(branchData)
            .then(() => {
                closeBranchModal();
                loadBranches();
            })
            .catch(err => {
                console.error('Error adding branch:', err);
                alert('Error adding branch');
            });
    }
}

function editBranch(branchId) {
    openBranchModal(branchId);
}

function deleteBranch(branchId) {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    
    db.collection('branches').doc(branchId).delete()
        .then(() => {
            loadBranches();
        })
        .catch(err => {
            console.error('Error deleting branch:', err);
            alert('Error deleting branch');
        });
}

// Analytics
function loadAnalytics() {
    const period = document.getElementById('analyticsPeriod').value;
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'weekly':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
    }
    
    // Load order events
    db.collection('orderEvents')
        .where('timestamp', '>=', startDate)
        .get()
        .then(snapshot => {
            const events = [];
            snapshot.forEach(doc => {
                events.push(doc.data());
            });
            
            calculateAnalytics(events);
        })
        .catch(err => {
            console.error('Error loading analytics:', err);
        });
}

function calculateAnalytics(events) {
    // Total orders (order_submitted events)
    const orders = events.filter(e => e.type === 'order_submitted');
    document.getElementById('totalOrders').textContent = orders.length;
    
    // Peak hour
    const hourCounts = {};
    orders.forEach(order => {
        let date;
        if (order.timestamp && order.timestamp.toDate) {
            date = order.timestamp.toDate();
        } else if (order.timestamp && order.timestamp instanceof Date) {
            date = order.timestamp;
        } else if (order.timestamp) {
            date = new Date(order.timestamp);
        }
        if (date && !isNaN(date.getTime())) {
            const hour = date.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
    });
    
    let peakHour = '-';
    let maxCount = 0;
    Object.keys(hourCounts).forEach(hour => {
        if (hourCounts[hour] > maxCount) {
            maxCount = hourCounts[hour];
            peakHour = `${hour}:00`;
        }
    });
    document.getElementById('peakHour').textContent = peakHour;
    
    // Most ordered items
    const itemCounts = {};
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const key = item.itemName;
                itemCounts[key] = (itemCounts[key] || 0) + item.quantity;
            });
        }
    });
    
    const topItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const topItemsChart = document.getElementById('topItemsChart');
    if (topItems.length === 0) {
        topItemsChart.innerHTML = '<div class="loading">No orders yet</div>';
    } else {
        topItemsChart.innerHTML = topItems.map(([name, count]) => `
            <div class="chart-item">
                <span class="chart-item-name">${name}</span>
                <span class="chart-item-value">${count}</span>
            </div>
        `).join('');
    }
    
    // Orders by branch
    const branchCounts = {};
    orders.forEach(order => {
        if (order.branchName) {
            branchCounts[order.branchName] = (branchCounts[order.branchName] || 0) + 1;
        }
    });
    
    const branchOrders = Object.entries(branchCounts)
        .sort((a, b) => b[1] - a[1]);
    
    const ordersByBranchChart = document.getElementById('ordersByBranchChart');
    if (branchOrders.length === 0) {
        ordersByBranchChart.innerHTML = '<div class="loading">No orders yet</div>';
    } else {
        ordersByBranchChart.innerHTML = branchOrders.map(([name, count]) => `
            <div class="chart-item">
                <span class="chart-item-name">${name}</span>
                <span class="chart-item-value">${count}</span>
            </div>
        `).join('');
    }
}
