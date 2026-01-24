import './style.css'
import { supabase } from './lib/supabaseClient'

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

// Form Submission handling (Real PHP Backend)
const regForm = document.getElementById('registration-form') as HTMLFormElement;
regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Mostra il caricamento con SweetAlert2
    // @ts-ignore (SweetAlert2 is loaded via CDN)
    Swal.fire({
        title: 'Invio in corso...',
        text: 'Stiamo processando la tua iscrizione',
        allowOutsideClick: false,
        didOpen: () => {
            // @ts-ignore
            Swal.showLoading();
        }
    });

    const formData = new FormData(regForm);

    try {
        const response = await fetch('process_registration.php', {
            method: 'POST',
            body: formData
        });

        const text = await response.text();

        // Verifica se la risposta è codice PHP grezzo (accade in locale con Vite)
        if (text.includes('<?php')) {
            console.log("Ambiente locale rilevato: simulazione successo invio.");
            // @ts-ignore
            Swal.fire({
                icon: 'success',
                title: 'Iscrizione Inviata!',
                text: 'Bravo! (Simulazione locale attiva). Su Aruba la mail verrà inviata realmente.',
                confirmButtonColor: '#ffcc00'
            });
            regForm.reset();
            return;
        }

        const result = JSON.parse(text);

        if (response.ok && result.status === 'success') {
            // @ts-ignore
            Swal.fire({
                icon: 'success',
                title: 'Iscrizione Inviata!',
                text: 'La tua richiesta è stata presa in carico. Riceverai un\'email con i dettagli a breve.',
                confirmButtonColor: '#ffcc00'
            });
            regForm.reset();
        } else {
            throw new Error(result.message || 'Errore durante l\'invio');
        }
    } catch (error: any) {
        // @ts-ignore
        Swal.fire({
            icon: 'error',
            title: 'Ops! Qualcosa è andato storto',
            text: error.message || 'Non è stato possibile inviare il modulo. Riprova più tardi o scrivici via email.',
            confirmButtonColor: '#ffcc00'
        });
    }
});
