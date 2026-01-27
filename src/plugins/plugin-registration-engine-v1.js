/**
 * 🧬 PLUGIN: REGISTRATION ENGINE v1.1.0
 * Goal: Handle advanced team registrations using Dynamic Form Engine
 * Target: #registration-form-outlet
 */

import { supabase } from '../lib/supabaseClient.js';
import { renderDynamicForm } from './dynamic-form-engine-v1.1.0.js';
import { sendWelcomeEmail } from '../core/logic-email-v1.js';

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
                const attachments = [];

                // 🧬 UNIVERSAL FILE UPLOAD HANDLING
                for (let key in formData) {
                    const value = formData[key];
                    if (value instanceof File && value.size > 0) {
                        const file = value;
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

                        // Storage Bucket Selection (photos for profile, attachments for docs)
                        const bucket = (key === 'pilot_photo_url' || key === 'pilot_photo') ? 'registrations' : 'attachments';
                        const filePath = `${key}/${fileName}`;

                        console.log(`[PLUGIN] Uploading ${key}: ${file.name} to bucket ${bucket}...`);

                        const { error: uploadError } = await supabase.storage
                            .from(bucket)
                            .upload(filePath, file);

                        if (uploadError) throw new Error(`Caricamento ${key} fallito: ` + uploadError.message);

                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(filePath);

                        if (key === 'pilot_photo_url' || key === 'pilot_photo') {
                            cleanedData.pilot_photo = publicUrl; // Save to correct DB column
                            delete cleanedData.pilot_photo_url; // Remove wrong key if present
                        } else {
                            // Collect document for crm_attachments
                            attachments.push({
                                file_url: publicUrl,
                                file_name: file.name,
                                file_size: file.size,
                                field_name: key
                            });
                            // Remove from cleanedData to avoid DB error in registrations table
                            delete cleanedData[key];
                        }
                    } else if (value instanceof File) {
                        // Empty file input
                        delete cleanedData[key];
                    }
                }

                // Save registration to Supabase
                const { data: regData, error: regError } = await supabase
                    .from('registrations')
                    .insert([cleanedData])
                    .select();

                if (regError) throw regError;

                const registrationId = regData[0].id;

                // Save Attachments to crm_attachments
                if (attachments.length > 0) {
                    console.log(`[PLUGIN] Saving ${attachments.length} attachments for reg: ${registrationId}`);
                    const attachmentsToInsert = attachments.map(a => ({
                        registration_id: registrationId,
                        file_url: a.file_url,
                        file_name: a.file_name,
                        field_name: a.field_name,
                        file_size: a.file_size
                    }));

                    const { error: attError } = await supabase
                        .from('crm_attachments')
                        .insert(attachmentsToInsert);

                    if (attError) {
                        console.warn('[PLUGIN] registration saved, but attachments failed', attError);
                    }
                }

                // 🧬 AUTOMATED EMAIL NOTIFICATION
                try {
                    console.log('[PLUGIN] Registration Engine: Triggering email confirmation for', cleanedData.email);
                    await sendWelcomeEmail(cleanedData);
                } catch (emailErr) {
                    console.warn('[PLUGIN] Email trigger failed (silent)', emailErr);
                }

                // Success Notification
                // @ts-ignore
                if (window.Swal) {
                    // @ts-ignore
                    window.Swal.fire({
                        icon: 'success',
                        title: 'Registrazione completata!',
                        text: 'Abbiamo ricevuto i tuoi dati. Controlla la tua email per la conferma.',
                        confirmButtonColor: '#FFCC00',
                        timer: 5000,
                        timerProgressBar: true,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'index.html';
                    });
                } else {
                    setTimeout(() => { window.location.href = 'index.html'; }, 3000);
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
