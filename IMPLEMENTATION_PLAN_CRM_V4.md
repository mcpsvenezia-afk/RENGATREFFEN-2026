# IMPLEMENTATION PLAN - CRM v4.0 (Attachments & UI Refresh)

## 1. Database & Storage Setup
- [ ] **SQL**: Create `crm_attachments` table to link files to registrations or messages.
- [ ] **Storage**: Ensure `attachments` bucket exists in Supabase.

## 2. Homepage (ContactForm) Integration
- [ ] **Logic**: Connect `ContactForm.jsx` to Supabase `messages` table.
- [ ] **Feature**: Add multi-file upload input.
- [ ] **Storage**: Upload files to `attachments/messages/{id}/...`.
- [ ] **Persistence**: Save file URLs in the message record.

## 3. Dashboard UI Differentiation
- [ ] **Visuals**: Change message tab/list theme (e.g., Blue/Cyan instead of Yellow/Fuchsia).
- [ ] **Icons**: Use distinct icons for messages (e.g., ✉️) vs registrations (e.g., 🏍️).

## 4. Dashboard CRM Sidecar
- [ ] **Feature**: Add "ALLEGATI" (Attachments) section in `comp-crm-panel.jsx`.
- [ ] **Upload**: Allow drag & drop or click to upload files for the active record.
- [ ] **Manager**: List uploaded files with download links and delete capability.

## 5. Deployment
- [ ] **Commit**: Push changes and verify on Vercel.
