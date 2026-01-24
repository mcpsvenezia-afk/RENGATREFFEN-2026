import './style.css'
import './style.css'
import { supabase } from './lib/supabaseClient'
import './plugins/renga-dev-loader-v1.js' // 🧬 INJECT DEV MODE

// TEST_CONNECTION_v1
(async () => {
    console.log('--- TEST_CONNECTION_v1 START ---');
    try {
        const { error } = await supabase.from('test').select('*');
        if (error) {
            // PGRST116 = Tabella non trovata
            if (error.code === 'PGRST116' || error.message.includes('not found')) {
                console.log('✅ TEST SUPERATO: Tabella "test" non trovata. Chiavi VALIDE.');
            } else {
                console.error('❌ TEST FALLITO: Errore di autenticazione/chiavi:', error);
            }
        } else {
            console.log('✅ TEST SUPERATO: Connessione riuscita.');
        }
    } catch (err) {
        console.error('❌ TEST FALLITO: Errore imprevisto:', err);
    }
    console.log('--- TEST_CONNECTION_v1 END ---');
})();

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
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            navLinks?.classList.remove('active');
            mobileBtn?.classList.remove('active');

            const offsetNav = document.getElementById('main-nav')?.offsetHeight || 0;
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
        const isActive = item?.classList.contains('active');

        // Close all other items
        document.querySelectorAll('.accordion-item').forEach(otherItem => {
            otherItem.classList.remove('active');
        });

        // Toggle current item
        if (!isActive) {
            item?.classList.add('active');
        }
    });
});

// Form Submission handling (Supabase)
const regForm = document.getElementById('registration-form') as HTMLFormElement;
regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // @ts-ignore (SweetAlert2 is loaded via CDN)
    Swal.fire({
        title: 'Invio in corso...',
        text: 'Salvataggio iscrizione su Supabase',
        allowOutsideClick: false,
        didOpen: () => {
            // @ts-ignore
            Swal.showLoading();
        }
    });

    const formData = new FormData(regForm);
    const registrationData = {
        nome: formData.get('p1_name'),
        cognome: formData.get('p1_name'), // In the original form, it's combined or separate?
        email: formData.get('p1_email'),
        telefono: formData.get('phone'),
        partner_name: formData.get('p2_name'),
        created_at: new Date().toISOString()
    };

    // Note: The original form has p1_name, p2_name, etc.
    // Matching with PROJECT_GOAL_BLITZ_REG_v1 schema: nome, cognome, email, telefono, partner_name

    try {
        const { error } = await supabase
            .from('registrations')
            .insert([registrationData]);

        if (error) throw error;

        // @ts-ignore
        Swal.fire({
            icon: 'success',
            title: 'Iscrizione Inviata!',
            text: 'I tuoi dati sono stati salvati correttamente su Supabase.',
            confirmButtonColor: '#ffcc00'
        });
        regForm.reset();

    } catch (error: any) {
        console.error('Supabase Error:', error);
        // @ts-ignore
        Swal.fire({
            icon: 'error',
            title: 'Ops! Errore Supabase',
            text: error.message || 'Errore durante il salvataggio.',
            confirmButtonColor: '#ffcc00'
        });
    }
});
// Contact Form Submission (Mock for now)
const contactForm = document.getElementById('contact-form-page');
contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    // @ts-ignore
    Swal.fire({
        icon: 'success',
        title: 'Messaggio Inviato!',
        text: 'Grazie per averci contattato. Ti risponderemo il prima possibile.',
        confirmButtonColor: '#ffcc00'
    });
    (contactForm as HTMLFormElement).reset();
});

// Registration Form Submission (Mock for now - DB integration coming soon)
const regFormPage = document.getElementById('registration-form-page');
regFormPage?.addEventListener('submit', (e) => {
    e.preventDefault();
    // @ts-ignore
    Swal.fire({
        icon: 'success',
        title: 'Pre-Iscrizione Inviata!',
        text: 'Riceverai un\'email con le istruzioni per il pagamento a breve.',
        confirmButtonColor: '#ffcc00'
    });
    (regFormPage as HTMLFormElement).reset();
});
