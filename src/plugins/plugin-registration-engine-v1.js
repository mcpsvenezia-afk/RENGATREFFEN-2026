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

            // UI Feedback
            // @ts-ignore
            if (window.Swal) {
                // @ts-ignore
                window.Swal.fire({
                    title: 'Processamento in corso...',
                    text: 'Caricamento foto e salvataggio dati...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        // @ts-ignore
                        window.Swal.showLoading();
                    }
                });
            }

            try {
                const cleanedData = { ...formData };

                // 🧬 PHOTO UPLOAD LOGIC
                if (formData.pilot_photo instanceof File && formData.pilot_photo.size > 0) {
                    const file = formData.pilot_photo;
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `photos/${fileName}`;

                    // Upload to Storage (Ensure 'registrations' bucket exists)
                    const { error: uploadError } = await supabase.storage
                        .from('registrations')
                        .upload(filePath, file);

                    if (uploadError) throw new Error('Caricamento foto fallito: ' + uploadError.message);

                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('registrations')
                        .getPublicUrl(filePath);

                    cleanedData.pilot_photo = publicUrl;
                } else if (cleanedData.pilot_photo instanceof File) {
                    // File input exists but no file was actually chosen
                    cleanedData.pilot_photo = "";
                }

                // Save entries to Supabase
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
