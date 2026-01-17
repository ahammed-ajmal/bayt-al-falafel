// Bayt Al Falafel - Frontend JavaScript

// Basic interactions or enhancements can go here
document.addEventListener('DOMContentLoaded', () => {
    console.log('Site ready!');
    // Example: Smooth scroll if not supported natively
});

// Global state
let currentLanguage = 'ar';
let currentBranch = null;
let branches = [];
let menuItems = [];
let cart = [];
let editingItemId = null;

// Translation object
const translations = {
    ar: {
        'Select Branch': 'اختر الفرع',
        'Loading...': 'جاري التحميل...',
        'View on Map': 'عرض على الخريطة',
        'Menu': 'قائمة الطعام',
        'Order Cart': 'سلة الطلبات',
        'Total:': 'المجموع:',
        'SAR': 'ريال',
        'Notes (optional)': 'ملاحظات (اختياري)',
        'Order via WhatsApp': 'اطلب عبر واتساب',
        'In Stock': 'متوفر',
        'Out of Stock': 'غير متوفر',
        'Add to Cart': 'أضف للسلة',
        'Remove': 'إزالة',
        'Sandwiches': 'سندوتشات',
        'Meals': 'وجبات',
        'Sides': 'جانبية',
        'Drinks': 'مشروبات'
    },
    en: {
        'اختر الفرع': 'Select Branch',
        'جاري التحميل...': 'Loading...',
        'عرض على الخريطة': 'View on Map',
        'قائمة الطعام': 'Menu',
        'سلة الطلبات': 'Order Cart',
        'المجموع:': 'Total:',
        'ريال': 'SAR',
        'ملاحظات (اختياري)': 'Notes (optional)',
        'اطلب عبر واتساب': 'Order via WhatsApp',
        'متوفر': 'In Stock',
        'غير متوفر': 'Out of Stock',
        'أضف للسلة': 'Add to Cart',
        'إزالة': 'Remove',
        'سندوتشات': 'Sandwiches',
        'وجبات': 'Meals',
        'جانبية': 'Sides',
        'مشروبات': 'Drinks'
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeServiceWorker();
    loadLanguagePreference();
    initializeLanguageToggle();
    loadBranches();
    loadMenuItems();
    initializeCart();

    // Check if user is admin
    checkAdminStatus();
});

// Service Worker Registration
function initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}

// Language Management
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('language') || 'ar';
    setLanguage(savedLang);
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);

    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update all translatable elements
    document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
        const text = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        if (text) {
            // Only update if element has text content (not just attributes)
            if (el.textContent.trim() || el.hasAttribute('data-ar') || el.hasAttribute('data-en')) {
                el.textContent = text;
            }
        }
    });

    // Update language toggle button
    const langToggle = document.getElementById('langToggle');
    if (lang === 'ar') {
        langToggle.querySelector('.lang-ar').style.display = 'inline';
        langToggle.querySelector('.lang-en').style.display = 'none';
    } else {
        langToggle.querySelector('.lang-ar').style.display = 'none';
        langToggle.querySelector('.lang-en').style.display = 'inline';
    }

    // Re-render menu and cart with new language
    renderMenu();
    renderCart();
}

function initializeLanguageToggle() {
    document.getElementById('langToggle').addEventListener('click', () => {
        const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
    });
}

// Branch Management
function loadBranches() {
    db.collection('branches')
        .where('active', '==', true)
        .get()
        .then(snapshot => {
            branches = [];
            snapshot.forEach(doc => {
                branches.push({ id: doc.id, ...doc.data() });
            });
            renderBranchSelector();

            // Auto-select first branch or saved branch
            const savedBranchId = localStorage.getItem('selectedBranch');
            if (savedBranchId && branches.find(b => b.id === savedBranchId)) {
                selectBranch(savedBranchId);
            } else if (branches.length > 0) {
                selectBranch(branches[0].id);
            }
        })
        .catch(err => {
            console.error('Error loading branches:', err);
            document.getElementById('branchSelect').innerHTML =
                '<option value="">Error loading branches</option>';
        });
}

function renderBranchSelector() {
    const select = document.getElementById('branchSelect');
    select.innerHTML = branches.map(branch =>
        `<option value="${branch.id}">${branch.name}</option>`
    ).join('');

    select.addEventListener('change', (e) => {
        selectBranch(e.target.value);
    });
}

function selectBranch(branchId) {
    currentBranch = branches.find(b => b.id === branchId);
    if (!currentBranch) return;

    localStorage.setItem('selectedBranch', branchId);
    document.getElementById('branchSelect').value = branchId;

    // Update branch info display
    document.getElementById('branchName').textContent = currentBranch.name;
    document.getElementById('branchAddress').textContent = currentBranch.address;
    document.getElementById('branchHours').textContent = currentBranch.hours;
    document.getElementById('branchMapLink').href = currentBranch.mapLink;

    // Update Google Maps embed
    const mapContainer = document.getElementById('branchMap');
    // Convert Google Maps share link to embed URL
    let embedUrl = currentBranch.mapLink;

    // If it's a share link, convert to embed format
    if (embedUrl.includes('/place/') || embedUrl.includes('/@')) {
        // Extract coordinates or place ID from share link
        const coordsMatch = embedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const placeMatch = embedUrl.match(/place\/([^\/\?]+)/);

        if (coordsMatch) {
            // Use coordinates for embed
            embedUrl = `https://www.google.com/maps?q=${coordsMatch[1]},${coordsMatch[2]}&output=embed`;
        } else if (placeMatch) {
            // Use place name for embed
            const placeName = encodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
            embedUrl = `https://www.google.com/maps?q=${placeName}&output=embed`;
        }
    } else if (!embedUrl.includes('output=embed')) {
        // If not already an embed URL, add output=embed parameter
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'output=embed';
    }

    mapContainer.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

    document.getElementById('branchInfo').style.display = 'block';

    // Update URL for SEO (only if not already on that URL)
    const branchSlug = currentBranch.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const currentPath = window.location.pathname;
    if (!currentPath.includes(branchSlug)) {
        window.history.pushState({ branchId: branchId }, '', `/${branchSlug}`);
    }
}

// Menu Management
function loadMenuItems() {
    db.collection('menuItems')
        .orderBy('nameAr')
        .get()
        .then(snapshot => {
            menuItems = [];
            snapshot.forEach(doc => {
                menuItems.push({ id: doc.id, ...doc.data() });
            });
            renderMenu();
        })
        .catch(err => {
            console.error('Error loading menu items:', err);
            document.getElementById('menuGrid').innerHTML =
                '<div class="loading">Error loading menu</div>';
        });

    // Listen for real-time updates
    db.collection('menuItems')
        .onSnapshot(snapshot => {
            menuItems = [];
            snapshot.forEach(doc => {
                menuItems.push({ id: doc.id, ...doc.data() });
            });
            renderMenu();
        });
}

function renderMenu() {
    const grid = document.getElementById('menuGrid');
    if (menuItems.length === 0) {
        grid.innerHTML = '<div class="loading">No menu items available</div>';
        return;
    }

    const categories = ['sandwich', 'meal', 'side', 'drink'];
    const categoryTitles = {
        'sandwich': { ar: 'سندوتشات', en: 'Sandwiches' },
        'meal': { ar: 'وجبات', en: 'Meals' },
        'side': { ar: 'جانبية', en: 'Sides' },
        'drink': { ar: 'مشروبات', en: 'Drinks' }
    };

    let html = '';

    categories.forEach(type => {
        const itemsInType = menuItems.filter(item => (item.type || 'sandwich') === type);

        if (itemsInType.length > 0) {
            const title = currentLanguage === 'ar' ? categoryTitles[type].ar : categoryTitles[type].en;
            html += `<h3 class="menu-section-title">${title}</h3>`;
            html += `<div class="menu-category-grid">`; // Helper container if needed for grid layout per section, or just items

            // Actually, existing CSS uses .menu-grid which might be a grid container. 
            // If I put h3 inside .menu-grid, it might mess up layout if it's display:grid.
            // Let's check style.css in next step. For now, assuming I might need to break the grid or adjust CSS.
            // A common pattern is to have the grid contain card items. If I put a H3 in there, it becomes a grid item.
            // I should close the grid and start a new one, OR make the H3 span all columns.
            // Let's assume for now I will produce a flat list of (Title -> Grid) * N.
            // But wait, `renderMenu` sets `grid.innerHTML`. `grid` is `#menuGrid`.
            // If `#menuGrid` is the container, I can't easily put titles inside if it enforces a strict grid of cards.
            // I'll check CSS later. For now, I will generate a structure like:
            // <h3 class="full-width">Title</h3> <card> <card> ...
            // And I will ensure CSS handles "full-width" or I'll change the parent container structure in JS (which is harder without changing HTML).
            // BETTER APPROACH: clear the grid class from the rendering target and move the class to sub-containers.
            // BUT `grid` is the element `div#menuGrid`.
            // I will change the innerHTML to be: 
            // <div class="category-section"><h3>Title</h3><div class="menu-items-grid">...items...</div></div>

            html += itemsInType.map(item => {
                const name = currentLanguage === 'ar' ? item.nameAr : item.nameEn;
                const availability = item.available ?
                    (currentLanguage === 'ar' ? 'متوفر' : 'In Stock') :
                    (currentLanguage === 'ar' ? 'غير متوفر' : 'Out of Stock');
                const availabilityClass = item.available ? 'in-stock' : 'out-of-stock';

                const cartItem = cart.find(ci => ci.id === item.id);
                const quantity = cartItem ? cartItem.quantity : 0;

                const itemImage = `<img src="${item.imageUrl || 'images/fresh-falafel.jpg'}" alt="${name}" class="menu-item-image" onerror="this.src='images/fresh-falafel.jpg'">`;

                return `
                    <div class="menu-item ${!item.available ? 'out-of-stock' : ''}">
                        ${itemImage}
                        <div class="menu-item-header">
                            <div class="menu-item-name">${name}</div>
                            <div class="menu-item-price">${item.price} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                        </div>
                        <div class="menu-item-availability ${availabilityClass}">${availability}</div>
                        <div class="menu-item-actions">
                            ${quantity > 0 ? `
                                <div class="quantity-controls">
                                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)" ${!item.available ? 'disabled' : ''}>-</button>
                                    <span class="quantity-value">${quantity}</span>
                                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)" ${!item.available ? 'disabled' : ''}>+</button>
                                </div>
                            ` : ''}
                            <button class="add-to-cart-btn" onclick="addToCart('${item.id}')" ${!item.available ? 'disabled' : ''}>
                                ${quantity > 0 ? (currentLanguage === 'ar' ? 'تحديث' : 'Update') : (currentLanguage === 'ar' ? 'أضف للسلة' : 'Add to Cart')}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            html += `</div>`; // Close category grid
        }
    });

    grid.innerHTML = html;

    // We need to ensure the #menuGrid element doesn't enforce a grid layout on the H3/Divs if they are direct children
    // OR we change the CSS for #menuGrid to be a flex column, and the inner divs are grids.
    // I will address this in style.css.
}

// Cart Management
function initializeCart() {
    loadCartFromStorage();
    renderCart();
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(itemId) {
    const item = menuItems.find(m => m.id === itemId);
    if (!item || !item.available) return;

    const existingItem = cart.find(c => c.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: itemId, quantity: 1 });
    }

    saveCartToStorage();
    renderMenu();
    renderCart();
}

function updateQuantity(itemId, change) {
    const cartItem = cart.find(c => c.id === itemId);
    if (!cartItem) return;

    cartItem.quantity += change;
    if (cartItem.quantity <= 0) {
        cart = cart.filter(c => c.id !== itemId);
    }

    saveCartToStorage();
    renderMenu();
    renderCart();
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    saveCartToStorage();
    renderMenu();
    renderCart();
}

function renderCart() {
    const cartSection = document.getElementById('cartSection');
    const cartItems = document.getElementById('cartItems');

    if (cart.length === 0) {
        cartSection.style.display = 'none';
        return;
    }

    cartSection.style.display = 'block';

    let total = 0;
    cartItems.innerHTML = cart.map(cartItem => {
        const item = menuItems.find(m => m.id === cartItem.id);
        if (!item) return '';

        const name = currentLanguage === 'ar' ? item.nameAr : item.nameEn;
        const itemTotal = item.price * cartItem.quantity;
        total += itemTotal;

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${name}</div>
                    <div class="cart-item-quantity">${cartItem.quantity}x</div>
                </div>
                <div class="cart-item-price">${itemTotal} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                    ${currentLanguage === 'ar' ? 'إزالة' : 'Remove'}
                </button>
            </div>
        `;
    }).join('');

    document.getElementById('cartTotal').textContent = total.toFixed(2);

    // Initialize order button
    document.getElementById('orderBtn').onclick = sendWhatsAppOrder;
}

// WhatsApp Order
function sendWhatsAppOrder() {
    if (!currentBranch || cart.length === 0) return;

    // Track order button click
    trackOrderEvent('order_clicked', {
        branchId: currentBranch.id,
        branchName: currentBranch.name,
        language: currentLanguage,
        itemCount: cart.length
    });

    const notes = document.getElementById('orderNotes').value;
    const orderItems = cart.map(cartItem => {
        const item = menuItems.find(m => m.id === cartItem.id);
        const name = currentLanguage === 'ar' ? item.nameAr : item.nameEn;
        return `${name} × ${cartItem.quantity}`;
    }).join('\n');

    const total = cart.reduce((sum, cartItem) => {
        const item = menuItems.find(m => m.id === cartItem.id);
        return sum + (item.price * cartItem.quantity);
    }, 0);

    let message = '';
    if (currentLanguage === 'ar') {
        message = `السلام عليكم،\nالفرع: ${currentBranch.name}\nالطلب:\n${orderItems}\n`;
        if (notes) message += `\nملاحظات: ${notes}\n`;
        message += `\nالمجموع: ${total.toFixed(2)} ريال`;
    } else {
        message = `Hello,\nBranch: ${currentBranch.name}\nOrder:\n${orderItems}\n`;
        if (notes) message += `\nNotes: ${notes}\n`;
        message += `\nTotal: ${total.toFixed(2)} SAR`;
    }

    const whatsappUrl = `https://wa.me/${currentBranch.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

    // Track order submitted
    trackOrderEvent('order_submitted', {
        branchId: currentBranch.id,
        branchName: currentBranch.name,
        language: currentLanguage,
        items: cart.map(ci => {
            const item = menuItems.find(m => m.id === ci.id);
            return {
                itemId: ci.id,
                itemName: currentLanguage === 'ar' ? item.nameAr : item.nameEn,
                quantity: ci.quantity,
                price: item.price
            };
        }),
        total: total,
        notes: notes
    });

    window.open(whatsappUrl, '_blank');
}

// Analytics Tracking
function trackOrderEvent(eventType, data) {
    const eventData = {
        type: eventType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ...data
    };

    // Add fallback timestamp for offline support
    if (!navigator.onLine) {
        eventData.timestamp = new Date();
        eventData.offline = true;
    }

    db.collection('orderEvents').add(eventData)
        .catch(err => console.error('Error tracking event:', err));
}

// Admin Check
function checkAdminStatus() {
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('adminLink').style.display = 'inline-block';
        }
    });
}

