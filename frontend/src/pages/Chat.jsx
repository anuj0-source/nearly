import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import {
    ArrowRight,
    RotateCw,
    Send,
    Shield,
    UserPlus,
    LogOut,
    Bell,
    Check,
    X,
    MessageCircle,
    BadgeCheck,
    Edit,
    Edit2,
    Trash,
    Reply,
    ChevronDown,
    CornerUpRight
} from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import GhostMark from "../components/GhostMark";
import HeaderIcons from "../components/HeaderIcons";
import { anonymousPeople } from "../data/mockData";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const playMatchSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

const playDeleteSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        const now = ctx.currentTime;
        
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

const ReceiveRequestIcon = ({ size = 22, strokeWidth = 1.75, color = "currentColor" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <mask id="badge-cutout">
            <rect width="100%" height="100%" fill="white" stroke="none" />
            <circle cx="17" cy="17" r="6.5" fill="black" stroke="none" />
        </mask>
        <g mask="url(#badge-cutout)">
            <circle cx="9" cy="7" r="4" />
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        </g>
        <circle cx="17" cy="17" r="5" />
        <path d="M17 14v6" />
        <path d="M14.5 17.5 17 20l2.5-2.5" />
    </svg>
);


// =================================================
// BACKEND URL
// =================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";


// =================================================
// MESSAGE TIME FORMATTER
// =================================================

const messageTimeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
});

const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const getMessageDateLabel = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
        return "Today";
    } else if (isSameDay(date, yesterday)) {
        return "Yesterday";
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString(undefined, { weekday: 'long' });
    } else {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
};


// =================================================
// CREATE CHAT MESSAGE
// =================================================

function createChatMessage({ id, idPrefix, sender, text, reply_of }) {
    const createdAt = new Date();
    const finalId = id !== undefined ? String(id) : `${idPrefix}-${createdAt.getTime()}`;

    return {
        id: finalId,
        local_id: finalId,
        sender,
        text,
        createdAt: createdAt.toISOString(),
        reply_of: (reply_of !== undefined && reply_of !== null) ? String(reply_of) : null,
    };
}


// =================================================
// EMOJI ONLY CHECK
// =================================================

const isEmojiOnly = (text) => {
    if (!text) return false;
    const stripped = text.replace(/\s/g, '');
    if (!stripped) return false;
    // Fast fail if it contains normal alphanumeric characters (to prevent "123" being large)
    if (/[a-zA-Z0-9]/i.test(stripped)) return false;
    return /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Emoji_Component}|\u200D)+$/u.test(stripped);
};

const EMOJI_INLINE_REGEX = /([\p{Extended_Pictographic}\p{Regional_Indicator}\u{200D}\p{Emoji_Modifier}\u{FE0F}]+)/gu;

    const formatMessageText = (text) => {
        if (!text) return null;
        // Split text by emojis. If you want normal text to wrap, 
        // we can add a word-break class or just return it inside a span.
        // It's mostly handled by CSS .bubble { word-break: break-word }
        const parts = text.split(EMOJI_INLINE_REGEX);
        return parts.map((part, i) => {
            if (i % 2 === 1) {
                return <span key={i} className="emoji-inline">{part}</span>;
            }
            return part;
        });
    };

// =================================================
// SCROLL MESSAGES
// =================================================

function scrollMessagesToBottom(
    messagesElement,
    behavior = "smooth"
) {
    messagesElement?.scrollTo({
        top: messagesElement.scrollHeight,
        behavior,
    });
}


// =================================================
// MATCH NOTICE ICON
// =================================================

function MatchNoticeIcon() {
    return (
        <svg
            className="notice-icon"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <circle
                cx="10"
                cy="11"
                r="3.25"
            />

            <path
                d="M4.75 23.25c.55-3.35 2.6-5.25 5.25-5.25s4.7 1.9 5.25 5.25"
            />

            <circle
                cx="22"
                cy="11"
                r="3.25"
            />

            <path
                d="M16.75 23.25c.55-3.35 2.6-5.25 5.25-5.25s4.7 1.9 5.25 5.25"
            />

            <path
                className="notice-icon-link"
                d="M13.45 14.1h5.1"
            />

            <path
                className="notice-icon-spark"
                d="M16 4.25v2.1M14.95 5.3h2.1"
            />
        </svg>
    );
}

function ChatSetupSkeleton() {
    return (
        <section className="chat-setup chat-setup-skeleton" aria-busy="true" aria-live="polite">
            <div className="chat-setup-visual" aria-hidden="true">
                <div className="ring r3" />
                <div className="ring r2" />
                <div className="ring r1" />
                <span className="pip p1" />
                <span className="pip p2" />
                <span className="pip p3" />
                <span className="pip p4" />
                <div className="skeleton-setup-core" />
            </div>

            <div className="chat-setup-side">
                <div className="chat-setup-title">
                    <div className="skeleton-setup-line skeleton-setup-title" />
                    <div className="skeleton-setup-line skeleton-setup-description" />
                    <div className="skeleton-setup-line skeleton-setup-description short" />
                </div>

                <div className="chat-setup-card">
                    <div className="chat-setup-foot">
                        <div className="skeleton-setup-button" />
                        <div className="skeleton-setup-privacy" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function EditPreview({ editingMessage, setEditingMessage }) {
    if (!editingMessage) return null;
    
    return (
        <div className="edit-preview" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', background: 'var(--surface)',
            borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid var(--accent)',
            fontSize: '13px'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--brand)' }}>
                    Editing Message
                </span>
                <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {editingMessage.text}
                </span>
            </div>
            <button type="button" onClick={() => setEditingMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'grid', placeItems: 'center' }}>
                <X size={16} />
            </button>
        </div>
    );
}

function ReplyPreview({ replyingTo, setReplyingTo, partnerName }) {
    if (!replyingTo) return null;
    
    return (
        <div className="reply-preview" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', background: 'var(--surface)',
            borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid var(--accent)',
            fontSize: '13px'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--brand)' }}>
                    {replyingTo.sender === 'me' ? 'You' : (replyingTo.senderName || partnerName || 'Them')}
                </span>
                <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {replyingTo.text}
                </span>
            </div>
            <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'grid', placeItems: 'center' }}>
                <X size={16} />
            </button>
        </div>
    );
}


// =================================================
// CHAT
// =================================================

function Chat() {

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const ws = useWebSocket();


    // =================================================
    // CHAT STATE
    // =================================================

    const [chatState, setChatState] = useState("setup");
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);

    const [match, setMatch] =
        useState(anonymousPeople[0]);

    const [messages, setMessages] =
        useState([]);

    const [message, setMessage] =
        useState("");



    const [isTyping, setIsTyping] =
        useState(false);

    const [partnerLeft, setPartnerLeft] =
        useState(false);


    const [friendRequests, setFriendRequests] =
        useState([]);
    const [friendRequestsLoading, setFriendRequestsLoading] = useState(false);

    const [contextMenu, setContextMenu] = useState(null);
    const [isMenuClosing, setIsMenuClosing] = useState(false);
    const touchTimerRef = useRef(null);
    const closingTimerRef = useRef(null);

    const handleContextMenu = (e, messageId, isMine = false) => {
        e.preventDefault();
        
        // If the menu is already open or closing for this exact message, just let it close
        if (contextMenu && contextMenu.messageId === messageId) {
            if (!isMenuClosing) {
                closeContextMenu();
            }
            return;
        }
        
        if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
        setIsMenuClosing(false);
        
        const rect = e.currentTarget.getBoundingClientRect();
        const menuWidth = 150;
        const menuHeight = 130;
        
        let x = rect.left > window.innerWidth / 2 ? rect.right - menuWidth : rect.left;
        let y = rect.bottom + 8;
        
        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (x < 10) x = 10;
        
        if (y + menuHeight > window.innerHeight - 12) {
            y = rect.top - menuHeight - 8;
        }
        // Final boundary clamp to prevent touching the bottom edge
        if (y + menuHeight > window.innerHeight - 12) {
            y = window.innerHeight - menuHeight - 12;
        }
        if (y < 12) y = 12;

        setContextMenu({
            mouseX: x,
            mouseY: y,
            messageId,
            isMine
        });
    };

    const swipeState = useRef({ startX: 0, startY: 0, currentX: 0, element: null, iconElement: null, messageId: null, isSwiping: false });

    const handleTouchStart = (e, messageId, isMine = false) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Add swipe logic
        if (e.touches && e.touches.length === 1) {
            const touch = e.touches[0];
            const bubble = e.currentTarget;
            const iconElement = bubble.parentElement.querySelector('.swipe-reply-icon');
            
            swipeState.current = {
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                element: bubble,
                iconElement: iconElement,
                messageId: messageId,
                isSwiping: true,
                isMine: isMine
            };
            bubble.style.transition = 'none';
            if (iconElement) {
                iconElement.style.transition = 'none';
                
                // Position the icon dynamically based on ownership
                const bubbleRect = bubble.getBoundingClientRect();
                const rowRect = bubble.parentElement.getBoundingClientRect();
                
                if (isMine) {
                    iconElement.style.left = `${bubbleRect.left - rowRect.left - 40}px`; 
                } else {
                    iconElement.style.left = `${bubbleRect.right - rowRect.left + 15}px`; 
                }
                iconElement.style.top = `${bubbleRect.top - rowRect.top + bubbleRect.height / 2 - 10}px`; // vertically centered
                iconElement.style.transform = 'scale(0.5) translateX(0px)';
            }
        }
        
        touchTimerRef.current = setTimeout(() => {
            const menuWidth = 150;
            const menuHeight = 130;
            
            let x = rect.left > window.innerWidth / 2 ? rect.right - menuWidth : rect.left;
            let y = rect.bottom + 8;
            
            if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
            if (x < 10) x = 10;
            
            if (y + menuHeight > window.innerHeight) {
                y = rect.top - menuHeight - 8;
            }

            setContextMenu({
                mouseX: x,
                mouseY: y,
                messageId,
                isMine
            });
        }, 500); // 500ms long press
    };

    const handleTouchMove = (e) => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }

        const state = swipeState.current;
        if (!state.isSwiping || !state.element || !e.touches || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;

        state.currentX = touch.clientX;

        // If scrolling vertically, cancel swipe
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
            state.isSwiping = false;
            state.element.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
            state.element.style.transform = 'translateX(0px)';
            if (state.iconElement) {
                state.iconElement.style.transition = 'all 0.2s ease';
                state.iconElement.style.opacity = '0';
                state.iconElement.style.transform = 'scale(0.5)';
            }
            return;
        }

        // Handle swiping based on message ownership
        const isMine = state.isMine;
        
        if (!isMine && deltaX > 0 && deltaX < 80) {
            // Swipe right for their messages
            state.element.style.transform = `translateX(${deltaX}px)`;
            if (state.iconElement) {
                const progress = Math.min(deltaX / 50, 1);
                state.iconElement.style.opacity = progress.toString();
                // Move the icon right with the bubble so it isn't covered
                state.iconElement.style.transform = `translateX(${deltaX}px) scale(${0.5 + progress * 0.5})`;
            }
        } else if (isMine && deltaX < 0 && deltaX > -80) {
            // Swipe left for my messages
            state.element.style.transform = `translateX(${deltaX}px)`;
            if (state.iconElement) {
                const progress = Math.min(Math.abs(deltaX) / 50, 1);
                state.iconElement.style.opacity = progress.toString();
                // Move the icon left with the bubble so it isn't covered
                state.iconElement.style.transform = `translateX(${deltaX}px) scale(${0.5 + progress * 0.5})`;
            }
        }
    };

    const handleTouchEnd = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }

        const state = swipeState.current;
        if (!state.isSwiping || !state.element) return;
        state.isSwiping = false;

        const deltaX = state.currentX - state.startX;

        // Snap back
        state.element.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        state.element.style.transform = 'translateX(0px)';
        if (state.iconElement) {
            state.iconElement.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
            state.iconElement.style.opacity = '0';
            state.iconElement.style.transform = 'scale(0.5)';
        }

        // Trigger reply if swiped far enough
        const isMine = state.isMine;
        if (!isMine && deltaX > 50) {
            handleReplyMessage(state.messageId);
        } else if (isMine && deltaX < -50) {
            handleReplyMessage(state.messageId);
        }
        
        // Reset state
        swipeState.current = { startX: 0, startY: 0, currentX: 0, element: null, iconElement: null, messageId: null, isSwiping: false, isMine: false };
    };

    const closeContextMenu = () => {
        if (isMenuClosing) return;
        setIsMenuClosing(true);
        closingTimerRef.current = setTimeout(() => {
            setContextMenu(null);
            setIsMenuClosing(false);
        }, 150);
    };

    const handleDeleteMessage = async (messageId) => {
        // Optimistically mark as deleting
        setHistoryMessages(prev => prev.map(m => String(m.id) === String(messageId) ? { ...m, isDeleting: true } : m));
        setMessages(prev => prev.map(m => String(m.id) === String(messageId) ? { ...m, isDeleting: true } : m));

        playDeleteSound();

        setTimeout(() => {
            setHistoryMessages(prev => prev.filter(m => String(m.id) !== String(messageId)));
            setMessages(prev => prev.filter(m => String(m.id) !== String(messageId)));
        }, 350);

        closeContextMenu();

        try {
            await fetch(`${BACKEND_URL}/api/messages/delete/${messageId}`, {
                method: "DELETE",
                credentials: "include"
            });
        } catch (err) {
            console.error("Failed to delete message", err);
        }
    };

    const handleEditMessage = (messageId) => {
        const msg = historyMessages.find(m => String(m.id) === String(messageId)) || messages.find(m => String(m.id) === String(messageId));
        if (msg) {
            setEditingMessage(msg);
            if (chatState === "history") {
                setHistoryMessage(msg.text || msg.message || "");
                setTimeout(() => historyInputRef.current?.focus(), 0);
            } else {
                setMessage(msg.text || msg.message || "");
                setTimeout(() => messageInputRef.current?.focus(), 0);
            }
        }
        closeContextMenu();
    };

    const handleReplyMessage = (messageId) => {
        const msg = historyMessages.find(m => m.id === messageId) || messages.find(m => m.id === messageId);
        if (msg) setReplyingTo(msg);
        closeContextMenu();
        
        // Focus the correct input based on which chat is active
        if (chatState === "history") {
            historyInputRef.current?.focus();
        } else {
            messageInputRef.current?.focus();
        }
    };

    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [showConversations, setShowConversations] = useState(false);
    const [activeConv, setActiveConv] = useState(null);       // selected conversation object
    const activeConvRef = useRef(null);

    useEffect(() => {
        activeConvRef.current = activeConv;
    }, [activeConv]);
    const [historyMessages, setHistoryMessages] = useState([]); // loaded messages for history view
    const [historyLoading, setHistoryLoading] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [isFetchingMoreHistory, setIsFetchingMoreHistory] = useState(false);
    const [historyMessage, setHistoryMessage] = useState(""); // input for history composer
    const [historyIsTyping, setHistoryIsTyping] = useState(false); // partner typing in history view

    const [showRequests, setShowRequests] =
        useState(false);

    const [requestSent, setRequestSent] =
        useState(false);


    // =================================================
    // SESSION STATE
    // =================================================

    const [session, setSession] =
        useState(null);

    const [sessionLoading, setSessionLoading] =
        useState(true);


    // =================================================
    // REFS
    // =================================================

    const messagesRef =
        useRef(null);
    const historyMessagesRef = useRef(null);
    const historyInputRef = useRef(null);
    const conversationsDropdownRef = useRef(null);

    const messageInputRef =
        useRef(null);

    const replyTimerRef =
        useRef(null);

    const typingTimerRef =
        useRef(null);

    const historyTypingTimerRef =
        useRef(null);

    const contextMenuRef =
        useRef(null);

    const requestsDropdownRef =
        useRef(null);

    // Tracks the active live conversation_id for message persistence.
    const conversationIdRef = useRef(null);

    // Always-current reference to session so async callbacks don't capture stale state.
    const sessionRef = useRef(session);
    useEffect(() => { sessionRef.current = session; }, [session]);


    // =================================================
    // CLICK OUTSIDE
    // =================================================

    useEffect(() => {
        function handleClickOutside(event) {
            if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(event.target)) {
                setShowRequests(false);
            }
            if (conversationsDropdownRef.current && !conversationsDropdownRef.current.contains(event.target)) {
                setShowConversations(false);
            }
            if (contextMenu !== null) {
                if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                    closeContextMenu();
                } else if (!contextMenuRef.current) {
                    closeContextMenu();
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [contextMenu]);


    // =================================================
    // AUTO-OPEN CONV FROM ROUTE STATE (Friends page)
    // =================================================

    useEffect(() => {
        if (sessionLoading) return;           // wait until session is ready
        const openConv = location.state?.openConv;
        if (!openConv) return;

        // Determine the partner's session_id
        const partnerSessionId = openConv.partner_session_id || (
            openConv.user1_session_id === session?.session_id
                ? openConv.user2_session_id
                : openConv.user1_session_id
        );

        // Fetch live status — openConv from Friends.jsx has no partner_status
        async function openWithFreshStatus() {
            let freshStatus = "inactive";
            try {
                const res = await fetch(
                    `${BACKEND_URL}/api/messages/partner-status/${partnerSessionId}`,
                    { credentials: "include" }
                );
                if (res.ok) {
                    const data = await res.json();
                    freshStatus = data.status;
                }
            } catch { /* fall back to inactive */ }

            setActiveConv({ ...openConv, partner_status: freshStatus });

            // Messages were pre-fetched by Friends.jsx — map them now
            const mapped = prefetched.map(m => ({
                id: String(m.id),
                sender: m.sender_id === session?.session_id ? "me" : "them",
                text: m.message,
                createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
                reply_of: m.reply_of ? String(m.reply_of) : null,
                edited: m.edited,
            }));
            if (mapped.length < 15) {
                setHasMoreHistory(false);
            } else {
                setHasMoreHistory(true);
            }
            setHistoryMessages(mapped);
            setHistoryLoading(false);
            setChatState("history");
            requestAnimationFrame(() => {
                if (historyMessagesRef.current) scrollMessagesToBottom(historyMessagesRef.current, "auto");
            });

            // Clear the state so a refresh doesn't re-trigger
            window.history.replaceState({}, "");
        }

        openWithFreshStatus();
    }, [sessionLoading]); // eslint-disable-line react-hooks/exhaustive-deps



    // =================================================
    // AUTO-OPEN CONV FROM URL PARAMS (Direct deep link)
    // =================================================

    useEffect(() => {
        if (sessionLoading) return;
        const partnerParam = searchParams.get("partner");
        if (!partnerParam) return;

        // If activeConv is already this partner and we are not in setup state, do nothing
        if (activeConv && chatState !== "setup" && (
            activeConv.user1_session_id === partnerParam ||
            activeConv.user2_session_id === partnerParam
        )) {
            return;
        }

        async function fetchAndOpenDirect() {
            setShowConversations(false);
            setHistoryMessages([]);
            setHistoryMessage(""); setReplyingTo(null);
            setHistoryLoading(true);
            setHasMoreHistory(true);
            setChatState("history");

            try {
                // Fetch the conversation and messages via the new endpoint
                const res = await fetch(
                    `${BACKEND_URL}/api/messages/conversation/${partnerParam}`,
                    { credentials: "include" }
                );
                
                if (res.ok) {
                    const data = await res.json();
                    // Build synthetic conv object
                    const conv = {
                        conversation_id: data.conversation_id,
                        partner_name: data.partner_name,
                        partner_avatar: data.partner_avatar,
                        partner_status: data.partner_status || "inactive",
                        // Provide session IDs so other logic doesn't break
                        user1_session_id: session?.session_id,
                        user2_session_id: partnerParam,
                        is_friend: data.is_friend,
                    };
                    setActiveConv(conv);

                    const mapped = (data.messages || []).map(m => ({
                        id: String(m.id),
                        sender: m.sender_id === session?.session_id ? "me" : "them",
                        text: m.message,
                        createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
                        reply_of: m.reply_of ? String(m.reply_of) : null,
                        edited: m.edited,
                    }));
                    if (mapped.length < 15) {
                        setHasMoreHistory(false);
                    }
                    setHistoryMessages(mapped);
                    requestAnimationFrame(() => {
                        if (historyMessagesRef.current) scrollMessagesToBottom(historyMessagesRef.current, "auto");
                    });

                    // Mark conversation as read since we just opened it
                    if (data.conversation_id) {
                        fetch(`${BACKEND_URL}/api/messages/read/${data.conversation_id}`, {
                            method: "POST",
                            credentials: "include"
                        }).catch(console.error);
                    }
                } else {
                    console.error("Direct conversation fetch failed", res.status);
                    setChatState("setup");
                    setActiveConv(null);
                    conversationIdRef.current = null;
                    setSearchParams({}, { replace: true });
                }
            } catch (err) {
                console.error("Failed to load direct conversation history:", err);
                setChatState("setup");
                setActiveConv(null);
                conversationIdRef.current = null;
                window.activeLiveMatchSessionId = null;
                startMatching();
                setSearchParams({}, { replace: true });
            } finally {
                setHistoryLoading(false);
            }
        }

        fetchAndOpenDirect();

    }, [sessionLoading, searchParams, session?.session_id]); // eslint-disable-line react-hooks/exhaustive-deps



    // =================================================
    // CHECK SESSION
    // =================================================

    useEffect(() => {
        let isMounted = true;

        async function checkSession() {

            let sessionData = null;

            try {

                if (!BACKEND_URL) {
                    throw new Error(
                        "VITE_BACKEND_URL is not configured"
                    );
                }


                const response = await fetch(
                    `${BACKEND_URL}/api/session/me`,
                    {
                        method: "GET",

                        credentials: "include",
                    }
                );


                if (!response.ok) {
                    throw new Error(
                        "Session expired or does not exist"
                    );
                }


                const data =
                    await response.json();
                
                if (!isMounted) return;


                console.log(
                    "Current session:",
                    data
                );


                setSession(data);
                sessionData = data;
                fetchFriendRequests();

            } catch (error) {
                
                if (!isMounted) return;

                console.error(
                    "Session check failed:",
                    error
                );


                setSession(null);
                navigate("/");
                return;

            } finally {
                
                if (isMounted) {
                    setSessionLoading(false);
                }

            }

            // Connect WebSocket outside the session try/catch so a WS
            // failure doesn't wrongly redirect back to home.
            if (sessionData && isMounted) {
                try {
                    // The context auto-reconnects on refresh, but if the
                    // socket isn't open yet we connect explicitly.
                    if (!ws.websocketRef.current || ws.websocketRef.current.readyState !== WebSocket.OPEN) {
                        await ws.connect(sessionData.session_id);
                    }
                } catch (wsError) {
                    if (isMounted) {
                        console.error("WebSocket connection failed:", wsError);
                    }
                }
            }
        }


        checkSession();


        // Do NOT close the WebSocket when Chat unmounts — it lives in the
        // global context so it survives page navigations.
        return () => {
            isMounted = false;
        };

    }, [navigate, ws]);


    // =================================================
    // FETCH OFFLINE MESSAGES (async helper — called from sync WS listener)
    // =================================================

    async function fetchOfflineMessages(convId) {
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/messages/messages/${convId}`,
                { credentials: "include" }
            );
            if (!res.ok) return;
            const history = await res.json();
            if (history.length > 0) {
                const currentSessionId = sessionRef.current?.session_id;
                const mapped = history.map(m => ({
                    id: String(m.id),
                    sender: m.sender_id === currentSessionId ? "me" : "them",
                    text: m.message,
                    createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
                    reply_of: m.reply_of ? String(m.reply_of) : null,
                    edited: m.edited,
                }));
                setMessages(mapped);
            }
        } catch (err) {
            console.error("Failed to load offline messages:", err);
        }
    }


    // =================================================
    // WEBSOCKET MESSAGE LISTENER
    // =================================================

    useEffect(() => {
        const removeListener = ws.addMessageListener((event) => {
            try {
                const payload = JSON.parse(event.data);

                if (payload.type === "notification" && payload.event === "Sent friend request") {
                    fetchFriendRequests();
                    return;
                }

                if (payload.type === "match_found") {
                    if (payload.match?.name && payload.match?.avatar) {
                        setMatch(payload.match);
                    }
                    setMessages([]);

                    const convId = payload.conversation_id;
                    conversationIdRef.current = convId;
                    
                    window.activeLiveMatchSessionId = payload.match?.session_id;

                    // Fire-and-forget: load messages sent while we were offline.
                    if (convId) {
                        fetchOfflineMessages(convId);
                    }

                    setChatState("chatting");
                    playMatchSound();
                    return;
                }

                if (payload.type === "typing") {
                    // Route typing indicator to whichever view is active
                    if (payload.conversation_id) {
                        setHistoryIsTyping(Boolean(payload.is_typing));
                        if (payload.is_typing) {
                            window.clearTimeout(historyTypingTimerRef.current);
                            historyTypingTimerRef.current = window.setTimeout(
                                () => setHistoryIsTyping(false), 3000
                            );
                        }
                    } else {
                        setIsTyping(Boolean(payload.is_typing));
                    }
                    return;
                }

                if (payload.type === "message_deleted") {
                    const idToDelete = String(payload.message_id);
                    setHistoryMessages(prev => prev.map(m => String(m.id) === idToDelete ? { ...m, isDeleting: true } : m));
                    setMessages(prev => prev.map(m => String(m.id) === idToDelete ? { ...m, isDeleting: true } : m));
                    
                    playDeleteSound();

                    setTimeout(() => {
                        setHistoryMessages(prev => prev.filter(m => String(m.id) !== idToDelete));
                        setMessages(prev => prev.filter(m => String(m.id) !== idToDelete));
                    }, 350);
                    return;
                }

                if (payload.type === "message_edited") {
                    const idToEdit = String(payload.message_id);
                    setHistoryMessages(prev => prev.map(m => String(m.id) === idToEdit ? { ...m, text: payload.message, message: payload.message, edited: true } : m));
                    setMessages(prev => prev.map(m => String(m.id) === idToEdit ? { ...m, text: payload.message, message: payload.message, edited: true } : m));
                    return;
                }

                if (payload.type === "chat_message") {
                    const incomingConvId = payload.conversation_id;

                    // 1. Is it for the currently active HISTORY conversation?
                    if (incomingConvId && activeConvRef.current?.conversation_id === incomingConvId) {
                        setHistoryMessages(prev => [
                            ...prev,
                            createChatMessage({
                                id: payload.id,
                                idPrefix: "received-history",
                                sender: "them",
                                text: payload.text,
                                reply_of: payload.reply_of,
                            }),
                        ]);
                        // Also scroll the history pane
                        window.requestAnimationFrame(() => {
                            historyMessagesRef.current?.scrollTo({
                                top: historyMessagesRef.current.scrollHeight,
                                behavior: "smooth",
                            });
                        });
                        
                        // Mark as read
                        fetch(`${BACKEND_URL}/api/messages/read/${incomingConvId}`, {
                            method: "POST",
                            credentials: "include"
                        }).then(() => {
                            window.dispatchEvent(new CustomEvent("force_conversations_refresh"));
                        }).catch(console.error);
                    } 
                    // 2. Is it for the currently active LIVE MATCH conversation?
                    // We check if it matches conversationIdRef.current, OR if incomingConvId is missing (fallback)
                    else if (!incomingConvId || conversationIdRef.current === incomingConvId) {
                        setMessages((current) => [
                            ...current,
                            createChatMessage({
                                id: payload.id,
                                idPrefix: "received",
                                sender: "them",
                                text: payload.text,
                                reply_of: payload.reply_of,
                            }),
                        ]);
                        
                        // Mark as read
                        if (incomingConvId) {
                            fetch(`${BACKEND_URL}/api/messages/read/${incomingConvId}`, {
                                method: "POST",
                                credentials: "include"
                            }).then(() => {
                                window.dispatchEvent(new CustomEvent("force_conversations_refresh"));
                            }).catch(console.error);
                        }
                    }
                    return;
                }

                if (payload.type === "message_ack") {
                    setMessages(prev => prev.map(m => m.id === payload.local_id ? { ...m, id: String(payload.id) } : m));
                    setHistoryMessages(prev => prev.map(m => m.id === payload.local_id ? { ...m, id: String(payload.id) } : m));
                    return;
                }

                if (payload.type === "user_left") {
                    setIsTyping(false);
                    setPartnerLeft(true);
                    // Close the socket so the backend cleans up matching.
                    ws.disconnect();
                    return;
                }
            } catch {
                // Fallback for plain-text messages.
                setMessages((current) => [
                    ...current,
                    createChatMessage({
                        idPrefix: "received",
                        sender: "them",
                        text: event.data,
                    }),
                ]);
            }
        });

        return removeListener;
    }, [ws]); // eslint-disable-line react-hooks/exhaustive-deps


    // =================================================
    // CLEANUP REPLY TIMER
    // =================================================

    useEffect(() => {

        return () => {
            window.clearTimeout(
                replyTimerRef.current
            );
        };

    }, []);


    // =================================================
    // MATCHING IS DRIVEN BY THE BACKEND'S match_found EVENT
    // =================================================

    // =================================================
    // SCROLL WHEN MESSAGES CHANGE
    // =================================================

    useEffect(() => {

        scrollMessagesToBottom(
            messagesRef.current
        );

    }, [messages, isTyping, replyingTo]);


    // =================================================
    // SCROLL HISTORY MESSAGES WHEN THEY CHANGE
    // =================================================

    useEffect(() => {
        if (!historyMessagesRef.current) return;
        scrollMessagesToBottom(historyMessagesRef.current);
    }, [historyIsTyping, replyingTo]);


    // =================================================
    // POLL PARTNER STATUS WHILE IN HISTORY VIEW
    // =================================================

    useEffect(() => {
        if (chatState !== "history" || !activeConv) return;

        const partnerSessionId = activeConv.partner_session_id || (
            activeConv.user1_session_id === session?.session_id
                ? activeConv.user2_session_id
                : activeConv.user1_session_id
        );

        async function refreshStatus() {
            try {
                const res = await fetch(
                    `${BACKEND_URL}/api/messages/partner-status/${partnerSessionId}`,
                    { credentials: "include" }
                );
                if (res.ok) {
                    const data = await res.json();
                    setActiveConv(prev => prev ? { ...prev, partner_status: data.status } : prev);
                }
            } catch { /* ignore */ }
        }

        const interval = setInterval(refreshStatus, 5000);
        return () => clearInterval(interval);
    }, [chatState, activeConv?.conversation_id]); // eslint-disable-line react-hooks/exhaustive-deps


    // =================================================
    // CHAT VIEWPORT
    // =================================================

    useEffect(() => {

        // Active for both live chat and history view — both have a fixed-height
        // conversation layout that must not scroll when the keyboard opens.
        if (chatState !== "chatting" && chatState !== "history") {
            return undefined;
        }


        const root =
            document.documentElement;

        const viewport =
            window.visualViewport;


        const syncViewportHeightOnly = () => {

            const height =
                viewport?.height ??
                window.innerHeight;


            root.style.setProperty(
                "--chat-viewport-height",
                `${Math.round(height)}px`
            );
        };

        const syncViewportHeightAndScroll = () => {
            syncViewportHeightOnly();

            // Scroll the active pane to the bottom after the layout reflows.
            window.requestAnimationFrame(() => {
                const activeRef =
                    chatState === "history"
                        ? historyMessagesRef.current
                        : messagesRef.current;
                scrollMessagesToBottom(activeRef, "auto");
            });
        };


        root.classList.add(
            "chatting-active"
        );


        syncViewportHeightAndScroll();


        window.addEventListener(
            "resize",
            syncViewportHeightAndScroll
        );


        viewport?.addEventListener(
            "resize",
            syncViewportHeightAndScroll
        );


        viewport?.addEventListener(
            "scroll",
            syncViewportHeightOnly
        );


        return () => {

            root.classList.remove(
                "chatting-active"
            );


            root.style.removeProperty(
                "--chat-viewport-height"
            );


            window.removeEventListener(
                "resize",
                syncViewportHeightAndScroll
            );


            viewport?.removeEventListener(
                "resize",
                syncViewportHeightAndScroll
            );


            viewport?.removeEventListener(
                "scroll",
                syncViewportHeightOnly
            );
        };

    }, [chatState]);


    // =================================================
    // STOP TYPING
    // =================================================

    function stopTyping() {

        window.clearTimeout(
            replyTimerRef.current
        );

        // Cancel pending debounce and immediately tell the peer we stopped.
        window.clearTimeout(typingTimerRef.current);

        ws.sendJson({ type: "typing", is_typing: false });

        setIsTyping(false);
    }


    // =================================================
    // START MATCHING
    // =================================================

    async function startMatching() {

        stopTyping();

        setPartnerLeft(false);

        if (!session || !BACKEND_URL) {
            return;
        }


        setChatState("matching");


        try {

            // If the socket dropped for any reason, reconnect before matching.
            if (!ws.websocketRef.current || ws.websocketRef.current.readyState !== WebSocket.OPEN) {
                await ws.connect(session.session_id);
            }


            const response =
                await fetch(
                    `${BACKEND_URL}/api/chat/match`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );


            if (!response.ok) {
                throw new Error("Unable to start matchmaking");
            }

        } catch (error) {

            console.error("Matchmaking failed:", error);

            setChatState("setup");
        }
    }


    // =================================================
    // FRIEND REQUESTS
    // =================================================

    async function sendFriendRequest(targetId) {
        const idToRequest = typeof targetId === "string" ? targetId : match?.session_id;
        if (!idToRequest || requestSent) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/request/${idToRequest}`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                console.log("Friend request sent");
                setRequestSent(true);
                setTimeout(() => setRequestSent(false), 3000);
            } else {
                console.error("Failed to send friend request");
            }
        } catch (error) {
            console.error("Error sending friend request:", error);
        }
    }

    async function fetchFriendRequests() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/requests`, {
                method: "GET",
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setFriendRequests(data.requests || []);
            } else {
                console.error("Failed to get friend requests");
            }
        } catch (error) {
            console.error("Error getting friend requests:", error);
        }
    }

    async function toggleFriendRequests() {
        if (showRequests) {
            setShowRequests(false);
            return;
        }
        setShowRequests(true);
        setFriendRequestsLoading(true);
        await fetchFriendRequests();
        setFriendRequestsLoading(false);
    }

    async function fetchConversations() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/messages/conversations`, {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    }

    async function toggleConversations() {
        if (showConversations) {
            setShowConversations(false);
            return;
        }
        setShowConversations(true);
        setConversationsLoading(true);
        await fetchConversations();
        setConversationsLoading(false);
    }

    async function openConversation(conv) {
        setShowConversations(false);
        setHistoryMessages([]);
        setHistoryMessage(""); setReplyingTo(null);
        setHistoryLoading(true);
        setHasMoreHistory(true);

        // Determine the partner's session_id
        const partnerSessionId = conv.user1_session_id === session?.session_id
            ? conv.user2_session_id
            : conv.user1_session_id;

        // Fetch live status fresh — don't rely on the stale conversations list snapshot
        let freshStatus = conv.partner_status ?? "inactive";
        try {
            const statusRes = await fetch(
                `${BACKEND_URL}/api/messages/partner-status/${partnerSessionId}`,
                { credentials: "include" }
            );
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                freshStatus = statusData.status;
            }
        } catch {
            // fall back to cached value
        }

        setActiveConv({ ...conv, partner_status: freshStatus });

        try {
            const res = await fetch(
                `${BACKEND_URL}/api/messages/messages/${conv.conversation_id}`,
                { credentials: "include" }
            );
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map(m => ({
                    id: String(m.id),
                    sender: m.sender_id === session?.session_id ? "me" : "them",
                    text: m.message,
                    createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
                    reply_of: m.reply_of ? String(m.reply_of) : null,
                    edited: m.edited,
                }));
                if (mapped.length < 15) {
                    setHasMoreHistory(false);
                }
                setHistoryMessages(mapped);
                requestAnimationFrame(() => {
                    if (historyMessagesRef.current) scrollMessagesToBottom(historyMessagesRef.current, "auto");
                });
            }
        } catch (err) {
            console.error("Failed to load conversation history:", err);
        } finally {
            setHistoryLoading(false);
        }
        setChatState("history");
        setSearchParams({ partner: partnerSessionId }, { replace: true });
    }


    const handleHistoryScroll = async (e) => {
        if (!hasMoreHistory || isFetchingMoreHistory || !activeConv) return;
        const container = e.target;
        if (container.scrollTop === 0) {
            setIsFetchingMoreHistory(true);
            const prevScrollHeight = container.scrollHeight;
            const partnerSessionId = activeConv.partner_session_id || (
                activeConv.user1_session_id === session?.session_id
                    ? activeConv.user2_session_id
                    : activeConv.user1_session_id
            );

            try {
                let url = `${BACKEND_URL}/api/messages/conversation/${partnerSessionId}?skip=${historyMessages.length}&limit=15`;
                if (activeConv.conversation_id && !activeConv.user1_session_id) {
                    url = `${BACKEND_URL}/api/messages/messages/${activeConv.conversation_id}?skip=${historyMessages.length}&limit=15`;
                }

                const res = await fetch(url, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    const newMessages = Array.isArray(data) ? data : (data.messages || []);
                    const mapped = newMessages.map(m => ({
                        id: String(m.id),
                        sender: m.sender_id === session?.session_id ? "me" : "them",
                        text: m.message,
                        createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
                        reply_of: m.reply_of ? String(m.reply_of) : null,
                        edited: m.edited,
                    }));

                    if (mapped.length < 15) {
                        setHasMoreHistory(false);
                    }

                    if (mapped.length > 0) {
                        setHistoryMessages(prev => [...mapped, ...prev]);
                        requestAnimationFrame(() => {
                            if (historyMessagesRef.current) {
                                const newScrollHeight = historyMessagesRef.current.scrollHeight;
                                historyMessagesRef.current.scrollTop = newScrollHeight - prevScrollHeight;
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch older messages", error);
            } finally {
                setIsFetchingMoreHistory(false);
            }
        }
    };

    async function acceptFriendRequest(friendId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/accept/${friendId}`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                setFriendRequests(prev => prev.filter(req => req.session_id !== friendId));
            } else {
                console.error("Failed to accept friend request");
            }
        } catch (error) {
            console.error("Error accepting friend request:", error);
        }
    }

    async function rejectFriendRequest(friendId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/reject/${friendId}`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                setFriendRequests(prev => prev.filter(req => req.session_id !== friendId));
            } else {
                console.error("Failed to reject friend request");
            }
        } catch (error) {
            console.error("Error rejecting friend request:", error);
        }
    }


    // =================================================
    // SEND HISTORY MESSAGE
    // =================================================

    async function sendHistoryMessage(event) {
        event.preventDefault();
        const trimmed = historyMessage.trim();
        if (!trimmed || !activeConv) return;

        const currentEditing = editingMessage;
        const currentReplyOf = replyingTo?.id;
        setHistoryMessage(""); setReplyingTo(null); setEditingMessage(null);

        // Reset textarea height
        if (historyInputRef.current) {
            historyInputRef.current.style.height = "auto";
        }

        if (currentEditing) {
            // Optimistically update
            setHistoryMessages(prev => prev.map(m => String(m.id) === String(currentEditing.id) ? { ...m, text: trimmed, message: trimmed, edited: true } : m));
            setMessages(prev => prev.map(m => String(m.id) === String(currentEditing.id) ? { ...m, text: trimmed, message: trimmed, edited: true } : m));

            try {
                await fetch(`${BACKEND_URL}/api/messages/edit/${currentEditing.id}`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: trimmed }),
                });
            } catch (err) {
                console.error("Failed to edit message:", err);
            }
            return;
        }

        // Optimistically add to UI
        const localId = `sent-${Date.now()}`;
        const optimistic = {
            id: localId,
            local_id: localId,
            sender: "me",
            text: trimmed,
            createdAt: new Date().toISOString(),
            reply_of: currentReplyOf ? String(currentReplyOf) : null,
        };
        setHistoryMessages(prev => [...prev, optimistic]);

        // Scroll to bottom and keep keyboard open
        window.requestAnimationFrame(() => {
            historyMessagesRef.current?.scrollTo({
                top: historyMessagesRef.current.scrollHeight,
                behavior: "smooth",
            });
            historyInputRef.current?.focus({ preventScroll: true });
        });

        try {
            const res = await fetch(`${BACKEND_URL}/api/messages/send`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: activeConv.conversation_id,
                    message: trimmed,
                    reply_of: currentReplyOf ? Number(currentReplyOf) : null,
                }),
            });
            const data = await res.json();
            if (data.id) {
                setHistoryMessages(prev => prev.map(m => m.id === localId ? { ...m, id: String(data.id) } : m));
                setMessages(prev => prev.map(m => m.id === localId ? { ...m, id: String(data.id) } : m));
            }
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    }


    // =================================================
    // END CHAT
    // =================================================

    async function endChat() {

        stopTyping();

        setMessages([]);

        setMessage(""); setReplyingTo(null);


        // Explicitly close the WebSocket so the backend fires WebSocketDisconnect
        // and cleans up connections + matching entries.
        ws.disconnect();

        try {

            await fetch(
                `${BACKEND_URL}/api/chat/match/cancel`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

        } catch (error) {

            console.error("Unable to cancel matchmaking:", error);
        }

        setChatState("setup");
        setActiveConv(null);
        conversationIdRef.current = null;
        window.activeLiveMatchSessionId = null;
    }


    // =================================================
    // NEXT MATCH
    // =================================================

    async function nextMatch() {

        stopTyping();

        setMessages([]);

        setMessage(""); setReplyingTo(null);

        await startMatching();
    }


    // =================================================
    // SEND MESSAGE
    // =================================================

    function sendMessage(event) {
        event.preventDefault();

        const trimmed = message.trim();
        if (!trimmed) {
            return;
        }

        const currentEditing = editingMessage;
        const currentReplyOf = replyingTo?.id;
        setMessage(""); setReplyingTo(null); setEditingMessage(null);

        if (messageInputRef.current) {
            messageInputRef.current.style.height = "auto";
        }

        if (currentEditing) {
            // Optimistically update
            setHistoryMessages(prev => prev.map(m => String(m.id) === String(currentEditing.id) ? { ...m, text: trimmed, message: trimmed, edited: true } : m));
            setMessages(prev => prev.map(m => String(m.id) === String(currentEditing.id) ? { ...m, text: trimmed, message: trimmed, edited: true } : m));

            try {
                fetch(`${BACKEND_URL}/api/messages/edit/${currentEditing.id}`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: trimmed }),
                });
            } catch (err) {
                console.error("Failed to edit message:", err);
            }
            return;
        }

        const localId = `sent-${Date.now()}`;
        setMessages(
            (current) => [
                ...current,
                createChatMessage({
                    id: localId,
                    sender: "me",
                    text: trimmed,
                    reply_of: currentReplyOf ? String(currentReplyOf) : null,
                }),
            ]
        );

        if (!ws.websocketRef.current || ws.websocketRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        ws.sendJson({ 
            type: "chat_message", 
            text: trimmed, 
            reply_of: currentReplyOf ? Number(currentReplyOf) : null,
            local_id: localId
        });


        window.requestAnimationFrame(
            () => {

                messageInputRef.current?.focus({
                    preventScroll: true,
                });


                scrollMessagesToBottom(
                    messagesRef.current
                );
            }
        );


    }


    // =================================================
    // MESSAGE INPUT FOCUS
    // =================================================

    function handleMessageFocus() {

        window.requestAnimationFrame(
            () =>
                scrollMessagesToBottom(
                    messagesRef.current,
                    "auto"
                )
        );
    }


    // =================================================
    // CONTEXT MENU
    // =================================================

    const renderContextMenu = () => {
        if (contextMenu === null) return null;
        
        const msg = historyMessages.find(m => String(m.id) === String(contextMenu.messageId)) || messages.find(m => String(m.id) === String(contextMenu.messageId));
        const isEditable = msg && (new Date().getTime() - new Date(msg.createdAt).getTime()) <= 2 * 60 * 60 * 1000;

        return createPortal(
            <div 
                ref={contextMenuRef}
                className={`msg-context-menu ${isMenuClosing ? "closing" : ""}`}
                style={{
                    top: contextMenu.mouseY,
                    left: contextMenu.mouseX,
                    transformOrigin: contextMenu.mouseY < window.innerHeight / 2 ? "top left" : "bottom left"
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <button 
                    onClick={() => handleReplyMessage(contextMenu.messageId)}
                    className="context-btn"
                >
                    <CornerUpRight size={16} />
                    Reply
                </button>
                {contextMenu.isMine && (
                    <>
                        {isEditable && (
                            <button 
                                onClick={() => handleEditMessage(contextMenu.messageId)}
                                className="context-btn"
                            >
                                <Edit2 size={16} />
                                Edit
                            </button>
                        )}
                        <button 
                            onClick={() => handleDeleteMessage(contextMenu.messageId)}
                            className="context-btn delete-btn"
                        >
                            <Trash size={16} />
                            Delete
                        </button>
                    </>
                )}
            </div>,
            document.body
        );
    };

    // =================================================
    // SESSION LOADING
    // =================================================

    if (sessionLoading) {
        return <ChatSetupSkeleton />;
    }


    // =================================================
    // SETUP
    // =================================================

    if (chatState === "setup") {

        return (
            <section className="chat-setup">
                <div style={{ position: "absolute", top: 24, left: 16, zIndex: 10 }}>
                    <span className="brand-logo-type" style={{ fontSize: 22 }}>Near<span>ly</span></span>
                </div>
                <div style={{ position: "absolute", top: 24, right: 24, display: "flex", gap: 12, zIndex: 10 }}>
                    <HeaderIcons session={session} />
                </div>

                <div
                    className="chat-setup-visual"
                    aria-hidden="true"
                >

                    <div className="ring r3" />

                    <div className="ring r2" />

                    <div className="ring r1" />

                    <span className="pip p1" />

                    <span className="pip p2" />

                    <span className="pip p3" />

                    <span className="pip p4" />

                    <div className="core">

                        <img
                            className="ring-ghost-art"
                            src="/mask.png"
                            alt=""
                        />

                    </div>

                </div>


                <div className="chat-setup-side">

                    <div className="chat-setup-title">

                        <h2>
                            Who&apos;s out there?
                        </h2>

                        <p>
                            Someone nearby is also
                            looking for someone to talk to.
                        </p>

                    </div>


                    <div className="chat-setup-card">
                        <div className="chat-setup-foot">

                            <button
                                className="btn find-someone-btn"
                                type="button"
                                onClick={
                                    startMatching
                                }
                            >

                                <span
                                    className="find-someone-icon"
                                    aria-hidden="true"
                                >
                                    🔎
                                </span>

                                Find someone

                                <ArrowRight
                                    size={15}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />

                            </button>


                            <span className="privacy">

                                <Shield
                                    size={11}
                                    strokeWidth={1.8}
                                />

                                Your identity stays hidden.

                            </span>

                        </div>

                    </div>

                </div>

            </section>
        );
    }


    // =================================================
    // HISTORY VIEW  — read-only past conversation
    // =================================================

    if (chatState === "history") {
        const partnerName = activeConv?.partner_name || "Anonymous";
        const partnerAvatar = activeConv?.partner_avatar;
        const isOnline = activeConv?.partner_status === "active";

        return (
            <section className="conversation">

                <div className="conversation-wallpaper" aria-hidden="true">
                    <span className="wallpaper-orbit orbit-a" />
                    <span className="wallpaper-orbit orbit-b" />
                    <GhostMark className="wallpaper-ghost ghost-a" />
                    <GhostMark className="wallpaper-ghost ghost-b" />
                    <GhostMark className="wallpaper-ghost ghost-c" />
                </div>

                {/* Header */}
                <header className="conv-top">
                    <div className="conv-person">
                        {/* back button */}
                        <button
                            className="ix-btn"
                            type="button"
                            aria-label="Back"
                            onClick={() => {
                                setChatState("setup");
                                setActiveConv(null);
                                setSearchParams({}, { replace: true });
                            }}
                            style={{ marginRight: 4 }}
                        >
                            <ArrowRight size={20} strokeWidth={1.75} style={{ transform: "rotate(180deg)" }} />
                        </button>

                        {/* avatar */}
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            overflow: "hidden", flexShrink: 0,
                            background: "var(--accent-dim)",
                            display: "grid", placeItems: "center"
                        }}>
                            {partnerAvatar
                                ? <img src={partnerAvatar} alt={partnerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontFamily: "var(--brand)", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                                    {partnerName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                                  </span>
                            }
                        </div>

                        <div>
                            <h3 className="conv-name">{partnerName}</h3>
                            <p className="conv-meta">
                                <span className="status-dot" style={isOnline ? {} : {
                                    background: "var(--muted, #6b7280)",
                                    boxShadow: "none",
                                }} />
                                {isOnline ? "Online" : "Offline"}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        {!activeConv?.is_friend && (
                            <button
                                className="ix-btn"
                                type="button"
                                aria-label={requestSent ? "Request sent" : "Add friend"}
                                data-tooltip={requestSent ? "Request sent" : "Add friend"}
                                onClick={() => sendFriendRequest(
                                    activeConv.user1_session_id === session?.session_id
                                        ? activeConv.user2_session_id
                                        : activeConv.user1_session_id
                                )}
                                disabled={requestSent}
                                style={{
                                    transition: "all 0.3s ease",
                                    backgroundColor: requestSent ? "var(--success-color, #22c55e)" : "transparent",
                                    color: requestSent ? "var(--text-primary, white)" : "inherit"
                                }}
                            >
                                {requestSent ? (
                                    <Check size={22} strokeWidth={2} />
                                ) : (
                                    <UserPlus size={22} strokeWidth={1.75} />
                                )}
                            </button>
                        )}
                    </div>
                </header>

                {/* Messages */}
                <div ref={historyMessagesRef} className={`messages ${contextMenu && !isMenuClosing ? "menu-open" : ""}`} onScroll={handleHistoryScroll}>

                    <div className="notice" role="status">
                        <div className="notice-copy">
                            <strong>Conversation history with <span className="notice-name">{partnerName}</span></strong>
                        </div>
                        <span className="notice-status" aria-hidden="true" />
                    </div>

                    {historyLoading && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                            <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 13 }}>Loading messages…</span>
                        </div>
                    )}

                    {!historyLoading && historyMessages.length === 0 && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                            <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 13 }}>No messages in this conversation.</span>
                        </div>
                    )}

                    {historyMessages.map((item, index) => {
                        const showDateDivider = index === 0 || !isSameDay(new Date(item.createdAt), new Date(historyMessages[index - 1].createdAt));

                        return (
                        <React.Fragment key={item.local_id || item.id}>
                            {showDateDivider && (
                                <div className="date-divider">
                                    <span>{getMessageDateLabel(item.createdAt)}</span>
                                </div>
                            )}
                        <div 
                            className={`row ${item.sender === "me" ? "sent" : ""} ${contextMenu?.messageId === item.id ? "active-context-message" : ""} ${item.isDeleting ? "message-deleting" : ""}`}
                        >

                            {item.sender === "them" && (
                                <div style={{
                                    width: 32, height: 32, borderRadius: "50%",
                                    overflow: "hidden", flexShrink: 0,
                                    background: "var(--accent-dim)",
                                    display: "grid", placeItems: "center"
                                }}>
                                    {partnerAvatar
                                        ? <img src={partnerAvatar} alt={partnerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : <span style={{ fontFamily: "var(--brand)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                                            {partnerName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                                          </span>
                                    }
                                </div>
                            )}

                            {item.sender === "me" && (
                                <button 
                                    className="msg-context-btn" 
                                    onClick={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                    aria-label="More options"
                                    title="More options"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            )}

                            <div className="swipe-reply-icon" style={{ opacity: 0, transform: 'scale(0.5)', position: 'absolute', color: 'var(--text-primary)', pointerEvents: 'none', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                <Reply size={20} />
                            </div>

                            <div 
                                className={`bubble ${isEmojiOnly(item.text) ? 'emoji-only' : ''} ${String(item.id).startsWith('sent-') ? 'sending' : ''}`}
                                onContextMenu={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                onTouchStart={(e) => handleTouchStart(e, item.id, item.sender === "me")}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                            >
                                {item.reply_of && (() => {
                                    const original = historyMessages.find(m => m.id === item.reply_of) || messages.find(m => m.id === item.reply_of);
                                    if (!original) return null;
                                    const senderName = original.sender === "me" ? "You" : (partnerName || match?.name || "Them");
                                    return (
                                        <div className="reply-preview-in-bubble">
                                            <div className="reply-preview-name">{senderName}</div>
                                            <div className="reply-preview-text">{original.text}</div>
                                        </div>
                                    );
                                })()}
                                {formatMessageText(item.text)}
                                <small>
                                    <time dateTime={item.createdAt}>
                                        {item.edited && <span className="opacity-70 mr-1">(edited)</span>}
                                        {messageTimeFormatter.format(new Date(item.createdAt))}
                                    </time>
                                </small>
                            </div>
                            
                            {item.sender === "them" && (
                                <button 
                                    className="msg-context-btn" 
                                    onClick={(e) => { e.preventDefault(); handleReplyMessage(item.id); }}
                                    aria-label="Reply"
                                    title="Reply"
                                >
                                    <CornerUpRight size={16} />
                                </button>
                            )}

                        </div>
                        </React.Fragment>
                        );
                    })}

                    {historyIsTyping && (
                        <div className="row">
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                overflow: "hidden", flexShrink: 0,
                                background: "var(--accent-dim)",
                                display: "grid", placeItems: "center"
                            }}>
                                {partnerAvatar
                                    ? <img src={partnerAvatar} alt={partnerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <span style={{ fontFamily: "var(--brand)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                                        {partnerName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                                      </span>
                                }
                            </div>
                            <div className="typing">
                                <i /><i /><i />
                            </div>
                        </div>
                    )}

                </div>

                {/* Composer */}
                <form className="composer" onSubmit={sendHistoryMessage}>
                    <div className="composer-row">
                        <div className="composer-inner">
                            <EditPreview editingMessage={editingMessage} setEditingMessage={setEditingMessage} />
                            <ReplyPreview replyingTo={replyingTo} setReplyingTo={setReplyingTo} partnerName={partnerName} />
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                                <textarea
                                ref={historyInputRef}
                                rows={1}
                                value={historyMessage}
                                onChange={e => {
                                    setHistoryMessage(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                    // Send typing indicator via WS with conversation_id so partner knows
                                    ws.sendJson({
                                        type: "typing",
                                        is_typing: true,
                                        conversation_id: activeConv?.conversation_id,
                                    });
                                    window.clearTimeout(historyTypingTimerRef.current);
                                    historyTypingTimerRef.current = window.setTimeout(() => {
                                        ws.sendJson({
                                            type: "typing",
                                            is_typing: false,
                                            conversation_id: activeConv?.conversation_id,
                                        });
                                    }, 1500);
                                }}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendHistoryMessage(e);
                                    }
                                }}
                                placeholder="Send a message…"
                                aria-label="Message"
                                style={{ resize: "none" }}
                            />
                            <button
                                className="send-btn"
                                type="submit"
                                aria-label="Send"
                                onPointerDown={e => e.preventDefault()}
                            >
                                <Send size={14} />
                            </button>
                            </div>
                        </div>
                    </div>
                </form>

                {renderContextMenu()}

            </section>
        );
    }


    // =================================================
    // MATCHING
    // =================================================

    if (chatState === "matching") {

        return (
            <section className="match-screen">

                <div className="match-wrap">

                    <p className="eyebrow">

                        <span className="dot" />

                        Looking around

                    </p>


                    <h1>
                        Who&apos;s out{" "}
                        <em>there</em>...
                    </h1>


                    <p className="lead">
                        Finding someone nearby
                        who might be a good match.
                    </p>


                    <div
                        className="match-visual"
                        aria-label="Searching"
                    >

                        <div className="ring r4" />

                        <div className="ring r3" />

                        <div className="ring r2" />

                        <div className="ring r1" />

                        <span className="sat s1" />

                        <span className="sat s2" />

                        <div className="core">

                            <img
                                className="ring-ghost-art"
                                src="/mask.png"
                                alt=""
                            />

                        </div>

                    </div>


                    <p className="match-status">

                        <span className="pip" />

                        Searching nearby people

                    </p>


                    <div className="match-cancel">

                        <button
                            className="btn btn-quiet"
                            type="button"
                            onClick={endChat}
                        >
                            Cancel
                        </button>

                    </div>

                </div>

            </section>
        );
    }


    // =================================================
    // CHAT
    // =================================================

    return (

        <section className="conversation">

            <div
                className="conversation-wallpaper"
                aria-hidden="true"
            >

                <span className="wallpaper-orbit orbit-a" />

                <span className="wallpaper-orbit orbit-b" />

                <span className="wallpaper-clue clue-a">
                    ?
                </span>

                <span className="wallpaper-clue clue-b">
                    ?
                </span>

                <GhostMark
                    className="wallpaper-ghost ghost-a"
                />

                <GhostMark
                    className="wallpaper-ghost ghost-b"
                />

                <GhostMark
                    className="wallpaper-ghost ghost-c"
                />

            </div>


            {/* ============================= */}
            {/* HEADER */}
            {/* ============================= */}

            <header className="conv-top">

                <div className="conv-person">

                    <AnonymousAvatar
                        type={match.avatar}
                        size="md"
                        online
                    />


                    <div>

                        <h3 className="conv-name">
                            {match.name}
                        </h3>


                        <p className="conv-meta">

                            <span className="status-dot" />

                            Online

                        </p>

                    </div>

                </div>


                <div
                    style={{
                        display: "flex",
                        gap: 12,
                    }}
                >

                    {!match?.is_friend && (
                        <button
                            className="ix-btn"
                            type="button"
                            aria-label={requestSent ? "Request sent" : "Add friend"}
                            data-tooltip={requestSent ? "Request sent" : "Add friend"}
                            onClick={sendFriendRequest}
                            disabled={requestSent}
                            style={{
                                transition: "all 0.3s ease",
                                backgroundColor: requestSent ? "var(--success-color, #22c55e)" : "transparent",
                                color: requestSent ? "var(--text-primary, white)" : "inherit"
                            }}
                        >

                            {requestSent ? (
                                <Check
                                    size={22}
                                    strokeWidth={2}
                                />
                            ) : (
                                <UserPlus
                                    size={22}
                                    strokeWidth={1.75}
                                />
                            )}

                        </button>
                    )}

                    <button
                        className="ix-btn"
                        type="button"
                        aria-label="End chat"
                        data-tooltip="End chat"
                        onClick={endChat}
                    >

                        <LogOut
                            size={22}
                            strokeWidth={1.75}
                        />

                    </button>

                </div>

            </header>


            {/* ============================= */}
            {/* MESSAGES */}
            {/* ============================= */}

            <div
                className={`messages ${contextMenu && !isMenuClosing ? "menu-open" : ""}`}
                ref={messagesRef}
            >

                <div
                    className="notice"
                    role="status"
                >

                    <div className="notice-mark">

                        <MatchNoticeIcon />

                    </div>


                    <div className="notice-copy">

                        <strong>

                            Matched with{" "}

                            <span className="notice-name">
                                {match.name}
                            </span>

                        </strong>

                    </div>


                    <span
                        className="notice-status"
                        aria-hidden="true"
                    />

                </div>


                {messages.map(
                    (item, index) => {
                        const showDateDivider = index === 0 || !isSameDay(new Date(item.createdAt), new Date(messages[index - 1].createdAt));
                        
                        return (
                        <React.Fragment key={item.local_id || item.id}>
                            {showDateDivider && (
                                <div className="date-divider">
                                    <span>{getMessageDateLabel(item.createdAt)}</span>
                                </div>
                            )}
                        <div
                            className={`row ${
                                item.sender === "me"
                                    ? "sent"
                                    : ""
                            } ${contextMenu?.messageId === item.id ? "active-context-message" : ""} ${item.isDeleting ? "message-deleting" : ""}`}
                        >

                            {item.sender === "them" && (

                                <AnonymousAvatar
                                    type={match.avatar}
                                    size="md"
                                />

                            )}


                            {item.sender === "me" && (
                                <button 
                                    className="msg-context-btn" 
                                    onClick={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                    aria-label="More options"
                                    title="More options"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            )}

                            <div className="swipe-reply-icon" style={{ opacity: 0, transform: 'scale(0.5)', position: 'absolute', color: 'var(--text-primary)', pointerEvents: 'none', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                <Reply size={20} />
                            </div>

                            <div 
                                className={`bubble ${isEmojiOnly(item.text) ? 'emoji-only' : ''} ${String(item.id).startsWith('sent-') ? 'sending' : ''}`}
                                onContextMenu={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                onTouchStart={(e) => handleTouchStart(e, item.id, item.sender === "me")}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                            >

                                {item.reply_of && (() => {
                                    const original = historyMessages.find(m => m.id === item.reply_of) || messages.find(m => m.id === item.reply_of);
                                    if (!original) return null;
                                    const senderName = original.sender === "me" ? "You" : (match?.name || partnerName || "Them");
                                    return (
                                        <div className="reply-preview-in-bubble">
                                            <div className="reply-preview-name">{senderName}</div>
                                            <div className="reply-preview-text">{original.text}</div>
                                        </div>
                                    );
                                })()}

                                {formatMessageText(item.text)}


                                <small>

                                    <time
                                        dateTime={
                                            item.createdAt
                                        }
                                    >
                                        {item.edited && <span className="opacity-70 mr-1">(edited)</span>}
                                        {
                                            messageTimeFormatter.format(
                                                new Date(
                                                    item.createdAt
                                                )
                                            )
                                        }
                                    </time>

                                </small>

                            </div>

                            {item.sender === "them" && (
                                <button 
                                    className="msg-context-btn" 
                                    onClick={(e) => { e.preventDefault(); handleReplyMessage(item.id); }}
                                    aria-label="Reply"
                                    title="Reply"
                                >
                                    <CornerUpRight size={16} />
                                </button>
                            )}

                        </div>
                        </React.Fragment>
                        );
                    }
                )}


                {isTyping && (

                    <div className="row">

                        <AnonymousAvatar
                            type={match.avatar}
                            size="md"
                        />


                        <div className="typing">

                            <i />

                            <i />

                            <i />

                        </div>

                    </div>

                )}


                {partnerLeft && (

                    <div
                        className="notice notice-warning"
                        role="alert"
                    >

                        <div className="notice-copy">

                            <strong>
                                {match.name} has left the chat
                            </strong>

                            <p>
                                The conversation has ended. Start a new one?
                            </p>

                        </div>


                        <button
                            className="btn btn-quiet"
                            type="button"
                            onClick={nextMatch}
                        >
                            Find next match
                        </button>

                    </div>

                )}

            </div>


            {/* ============================= */}
            {/* COMPOSER */}
            {/* ============================= */}

            <form
                className="composer"
                onSubmit={sendMessage}
                aria-disabled={partnerLeft}
            >

                <div className="composer-row">

                    <button
                        className="next-btn"
                        type="button"
                        onClick={nextMatch}
                        aria-label="Next match"
                    >

                        <RotateCw
                            size={13}
                            strokeWidth={1.8}
                        />

                        <span>
                            Next match
                        </span>

                    </button>


                    <div className="composer-inner">
                        <EditPreview editingMessage={editingMessage} setEditingMessage={setEditingMessage} />
                        <ReplyPreview replyingTo={replyingTo} setReplyingTo={setReplyingTo} partnerName={match?.name} />
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                            <textarea
                            ref={messageInputRef}
                            value={message}
                            disabled={partnerLeft}
                            rows={1}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    sendMessage(event);
                                }
                            }}
                            onChange={(event) => {
                                setMessage(
                                    event.target.value
                                );
                                
                                event.target.style.height = "auto";
                                event.target.style.height = `${event.target.scrollHeight}px`;

                                // Notify the peer that we are typing.
                                ws.sendJson({ type: "typing", is_typing: true });

                                // Send typing:false after 1.5 s of inactivity.
                                window.clearTimeout(typingTimerRef.current);
                                typingTimerRef.current = window.setTimeout(() => {
                                    ws.sendJson({ type: "typing", is_typing: false });
                                }, 1500);
                            }}
                            onFocus={
                                handleMessageFocus
                            }
                            placeholder={partnerLeft ? "Chat ended" : "Say hello..."}
                            aria-label="Message"
                        />

                        <button
                            className="send-btn"
                            type="submit"
                            aria-label="Send"
                            onPointerDown={(event) =>
                                event.preventDefault()
                            }
                        >

                            <Send size={14} />

                        </button>
                        </div>

                    </div>

                </div>

            </form>

            {renderContextMenu()}

        </section>
    );
}


export default Chat;
