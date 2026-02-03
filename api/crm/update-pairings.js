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

        // 1. Run the pairing logic
        const { error: rpcError } = await supabase.rpc('auto_pair_teams');
        if (rpcError) throw rpcError;

        // 2. Find newly confirmed teams that haven't received the email
        const { data: newTeams, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .eq('team_status', 'CONFIRMED')
            .eq('team_email_sent', false);

        if (fetchError) throw fetchError;

        console.log(`Found ${newTeams.length} registrations in newly confirmed teams.`);

        // 3. Group by team_id and send emails
        const teamsToNotify = {};
        newTeams.forEach(reg => {
            if (!reg.team_id) return;
            if (!teamsToNotify[reg.team_id]) teamsToNotify[reg.team_id] = [];
            teamsToNotify[reg.team_id].push(reg);
        });

        let emailsSent = 0;
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

        for (const teamId in teamsToNotify) {
            const members = teamsToNotify[teamId];
            if (members.length === 2) {
                console.log(`Sending confirmation email to team ${teamId}...`);

                try {
                    // Call the email API internally or just use the logic
                    // For simplicity in this environment, we'll fetch the internal API via node-fetch (if available) or just import logic
                    // But here we'll simulate the call to our new direct email API
                    const emailRes = await fetch(`${baseUrl}/api/crm/send-team-confirmation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pilotA: members[0], pilotB: members[1] })
                    });

                    if (emailRes.ok) {
                        // Mark as sent in DB
                        await supabase
                            .from('registrations')
                            .update({ team_email_sent: true })
                            .in('id', [members[0].id, members[1].id]);

                        emailsSent++;
                    }
                } catch (emailErr) {
                    console.error(`Failed to send email for team ${teamId}:`, emailErr);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Accoppiamenti aggiornati. Inviate ${emailsSent} email di conferma team.`,
            stats: { registrationsChecked: newTeams.length, emailsSent }
        });

    } catch (error) {
        console.error('Update pairings error:', error);
        res.status(500).json({
            error: error.message,
            details: error.toString()
        });
    }
}
