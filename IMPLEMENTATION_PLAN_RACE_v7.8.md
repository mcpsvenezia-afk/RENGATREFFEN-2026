# IMPLEMENTATION PLAN - RACE ENGINE v7.8 (The Silent Engine)

## 1. Database Schema Extensions
- [ ] **SQL**: Update `registrations` table with `card_color` and `target_times` (JSONB).
- [ ] **SQL**: Create `race_logs` table for GPS/Timestamp captures.
- [ ] **SQL**: Initialize `race_params` in `settings` table (event_params).

## 2. Admin Settings (comp-admin-settings.jsx)
- [ ] **UI**: Add inputs for Start Times (Caccia, Discovery, 4x4).
- [ ] **UI**: Add input for Team Interval (minutes).
- [ ] **UI**: Add inputs for Offsets (Red, Yellow, Purple).
- [ ] **UI**: Add input for Photo Skipped Penalty.

## 3. Race Logic (Background Calculation)
- [ ] **Logic**: Function to assign `card_color` in rotation (1, 2, 3 -> Red, Yellow, Purple).
- [ ] **Logic**: Function to calculate `target_times` for each registered team based on their position, category start time, and card offset.
- [ ] **Trigger**: Add a "RIGENERA TEMPI GARA" button in Settings to apply these calculations to all confirmed registrations.

## 4. Team Web-App (race-app.html)
- [ ] **Core**: New HTML file with Renga Aesthetics.
- [ ] **Auth**: Login via Bib Number (Numero Gara).
- [ ] **Display**: "MUTA" Mode - Show ONLY Color and Current Photo Number (e.g., "FOTO 1 - SCHEDA ROSSA").
- [ ] **GPS**: Integration to capture coordinates.
- [ ] **Action**: "SCATTA E REGISTRA" button to post to `race_logs`.

## 5. Dashboard Classifica (comp-admin-rankings.jsx)
- [ ] **UI**: Compare `race_logs.recorded_at` with `registrations.target_times`.
- [ ] **Math**: Calculate points (1 sec = 1 point).
- [ ] **Display**: Leaderboard sorted by lower score.

## 6. Security
- [ ] **Validation**: Ensure `race-app.html` is lightweight and works on mobile.
