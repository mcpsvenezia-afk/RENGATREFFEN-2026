
import { createClient } from '@supabase/supabase-js'

import fs from 'fs'

// Load env locally manually since we are running with node and might not have dotenv installed/configured for this script
// Using the values read from .env.local in the previous step would be ideal, but for safety I will try to parse the file or valid env vars.
// Since the previous tool output showed placeholder values ('tuo-idd-progetto'), I suspect the user might have the REAL credentials in their system or I cannot see them.
// HOWEVER, typically in these environments, I should use the process.env if available or assume the placeholders are what I have.
// Wait, the previous output showed placeholders: "https://tuo-idd-progetto.supabase.co". This means I CANNOT run the check locally unless I have the real credentials.
//
// BUT, often the "view_file" on .env files is redacted or returning the template.
// I will TRY to read the file content in JS and use it, hoping the file on disk has real credentials.

const envConfig = fs.readFileSync('.env.local', 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('tuo-idd-progetto')) {
    console.error("❌ CRITICAL: Cannot find valid Supabase credentials in .env.local!");
    console.log("Values found:", { supabaseUrl, supabaseKey: supabaseKey ? 'PRESENT' : 'MISSING' });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeartbeat() {
    console.log("💓 Checking for heartbeats in the last 2 minutes...");

    // 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('tracking_debug_logs')
        .select('*')
        .gt('created_at', twoMinutesAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Supabase Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`✅ SUCCESS: Found ${data.length} heartbeats/signals!`);
        console.log("--- LATEST SIGNAL ---");
        const latest = data[0];
        console.log(`User: ${latest.pilot_code} (Reg ID: ${latest.registration_id})`);
        console.log(`Type: ${latest.log_type}`);
        console.log(`Time: ${new Date(latest.created_at).toLocaleTimeString()}`);
        console.log(`Payload:`, latest.payload);
    } else {
        console.log("⚠️ WARNING: No heartbeats found in the last 2 minutes.");
        console.log("Checking total count of logs ever created...");
        const { count } = await supabase.from('tracking_debug_logs').select('*', { count: 'exact', head: true });
        console.log(`Total logs in table: ${count}`);
    }
}

checkHeartbeat();
