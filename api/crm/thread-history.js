/**
 * 🧬 API: GET /api/crm/thread-history
 * Purpose: Retrieve complete conversation thread for a user
 * Features: Includes original message, all replies, and attachments
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
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
        if (msgError) {
            console.error('Messages query error:', msgError);
            throw msgError;
        }
        console.log('Messages fetched:', messages?.length || 0);

        // 2. Get all replies for this user/message (may not exist yet)
        let replies = [];
        try {
            console.log('Fetching replies for messageId:', messageId, 'or email:', email);

            let repliesQuery = supabase
                .from('crm_replies')
                .select('*')
                .order('created_at', { ascending: true });

            if (messageId) {
                repliesQuery = repliesQuery.eq('message_id', messageId);
            } else {
                repliesQuery = repliesQuery.eq('user_email', email);
            }

            const { data: repliesData, error: repError } = await repliesQuery;

            console.log('Replies query result:', {
                data: repliesData,
                error: repError,
                count: repliesData?.length || 0
            });

            if (!repError && repliesData) {
                replies = repliesData;
                console.log('Replies loaded successfully:', replies.length);
            } else {
                console.warn('Replies query warning:', repError);
            }
        } catch (repErr) {
            console.error('Replies fetch EXCEPTION:', repErr);
        }

        // 3. Combine and format thread
        if (messages && messages.length > 0) {
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
        }

        if (replies && replies.length > 0) {
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
        }

        // 4. Sort by date
        thread.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        console.log('Thread loaded successfully:', { messageCount: messages?.length || 0, replyCount: replies?.length || 0, totalThread: thread.length });

        res.status(200).json({ success: true, thread });
    } catch (error) {
        console.error('Thread history error:', error);
        res.status(500).json({ error: error.message, details: error.toString() });
    }
}
