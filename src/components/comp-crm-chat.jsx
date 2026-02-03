/**
 * 🧬 COMPONENT: CRM Chat Thread v1.0
 * Purpose: WhatsApp-style chat interface for CRM messages
 * Features: Thread history, attachments display, reply system
 */

import React, { useState, useEffect, useRef } from 'react';

export function CRMChatThread({ message, onClose }) {
    const [thread, setThread] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchThread();
    }, [message.id]);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thread]);

    async function fetchThread() {
        setLoading(true);
        try {
            console.log('Fetching thread for message:', message.id);
            const res = await fetch(`/api/crm/thread-history?messageId=${message.id}`);
            console.log('API Response status:', res.status);

            const data = await res.json();
            console.log('API Response data:', data);

            if (data.success) {
                setThread(data.thread);
                console.log('Thread loaded:', data.thread.length, 'messages');
            } else {
                console.error('API returned error:', data.error);
                alert('Errore caricamento conversazione: ' + (data.error || 'Errore sconosciuto'));
            }
        } catch (err) {
            console.error('Fetch thread error:', err);
            alert('Errore di connessione: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function sendReply() {
        if (!replyText.trim()) return;
        setSending(true);

        const tempReply = {
            id: 'temp-' + Date.now(),
            type: 'reply',
            direction: 'outbound',
            content: replyText,
            sender: 'Admin',
            email: message.email,
            created_at: new Date().toISOString()
        };

        try {
            // Optimistic update: add reply immediately to UI
            setThread(prev => [...prev, tempReply]);
            setReplyText('');

            const res = await fetch('/api/crm/send-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: message.id,
                    userEmail: message.email,
                    userName: message.name,
                    content: tempReply.content,
                    adminName: 'Admin'
                })
            });

            const data = await res.json();

            if (data.success) {
                console.log('Reply sent successfully:', data.message);
                // Refresh thread to get server version
                await fetchThread();
            } else {
                console.error('API returned error:', data.error);
                alert('Errore invio risposta: ' + (data.error || 'Errore sconosciuto'));
                // Remove optimistic update on error
                setThread(prev => prev.filter(item => item.id !== tempReply.id));
            }
        } catch (err) {
            console.error('Send reply error:', err);
            alert('Errore di connessione: ' + err.message);
            // Remove optimistic update on error
            setThread(prev => prev.filter(item => item.id !== tempReply.id));
        } finally {
            setSending(false);
        }
    }

    const renderAttachment = (att) => {
        const isImage = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);
        const isPDF = att.type === 'application/pdf' || att.name?.endsWith('.pdf');

        if (isImage) {
            return (
                <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.imageThumbnail}
                >
                    <img
                        src={att.url}
                        alt={att.name}
                        style={styles.thumbnailImg}
                    />
                </a>
            );
        }

        return (
            <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.docAttachment}
            >
                <span style={{ fontSize: '1.5rem' }}>{isPDF ? '📄' : '📎'}</span>
                <span style={styles.docName}>{att.name}</span>
            </a>
        );
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.chatContainer}>
                {/* HEADER */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.headerTitle}>{message.name}</h2>
                        <p style={styles.headerEmail}>{message.email}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                {/* CHAT SCROLL AREA */}
                <div ref={scrollRef} style={styles.scrollArea}>
                    {loading ? (
                        <div style={styles.loadingState}>
                            <div style={styles.spinner}></div>
                            <p>Caricamento conversazione...</p>
                        </div>
                    ) : (
                        thread.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    ...styles.messageRow,
                                    justifyContent: item.direction === 'outbound' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div style={{
                                    ...styles.messageBubble,
                                    ...(item.direction === 'outbound' ? styles.outboundBubble : styles.inboundBubble)
                                }}>
                                    <div style={styles.messageContent}>
                                        {item.content}
                                    </div>

                                    {/* ATTACHMENTS */}
                                    {item.attachments && item.attachments.length > 0 && (
                                        <div style={styles.attachmentsContainer}>
                                            {item.attachments.map((att, attIdx) => (
                                                <div key={attIdx} style={styles.attachmentItem}>
                                                    {renderAttachment(att)}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={styles.messageTime}>
                                        {new Date(item.created_at).toLocaleTimeString('it-IT', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* REPLY FOOTER */}
                <div style={styles.footer}>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Scrivi una risposta..."
                        style={styles.textarea}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendReply();
                            }
                        }}
                    />
                    <button
                        onClick={sendReply}
                        disabled={sending || !replyText.trim()}
                        style={{
                            ...styles.sendBtn,
                            opacity: sending || !replyText.trim() ? 0.5 : 1
                        }}
                    >
                        {sending ? '⏳' : '📤'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    chatContainer: {
        width: '100%',
        maxWidth: '800px',
        height: '90vh',
        maxHeight: '900px',
        background: '#1a1b26',
        borderRadius: '30px',
        border: '1px solid #2f334d',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 30px 100px rgba(0,0,0,0.8)'
    },
    header: {
        background: 'linear-gradient(135deg, #16161e, #1a1b26)',
        borderBottom: '1px solid #2f334d',
        padding: '30px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        color: '#00E5FF',
        fontSize: '1.8rem',
        fontWeight: 900,
        margin: 0
    },
    headerEmail: {
        color: '#888',
        fontSize: '0.9rem',
        margin: '5px 0 0 0'
    },
    closeBtn: {
        background: 'rgba(255,68,68,0.1)',
        border: '2px solid #ff4444',
        color: '#ff4444',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        fontSize: '1.5rem',
        cursor: 'pointer',
        transition: '0.3s'
    },
    scrollArea: {
        flex: 1,
        overflowY: 'auto',
        padding: '30px',
        background: '#0f0f14',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    loadingState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#666',
        gap: '20px'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #333',
        borderTop: '4px solid #00E5FF',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    messageRow: {
        display: 'flex',
        marginBottom: '10px'
    },
    messageBubble: {
        maxWidth: '70%',
        padding: '18px 22px',
        borderRadius: '20px',
        position: 'relative'
    },
    inboundBubble: {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff'
    },
    outboundBubble: {
        background: 'linear-gradient(135deg, #00E5FF, #008ba3)',
        color: '#000',
        fontWeight: 600
    },
    messageContent: {
        fontSize: '1.05rem',
        lineHeight: '1.5',
        wordWrap: 'break-word'
    },
    messageTime: {
        fontSize: '0.7rem',
        opacity: 0.6,
        marginTop: '8px',
        textAlign: 'right'
    },
    attachmentsContainer: {
        marginTop: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    attachmentItem: {
        display: 'flex'
    },
    imageThumbnail: {
        display: 'block',
        width: '100px',
        height: '100px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.2)',
        cursor: 'pointer',
        transition: '0.3s'
    },
    thumbnailImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    docAttachment: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: '0.3s'
    },
    docName: {
        fontSize: '0.9rem',
        fontWeight: 600,
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    footer: {
        borderTop: '1px solid #2f334d',
        padding: '25px 30px',
        background: '#16161e',
        display: 'flex',
        gap: '15px',
        alignItems: 'flex-end'
    },
    textarea: {
        flex: 1,
        background: '#0f0f14',
        border: '2px solid #2f334d',
        borderRadius: '20px',
        padding: '18px 22px',
        color: '#fff',
        fontSize: '1rem',
        resize: 'none',
        minHeight: '60px',
        maxHeight: '150px',
        fontFamily: 'Inter, sans-serif',
        outline: 'none'
    },
    sendBtn: {
        background: '#00E5FF',
        border: 'none',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        fontSize: '1.5rem',
        cursor: 'pointer',
        transition: '0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};
