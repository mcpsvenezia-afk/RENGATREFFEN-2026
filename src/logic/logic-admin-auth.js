/**
 * 🧬 LOGIC: Admin Auth & Session Management
 * Goal: Handle Supabase Magic Link and session state
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAdminAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginWithMagicLink = async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard'
            }
        });
        return { error };
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return { user, loading, loginWithMagicLink, logout };
}
