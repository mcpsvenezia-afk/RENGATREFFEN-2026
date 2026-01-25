import './style.css'
// --- 🛰️ SUPABASE & CORE PLUGINS ---
import './plugins/renga-dev-loader-v1.js' // 🧬 INJECT DEV MODE

declare global {
    interface Window {
        RENGA_VERSION: string;
        RENGA_INSPECTOR_LOADED: boolean;
    }
}

// 🎨 FORCED VISIBILITY FIX (Nuclear Option)
const styleFix = document.createElement('style');
styleFix.innerHTML = `
    input, textarea { color: #111 !important; background: rgba(255,255,255,0.9) !important; }
    ::placeholder { color: #888 !important; }
`;
document.head.appendChild(styleFix);
console.log('--- 🧬 RENGA CORE v1.0.6 (NAVIGATION FIX) READY ---');
window.RENGA_VERSION = '1.0.6';

// --- 📱 NAVIGATION & MOBILE ENGINE v1.1.0 ---
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

const toggleMenu = () => {
    navLinks?.classList.toggle('active');
    mobileBtn?.classList.toggle('active');
};

const closeMenu = () => {
    navLinks?.classList.remove('active');
    mobileBtn?.classList.remove('active');
};

mobileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (navLinks?.classList.contains('active') && !navLinks.contains(target) && !mobileBtn?.contains(target)) {
        closeMenu();
    }
});

// Intelligent Scroll & Navigation
document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    // Handle local anchors or same-page links with hashes
    if (href.startsWith('#') || href.includes('#')) {
        try {
            const url = new URL(anchor.href);
            const isSamePage = url.pathname === window.location.pathname ||
                (url.pathname === '/' && window.location.pathname.endsWith('index.html')) ||
                (window.location.pathname === '/' && url.pathname.endsWith('index.html'));

            if (isSamePage && url.hash) {
                const targetElement = document.querySelector(url.hash);
                if (targetElement) {
                    e.preventDefault();
                    closeMenu();

                    const navElement = document.getElementById('main-nav');
                    const offsetNav = navElement ? navElement.offsetHeight : 0;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offsetNav;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        } catch (err) {
            console.warn("Navigation error:", err);
        }
    }

    // Always close menu on link click inside nav
    if (anchor.closest('.nav-links')) {
        setTimeout(closeMenu, 100);
    }
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

revealElements.forEach(el => revealObserver.observe(el));

// Sticky Navbar
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav?.classList.add('scrolled');
    } else {
        nav?.classList.remove('scrolled');
    }
});

// Accordion Logic
const accordionHeaders = document.querySelectorAll('.accordion-header');
accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        if (!item) return;

        const isActive = item.classList.contains('active');

        // Close all other items
        document.querySelectorAll('.accordion-item').forEach(otherItem => {
            otherItem.classList.remove('active');
        });

        // Toggle current item
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// 🧬 MODULES & PLUGINS
// @ts-ignore
import { initContactEngine } from './plugins/plugin-contact-engine-v1.js'
// @ts-ignore
import { initRegistrationEngine } from './plugins/plugin-registration-engine-v1.js'

initContactEngine();
initRegistrationEngine();
