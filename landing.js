// Bayt Al Falafel - Landing Page JavaScript
// Language toggle only - no cart or order logic

// Global state
let currentLanguage = 'ar';

// Translation object for dynamic content
const translations = {
    ar: {
        // These are handled via data-ar/data-en attributes
    },
    en: {
        // These are handled via data-ar/data-en attributes
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadLanguagePreference();
    initializeLanguageToggle();
    updateAllTranslations();
});

// Load saved language preference
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('language') || 'ar';
    setLanguage(savedLang);
}

// Set language and update UI
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update language toggle button
    const langToggle = document.getElementById('langToggle');
    if (lang === 'ar') {
        langToggle.querySelector('.lang-ar').style.display = 'inline';
        langToggle.querySelector('.lang-en').style.display = 'none';
    } else {
        langToggle.querySelector('.lang-ar').style.display = 'none';
        langToggle.querySelector('.lang-en').style.display = 'inline';
    }
    
    // Update all translatable elements
    updateAllTranslations();
}

// Update all elements with data-ar/data-en attributes
function updateAllTranslations() {
    document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
        const text = currentLanguage === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        if (text) {
            el.textContent = text;
        }
    });
}

// Initialize language toggle button
function initializeLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
            setLanguage(newLang);
        });
    }
}
