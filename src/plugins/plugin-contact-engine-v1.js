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

        const files = formData.getAll('attachments');

        try {
            console.log('[PLUGIN] Contact Engine: Sending data to Supabase...', data);
            const { data: msgData, error } = await supabase
                .from('messages')
                .insert([data])
                .select();

            if (error) throw error;

            const messageId = msgData[0].id;

            // Handle File Uploads
            if (files && files.length > 0 && files[0].size > 0) {
                console.log(`[PLUGIN] Contact Engine: Processing ${files.length} attachments...`);

                for (const file of files) {
                    if (file.size === 0) continue;

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `messages/${messageId}/${fileName}`;

                    // 1. Upload to Storage (bucket: 'attachments')
                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error(`[PLUGIN] Upload failed for ${file.name}`, uploadError);
                        continue;
                    }

                    // 2. Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(filePath);

                    // 3. Save to crm_attachments table
                    const { error: dbError } = await supabase
                        .from('crm_attachments')
                        .insert([{
                            message_id: messageId,
                            file_url: publicUrl,
                            file_name: file.name,
                            file_size: file.size
                        }]);

                    if (dbError) {
                        console.error(`[PLUGIN] DB attachment record failed for ${file.name}`, dbError);
                    }
                }
            }

            console.log('[PLUGIN] Contact Engine: SUCCESS');

            // Success Notification
            // @ts-ignore
            if (window.Swal) {
                // @ts-ignore
                window.Swal.fire({
                    icon: 'success',
                    title: 'Messaggio Inviato!',
                    text: 'Grazie per averci contattato. Ti risponderemo il prima possibile.',
                    confirmButtonColor: '#00E5FF' // Adjusted to message theme
                });
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
                    confirmButtonColor: '#00E5FF'
                });
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
