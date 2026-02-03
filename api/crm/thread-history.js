/**
 * 🧬 API: GET /api/crm/thread-history
 * Purpose: Retrieve complete conversation thread for a user
 * Features: Includes original message, all replies, and attachments
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, messageId } = req.query;

    if (!email && !messageId) {
        return res.status(400).json({ error: 'Email or messageId required' });
    }

    try {
        let thread = [];

        // 1. Get original message(s)
        let messagesQuery = supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (messageId) {
            messagesQuery = messagesQuery.eq('id', messageId);
        } else {
            messagesQuery = messagesQuery.eq('email', email);
        }

        const { data: messages, error: msgError } = await messagesQuery;
        if (msgError) throw msgError;

        // 2. Get all replies for this user/message
        let repliesQuery = supabase
            .from('crm_replies')
            .select('*')
            .order('created_at', { ascending: true });

        if (messageId) {
            repliesQuery = repliesQuery.eq('message_id', messageId);
        } else {
            repliesQuery = repliesQuery.eq('user_email', email);
        }

        const { data: replies, error: repError } = await repliesQuery;
        if (repError) throw repError;

        // 3. Combine and format thread
        messages.forEach(msg => {
            thread.push({
                id: msg.id,
                type: 'message',
                direction: 'inbound',
                content: msg.message,
                sender: msg.name,
                email: msg.email,
                attachments: msg.attachments || [],
                created_at: msg.created_at
            });
        });

        replies.forEach(reply => {
            thread.push({
                id: reply.id,
                type: 'reply',
                direction: reply.direction,
                content: reply.content,
                sender: reply.direction === 'outbound' ? reply.admin_name : reply.user_email,
                email: reply.user_email,
                created_at: reply.created_at
            });
        });

        // 4. Sort by date
        thread.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        res.status(200).json({ success: true, thread });
    } catch (error) {
        console.error('Thread history error:', error);
        res.status(500).json({ error: error.message });
    }
}
