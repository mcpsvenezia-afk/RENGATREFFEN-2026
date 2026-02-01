---
name: Supabase-Realtime-Radar v1
description: Protocol for implementing real-time tracking updates in the Admin Radar using Supabase Realtime subscriptions.
---

# Supabase Realtime Radar v1

## 🎯 Objective
Eliminate the need for manual refreshes in the Admin Radar by leveraging Supabase Realtime subscriptions to reflect pilot movements instantly.

## 📡 Realtime Rules

### 1. Subscription Channel
- Initialize a dedicated channel: `supabase.channel('tracking_changes')`.
- Subscribe to `INSERT` and `UPDATE` events on the tracking table (e.g., `live_tracking`).
- **Critical**: Ensure the table has "Realtime" enabled in Supabase Dashboard (replication settings).

### 2. Event Handling
- **Existing Pilot**: 
  - Locate the existing marker using `registration_id` + `pilot_code`.
  - Update position using `marker.setLatLng([newLat, newLng])`.
  - Apply a smooth transition if possible (Leaflet often handles `setLatLng` smoothly).
  - Update the marker's popup content with the new 'Last seen' timestamp.
- **New Pilot**:
  - If no marker exists for the ID, fetch the full registration details (needed for team name/color) and create a new marker. 
  - *Optimization*: Since fetching registration details per event might be slow, consider pre-fetching all registrations or fetching on-demand.

### 3. Fallback Mechanism (Safety Net)
- Realtime connections can drop.
- Implement a **Fallback Polling** interval (e.g., every 15 seconds).
- This ensures that if the socket disconnects silently, the map eventually catches up.

## 🛠️ Implementation Pattern

```javascript
const channel = supabase
    .channel('tracking_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_tracking' }, (payload) => {
        handleRealtimeUpdate(payload.new);
    })
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('✅ Realtime Radar Connected');
    });

// Fallback
setInterval(fetchFullSnapshot, 15000);
```
