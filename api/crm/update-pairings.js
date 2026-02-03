/**
 * 🧬 API: POST /api/crm/update-pairings
 * Purpose: Manually trigger team auto-pairing
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🤝 Executing team auto-pairing...');

        // Call the Supabase function
        const { data, error } = await supabase.rpc('auto_pair_teams');

        if (error) {
            console.error('Auto-pairing error:', error);
            throw error;
        }

        console.log('✅ Auto-pairing completed successfully');

        res.status(200).json({
            success: true,
            message: 'Accoppiamenti aggiornati con successo'
        });

    } catch (error) {
        console.error('Update pairings error:', error);
        res.status(500).json({
            error: error.message,
            details: error.toString()
        });
    }
}
