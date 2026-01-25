import './style.css'
import { supabase } from './lib/supabaseClient.js'
import './plugins/renga-dev-loader-v1.js' // 🧬 INJECT DEV MODE

// 🎨 FORCED VISIBILITY FIX (Nuclear Option)
const styleFix = document.createElement('style');
styleFix.innerHTML = `
    input, textarea { color: #111 !important; background: rgba(255,255,255,0.9) !important; }
    ::placeholder { color: #888 !important; }
`;
document.head.appendChild(styleFix);
console.log('--- 🧬 RENGA CORE v1.0.5 (FINAL FIX) READY ---');
window.RENGA_VERSION = '1.0.5';

// Mobile Menu Toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileBtn?.addEventListener('click', () => {
    navLinks?.classList.toggle('active');
    mobileBtn.classList.toggle('active');
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const targetElement = document.querySelector(href);
        if (targetElement) {
            navLinks?.classList.remove('active');
            mobileBtn?.classList.remove('active');

            const navElement = document.getElementById('main-nav');
            const offsetNav = navElement ? navElement.offsetHeight : 0;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offsetNav;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
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
