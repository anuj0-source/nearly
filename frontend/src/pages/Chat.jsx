import { useEffect, useRef, useState } from "react";
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


// =================================================
// MESSAGE TIME FORMATTER
// =================================================

const messageTimeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
});


// =================================================
// CREATE CHAT MESSAGE
// =================================================

function createChatMessage({ idPrefix, sender, text }) {
    const createdAt = new Date();

    return {
        id: `${idPrefix}-${createdAt.getTime()}`,
        sender,
        text,
        createdAt: createdAt.toISOString(),
    };
}


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
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


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
            const prefetched = openConv.prefetchedMessages || [];
            const mapped = prefetched.map(m => ({
                id: String(m.id),
                sender: m.sender_id === session?.session_id ? "me" : "them",
                text: m.message,
                        createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
            }));
            setHistoryMessages(mapped);
            setHistoryLoading(false);
            setChatState("history");

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
            setHistoryMessage("");
            setHistoryLoading(true);
            setChatState("history");

            try {
                // Fetch the conversation and messages via the new endpoint
                const res = await fetch(
                    `${BACKEND_URL}/api/messages/conversation/${partnerParam}`,
                    { credentials: "include" }
                );
                
                if (res.ok) {
                    const data = await res.json();
                    
                    // Fetch live status fresh
                    let freshStatus = "inactive";
                    try {
                        const statusRes = await fetch(
                            `${BACKEND_URL}/api/messages/partner-status/${partnerParam}`,
                            { credentials: "include" }
                        );
                        if (statusRes.ok) {
                            const statusData = await statusRes.json();
                            freshStatus = statusData.status;
                        }
                    } catch {
                        // fallback
                    }

                    // Build synthetic conv object
                    const conv = {
                        conversation_id: data.conversation_id,
                        partner_name: data.partner_name,
                        partner_avatar: data.partner_avatar,
                        partner_status: freshStatus,
                        // Provide session IDs so other logic doesn't break
                        user1_session_id: session?.session_id,
                        user2_session_id: partnerParam,
                        is_friend: data.is_friend,
                    };
                    setActiveConv(conv);

                    // Map backend messages
                    const mapped = (data.messages || []).map(m => ({
                        id: String(m.id),
                        sender: m.sender_id === session?.session_id ? "me" : "them",
                        text: m.message,
                        createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
                    }));
                    setHistoryMessages(mapped);

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

                if (payload.type === "chat_message") {
                    const incomingConvId = payload.conversation_id;

                    // 1. Is it for the currently active HISTORY conversation?
                    if (incomingConvId && activeConvRef.current?.conversation_id === incomingConvId) {
                        setHistoryMessages(prev => [
                            ...prev,
                            createChatMessage({
                                idPrefix: "received-history",
                                sender: "them",
                                text: payload.text,
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
                        }).catch(console.error);
                    } 
                    // 2. Is it for the currently active LIVE MATCH conversation?
                    // We check if it matches conversationIdRef.current, OR if incomingConvId is missing (fallback)
                    else if (!incomingConvId || conversationIdRef.current === incomingConvId) {
                        setMessages((current) => [
                            ...current,
                            createChatMessage({
                                idPrefix: "received",
                                sender: "them",
                                text: payload.text,
                            }),
                        ]);
                        
                        // Mark as read
                        if (incomingConvId) {
                            fetch(`${BACKEND_URL}/api/messages/read/${incomingConvId}`, {
                                method: "POST",
                                credentials: "include"
                            }).catch(console.error);
                        }
                    }
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

    }, [messages, isTyping]);


    // =================================================
    // SCROLL HISTORY MESSAGES WHEN THEY CHANGE
    // =================================================

    useEffect(() => {
        if (!historyMessagesRef.current) return;
        scrollMessagesToBottom(historyMessagesRef.current);
    }, [historyMessages, historyIsTyping]);


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


        const syncViewportHeight = () => {

            const height =
                viewport?.height ??
                window.innerHeight;


            root.style.setProperty(
                "--chat-viewport-height",
                `${Math.round(height)}px`
            );


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


        syncViewportHeight();


        window.addEventListener(
            "resize",
            syncViewportHeight
        );


        viewport?.addEventListener(
            "resize",
            syncViewportHeight
        );


        viewport?.addEventListener(
            "scroll",
            syncViewportHeight
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
                syncViewportHeight
            );


            viewport?.removeEventListener(
                "resize",
                syncViewportHeight
            );


            viewport?.removeEventListener(
                "scroll",
                syncViewportHeight
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
        setHistoryMessage("");
        setHistoryLoading(true);

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
                // Map backend Message shape → local message format
                const mapped = data.map(m => ({
                    id: String(m.id),
                    sender: m.sender_id === session?.session_id ? "me" : "them",
                    text: m.message,
                    createdAt: m.created_at.endsWith("Z") ? m.created_at : m.created_at + "Z",
                }));
                setHistoryMessages(mapped);
            }
        } catch (err) {
            console.error("Failed to load conversation history:", err);
        } finally {
            setHistoryLoading(false);
        }
        setChatState("history");
        setSearchParams({ partner: partnerSessionId }, { replace: true });
    }


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

        setHistoryMessage("");

        // Reset textarea height
        if (historyInputRef.current) {
            historyInputRef.current.style.height = "auto";
        }

        // Optimistically add to UI
        const optimistic = {
            id: `optimistic-${Date.now()}`,
            sender: "me",
            text: trimmed,
            createdAt: new Date().toISOString(),
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
            await fetch(`${BACKEND_URL}/api/messages/send`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: activeConv.conversation_id,
                    message: trimmed,
                }),
            });
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

        setMessage("");


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
    }


    // =================================================
    // NEXT MATCH
    // =================================================

    async function nextMatch() {

        stopTyping();

        setMessages([]);

        setMessage("");

        await startMatching();
    }


    // =================================================
    // SEND MESSAGE
    // =================================================

    function sendMessage(event) {

        event.preventDefault();


        const trimmed =
            message.trim();


        if (!trimmed) {
            return;
        }


        setMessages(
            (current) => [
                ...current,

                createChatMessage({
                    idPrefix: "sent",
                    sender: "me",
                    text: trimmed,
                }),
            ]
        );


        setMessage("");
        
        if (messageInputRef.current) {
            messageInputRef.current.style.height = "auto";
        }


        if (!ws.websocketRef.current || ws.websocketRef.current.readyState !== WebSocket.OPEN) {
            return;
        }


        ws.sendJson({ type: "chat_message", text: trimmed });


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
                <div className="messages" ref={historyMessagesRef}>

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

                    {historyMessages.map(item => (
                        <div key={item.id} className={`row ${item.sender === "me" ? "sent" : ""}`}>

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

                            <div className="bubble">
                                {item.text}
                                <small>
                                    <time dateTime={item.createdAt}>
                                        {messageTimeFormatter.format(new Date(item.createdAt))}
                                    </time>
                                </small>
                            </div>

                        </div>
                    ))}

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
                </form>

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
                className="messages"
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
                    (item) => (

                        <div
                            key={item.id}
                            className={`row ${
                                item.sender === "me"
                                    ? "sent"
                                    : ""
                            }`}
                        >

                            {item.sender === "them" && (

                                <AnonymousAvatar
                                    type={match.avatar}
                                    size="md"
                                />

                            )}


                            <div className="bubble">

                                {item.text}


                                <small>

                                    <time
                                        dateTime={
                                            item.createdAt
                                        }
                                    >
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

                        </div>

                    )
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

            </form>

        </section>
    );
}


export default Chat;
