/**
 * 🧬 PLUGIN: CONTACT ENGINE v1.0.0
 * Goal: Handle contact form submissions on contatti.html and save to Supabase
 * Target: #contact-form-page
 */

import { supabase } from '../lib/supabaseClient.js';

export function initContactEngine() {
    console.log('[PLUGIN] Contact Engine v1.0.0 - INITIALIZING');

    const form = document.getElementById('contact-form-page');
    if (!form) {
        console.log('[PLUGIN] Contact Engine: Form #contact-form-page not found. Skipping.');
        return;
    }

    form.addEventListener('submit', async (e) => {
        console.log('[PLUGIN] Contact Engine: Submit Event Triggered');
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'INVIA MESSAGGIO';

        // Immediate Visual Feedback
        if (submitBtn) {
            submitBtn.textContent = 'ATTENDERE...';
            // @ts-ignore
            submitBtn.disabled = true;
        }

        // Handle with SweetAlert2 if available
        // @ts-ignore
        if (window.Swal) {
            // @ts-ignore
            window.Swal.fire({
                title: 'Invio in corso...',
                text: 'Stiamo salvando il tuo messaggio.',
                allowOutsideClick: false,
                didOpen: () => {
                    // @ts-ignore
                    window.Swal.showLoading();
                }
            });
        } else {
            console.log('[PLUGIN] Contact Engine: Swal not found, using console for loading state.');
        }

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message'),
            created_at: new Date().toISOString()
        };

        try {
            console.log('[PLUGIN] Contact Engine: Sending data to Supabase...', data);
            const { error } = await supabase
                .from('messages')
                .insert([data]);

            if (error) throw error;

            console.log('[PLUGIN] Contact Engine: SUCCESS');

            // Success Notification
            // @ts-ignore
            if (window.Swal) {
                // @ts-ignore
                window.Swal.fire({
                    icon: 'success',
                    title: 'Messaggio Inviato!',
                    text: 'Grazie per averci contattato. Ti risponderemo il prima possibile.',
                    confirmButtonColor: '#ffcc00'
                });
            } else {
                alert('Messaggio Inviato con successo!');
            }

            // Reset form
            // @ts-ignore
            form.reset();

        } catch (error) {
            console.error('[PLUGIN] Contact Engine: ERROR', error);

            // Error Notification
            // @ts-ignore
            if (window.Swal) {
                // @ts-ignore
                window.Swal.fire({
                    icon: 'error',
                    title: 'Ops! Errore',
                    text: error.message || 'Non è stato possibile inviare il messaggio. Riprova più tardi.',
                    confirmButtonColor: '#ffcc00'
                });
            } else {
                alert('Errore nell\'invio del messaggio.');
            }

        } finally {
            if (submitBtn) {
                submitBtn.textContent = originalText;
                // @ts-ignore
                submitBtn.disabled = false;
            }
        }
    });

    console.log('[PLUGIN] Contact Engine v1.0.0 - READY');
}
