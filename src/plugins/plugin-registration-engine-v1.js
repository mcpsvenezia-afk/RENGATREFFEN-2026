/**
 * 🧬 PLUGIN: REGISTRATION ENGINE v1.1.0
 * Goal: Handle advanced team registrations using Dynamic Form Engine
 * Target: #registration-form-outlet
 */

import { supabase } from '../lib/supabaseClient.js';
import { renderDynamicForm } from './dynamic-form-engine-v1.1.0.js';

export async function initRegistrationEngine() {
    console.log('[PLUGIN] Registration Engine v1.1.0 - INITIALIZING');

    const outlet = document.getElementById('registration-form-outlet');
    if (!outlet) {
        console.log('[PLUGIN] Registration Engine: Outlet #registration-form-outlet not found. Skipping.');
        return;
    }

    try {
        // Load Schema from public directory
        const response = await fetch('/schemas/registration-schema-v1.1.0.json');
        const schema = await response.json();

        // Render Form
        renderDynamicForm(schema, 'registration-form-outlet', async (formData) => {
            console.log('[PLUGIN] Registration Engine: Form Submitted', formData);

            // 🧬 DATA CLEANING: Evitiamo di inviare oggetti File grezzi che Supabase non accetterebbe come TEXT
            const cleanedData = { ...formData };
            if (cleanedData.pilot_photo instanceof File) {
                // Per ora salviamo solo il nome del file o un segnaposto
                // Lo Storage verrà implementato nello step successivo
                cleanedData.pilot_photo = cleanedData.pilot_photo.name || "";
            }

            // UI Feedback
            // @ts-ignore
            if (window.Swal) {
                // @ts-ignore
                window.Swal.fire({
                    title: 'Salvataggio in corso...',
                    text: 'Stiamo processando la tua iscrizione per il 2026.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        // @ts-ignore
                        window.Swal.showLoading();
                    }
                });
            }

            try {
                // Save to Supabase
                const { error } = await supabase
                    .from('registrations')
                    .insert([cleanedData]);

                if (error) throw error;

                // Success Notification
                // @ts-ignore
                if (window.Swal) {
                    // @ts-ignore
                    window.Swal.fire({
                        icon: 'success',
                        title: 'Iscrizione Ricevuta!',
                        text: 'Verrai ricontattato via email per completare il pagamento.',
                        confirmButtonColor: '#FFCC00'
                    }).then(() => {
                        window.location.href = 'index.html';
                    });
                } else {
                    alert('Iscrizione salvata con successo!');
                    window.location.href = 'index.html';
                }

            } catch (err) {
                console.error('[PLUGIN] Registration Engine: DB Error', err);
                // @ts-ignore
                if (window.Swal) {
                    // @ts-ignore
                    window.Swal.fire({
                        icon: 'error',
                        title: 'Errore durante il salvataggio',
                        text: err.message || 'Riprova più tardi.',
                        confirmButtonColor: '#E6007E'
                    });
                }
            }
        });

    } catch (error) {
        console.error('[PLUGIN] Registration Engine: Fatal Error', error);
    }

    console.log('[PLUGIN] Registration Engine v1.1.0 - READY');
}
