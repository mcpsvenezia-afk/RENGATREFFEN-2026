/**
 * 🧬 PLUGIN: REGISTRATION ENGINE v1.0.0
 * Goal: Handle team registrations on iscrizioni.html and save to Supabase
 * Target: #registration-form-page
 */

import { supabase } from '../lib/supabaseClient.js';

export function initRegistrationEngine() {
    console.log('[PLUGIN] Registration Engine v1.0.0 - INITIALIZING');

    const form = document.getElementById('registration-form-page');
    if (!form) {
        console.log('[PLUGIN] Registration Engine: Form #registration-form-page not found. Skipping.');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Feedback with SweetAlert2
        // @ts-ignore
        if (window.Swal) {
            // @ts-ignore
            window.Swal.fire({
                title: 'Invio in corso...',
                text: 'Stiamo salvando la tua iscrizione.',
                allowOutsideClick: false,
                didOpen: () => {
                    // @ts-ignore
                    window.Swal.showLoading();
                }
            });
        }

        const formData = new FormData(form);

        // Mapping fields to 'registrations' table
        // Following PROJECT_GOAL_BLITZ_REG_v1 + Form Fields
        const registrationData = {
            team_name: formData.get('team_name'),
            nome: formData.get('p1_name'),
            email: formData.get('p1_email'),
            partner_name: formData.get('p2_name'),
            partner_email: formData.get('p2_email'), // Extended
            moto: formData.get('moto'),              // Extended
            telefono: formData.get('phone'),
            created_at: new Date().toISOString()
        };

        try {
            console.log('[PLUGIN] Registration Engine: Sending data to Supabase...', registrationData);

            const { error } = await supabase
                .from('registrations')
                .insert([registrationData]);

            if (error) throw error;

            console.log('[PLUGIN] Registration Engine: SUCCESS');

            // Success Notification
            // @ts-ignore
            if (window.Swal) {
                // @ts-ignore
                window.Swal.fire({
                    icon: 'success',
                    title: 'Pre-Iscrizione Inviata!',
                    text: 'Riceverai un\'email con le istruzioni per il pagamento a breve.',
                    confirmButtonColor: '#ffcc00'
                });
            } else {
                alert('Iscrizione Inviata con successo!');
            }

            // Reset form
            // @ts-ignore
            form.reset();

        } catch (error) {
            console.error('[PLUGIN] Registration Engine: ERROR', error);

            // Error Notification
            // @ts-ignore
            if (window.Swal) {
                // @ts-ignore
                window.Swal.fire({
                    icon: 'error',
                    title: 'Ops! Errore',
                    text: error.message || 'Errore durante il salvataggio. Riprova più tardi.',
                    confirmButtonColor: '#ffcc00'
                });
            } else {
                alert('Errore nell\'invio dell\'iscrizione.');
            }
        }
    });

    console.log('[PLUGIN] Registration Engine v1.0.0 - READY');
}
