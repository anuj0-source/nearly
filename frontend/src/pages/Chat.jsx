import { useEffect, useRef, useState } from "react";
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
    Mail,
    BadgeCheck,
} from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import GhostMark from "../components/GhostMark";
import { anonymousPeople } from "../data/mockData";
import { useNavigate } from "react-router-dom";

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

    const [socketReady, setSocketReady] =
        useState(false);


    // =================================================
    // REFS
    // =================================================

    const messagesRef =
        useRef(null);

    const messageInputRef =
        useRef(null);

    const replyTimerRef =
        useRef(null);

    const typingTimerRef =
        useRef(null);

    const websocketRef =
        useRef(null);

    const requestsDropdownRef =
        useRef(null);


    // =================================================
    // CLICK OUTSIDE
    // =================================================

    useEffect(() => {
        function handleClickOutside(event) {
            if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(event.target)) {
                setShowRequests(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


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
                    await connectWebSocket(sessionData.session_id);
                } catch (wsError) {
                    if (isMounted) {
                        console.error("WebSocket connection failed:", wsError);
                        // Non-fatal — the user stays on the chat page and can
                        // still retry matching once the socket reconnects.
                    }
                }
            }
        }


        checkSession();


        // Close the WebSocket when the Chat page unmounts.
        return () => {
            isMounted = false;
            if (websocketRef.current) {
                websocketRef.current.onclose = null;
                websocketRef.current.close();
                websocketRef.current = null;
            }
        };

    }, [navigate]);


    // =================================================
    // WEBSOCKET CONNECTION
    // =================================================

    function connectWebSocket(sessionId) {

        // Close any existing socket cleanly before opening a new one.
        if (websocketRef.current) {
            websocketRef.current.onclose = null;
            websocketRef.current.close();
            websocketRef.current = null;
        }


        return new Promise((resolve, reject) => {

            // Use the passed sessionId first (for initial call from checkSession
            // where React state hasn't updated yet), then fall back to state.
            const sid = sessionId ?? session?.session_id ?? "";

            const websocketUrl =
                `${BACKEND_URL.replace(/^http/, "ws")}/api/chat/ws?session_id=${sid}`;

            const websocket =
                new WebSocket(websocketUrl);

            websocketRef.current = websocket;


            websocket.onopen = () => {
                setSocketReady(true);
                resolve(websocket);
            };


            websocket.onclose = () =>
                setSocketReady(false);


            websocket.onerror = () => {
                setSocketReady(false);
                reject(new Error("WebSocket connection failed"));
            };


            websocket.onmessage = (event) => {

                try {

                    const payload =
                        JSON.parse(event.data);


                    if (payload.type === "notification" && payload.event === "Sent friend request") {
                        fetchFriendRequests();
                        return;
                    }

                    if (payload.type === "match_found") {

                        if (payload.match?.name && payload.match?.avatar) {
                            setMatch(payload.match);
                        }

                        setMessages([]);

                        setChatState("chatting");
                        playMatchSound();

                        return;
                    }


                    if (payload.type === "typing") {
                        setIsTyping(Boolean(payload.is_typing));
                        return;
                    }


                    if (payload.type === "chat_message") {
                        setMessages(
                            (current) => [
                                ...current,

                                createChatMessage({
                                    idPrefix: "received",
                                    sender: "them",
                                    text: payload.text,
                                }),
                            ]
                        );
                        return;
                    }


                    if (payload.type === "user_left") {
                        setIsTyping(false);
                        setPartnerLeft(true);

                        // Close our side of the socket cleanly.
                        websocket.onclose = null;
                        websocket.close();
                        websocketRef.current = null;
                        setSocketReady(false);
                        return;
                    }

                } catch {

                    // Fallback for plain-text messages.
                    setMessages(
                        (current) => [
                            ...current,

                            createChatMessage({
                                idPrefix: "received",
                                sender: "them",
                                text: event.data,
                            }),
                        ]
                    );
                }
            };
        });
    }


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
    // CHAT VIEWPORT
    // =================================================

    useEffect(() => {

        if (chatState !== "chatting") {
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


            window.requestAnimationFrame(
                () =>
                    scrollMessagesToBottom(
                        messagesRef.current,
                        "auto"
                    )
            );
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

        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(
                JSON.stringify({ type: "typing", is_typing: false })
            );
        }

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
            if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
                await connectWebSocket();
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

    async function sendFriendRequest() {
        if (!match || !match.session_id || requestSent) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/friend/request/${match.session_id}`, {
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
        await fetchFriendRequests();
        setShowRequests(true);
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
            const response = await fetch(`${BACKEND_URL}/api/friend/cancel-request/${friendId}`, {
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
    // END CHAT
    // =================================================

    async function endChat() {

        stopTyping();

        setMessages([]);

        setMessage("");


        // Explicitly close the WebSocket so the backend fires WebSocketDisconnect
        // and cleans up connections + matching entries.
        if (websocketRef.current) {
            websocketRef.current.onclose = null; // suppress the generic onclose handler
            websocketRef.current.close();
            websocketRef.current = null;
        }

        setSocketReady(false);

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


        if (websocketRef.current?.readyState !== WebSocket.OPEN) {
            return;
        }


        websocketRef.current.send(
            JSON.stringify({ type: "chat_message", text: trimmed })
        );


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
                    <button className="ix-btn" type="button" aria-label="Messages" data-tooltip="Messages">
                        <Mail size={22} strokeWidth={1.75} />
                    </button>
                    <div ref={requestsDropdownRef} style={{ position: "relative" }}>
                        <button className="ix-btn" style={{ position: "relative" }} type="button" aria-label="Friend requests" {...(!showRequests ? { "data-tooltip": "Friend requests" } : {}) } onClick={toggleFriendRequests}>
                            <ReceiveRequestIcon size={22} strokeWidth={1.75} />
                            {friendRequests.length > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: -2,
                                    right: -2,
                                    background: "var(--primary-color, #f43f5e)",
                                    color: "white",
                                    fontSize: 9,
                                    fontWeight: "bold",
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    pointerEvents: "none",
                                    boxShadow: "0 0 0 2px var(--bg, #F6F5F1)"
                                }}>
                                    {friendRequests.length}
                                </span>
                            )}
                        </button>
                        {showRequests && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                marginTop: 8,
                                background: "var(--paper)",
                                border: "1px solid var(--line-strong)",
                                borderRadius: 10,
                                width: 280,
                                boxShadow: "var(--shadow-2)",
                                zIndex: 100,
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "14px 16px",
                                    background: "var(--surface)",
                                    borderBottom: "1px solid var(--line)"
                                }}>
                                    <ReceiveRequestIcon size={18} strokeWidth={2} color="var(--ink)" />
                                    <h3 style={{ margin: 0, fontSize: 15, fontFamily: "var(--brand)", fontWeight: 600, color: "var(--ink)" }}>Friend Requests</h3>
                                </div>
                                <div style={{ padding: "20px 16px", maxHeight: 300, overflowY: "auto" }}>
                                    {friendRequests.length === 0 ? (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--ink)" }}>
                                            <BadgeCheck size={18} strokeWidth={2} />
                                            <span style={{ fontWeight: 500, fontFamily: "var(--sans)", fontSize: 14 }}>No pending friend requests.</span>
                                        </div>
                                ) : (
                                    friendRequests.map((req, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i === friendRequests.length - 1 ? "none" : "1px solid var(--line, #eee)" }}>
                                            <img src={req.avatar || "/mask.png"} alt="" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface, #eee)" }} />
                                            <span style={{ fontSize: 14, color: "var(--ink, #000)", flex: 1 }}>{req.name || "Anonymous"}</span>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button className="ix-btn" style={{ padding: 4 }} aria-label="Accept" onClick={() => acceptFriendRequest(req.session_id)}>
                                                    <Check size={16} strokeWidth={2} color="var(--success-color, #22c55e)" />
                                                </button>
                                                <button className="ix-btn" style={{ padding: 4 }} aria-label="Reject" onClick={() => rejectFriendRequest(req.session_id)}>
                                                    <X size={16} strokeWidth={2} color="var(--error-color, #ef4444)" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button className="ix-btn" type="button" aria-label="Notifications" data-tooltip="Notifications" onClick={() => {}}>
                        <Bell size={22} strokeWidth={1.75} />
                    </button>
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
                                if (websocketRef.current?.readyState === WebSocket.OPEN) {
                                    websocketRef.current.send(
                                        JSON.stringify({ type: "typing", is_typing: true })
                                    );
                                }

                                // Send typing:false after 1.5 s of inactivity.
                                window.clearTimeout(typingTimerRef.current);
                                typingTimerRef.current = window.setTimeout(() => {
                                    if (websocketRef.current?.readyState === WebSocket.OPEN) {
                                        websocketRef.current.send(
                                            JSON.stringify({ type: "typing", is_typing: false })
                                        );
                                    }
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
