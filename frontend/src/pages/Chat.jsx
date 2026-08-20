import { useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    MoreHorizontal,
    RotateCw,
    Send,
    Shield,
} from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import GhostMark from "../components/GhostMark";
import { anonymousPeople, starterMessages } from "../data/mockData";
import { useNavigate } from "react-router-dom";


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

    const [showMenu, setShowMenu] =
        useState(false);

    const [isTyping, setIsTyping] =
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

    const messageInputRef =
        useRef(null);

    const replyTimerRef =
        useRef(null);


    // =================================================
    // CHECK SESSION
    // =================================================

    useEffect(() => {

        async function checkSession() {

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


                console.log(
                    "Current session:",
                    data
                );


                setSession(data);

            } catch (error) {

                console.error(
                    "Session check failed:",
                    error
                );


                setSession(null);


                navigate("/");

            } finally {

                setSessionLoading(false);

            }
        }


        checkSession();

    }, [navigate]);


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
    // MOCK MATCHING
    // =================================================

    useEffect(() => {

        if (chatState !== "matching") {
            return undefined;
        }


        const timer =
            window.setTimeout(() => {

                const next =
                    anonymousPeople[
                        Math.floor(
                            Math.random() *
                            anonymousPeople.length
                        )
                    ];


                setMatch(next);


                setMessages([
                    createChatMessage({
                        idPrefix: next.id,
                        sender:
                            starterMessages[0].sender,
                        text:
                            starterMessages[0].text,
                    }),
                ]);


                setChatState("chatting");

            }, 3000);


        return () =>
            window.clearTimeout(timer);

    }, [chatState]);


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

        setIsTyping(false);
    }


    // =================================================
    // START MATCHING
    // =================================================

    function startMatching() {

        stopTyping();

        setShowMenu(false);

        setChatState("matching");
    }


    // =================================================
    // END CHAT
    // =================================================

    function endChat() {

        stopTyping();

        setMessages([]);

        setMessage("");

        setShowMenu(false);

        setChatState("setup");
    }


    // =================================================
    // NEXT MATCH
    // =================================================

    function nextMatch() {

        stopTyping();

        setMessages([]);

        setMessage("");

        setShowMenu(false);

        setChatState("matching");
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


        // Fake typing response
        setIsTyping(true);


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


        replyTimerRef.current =
            window.setTimeout(() => {

                setIsTyping(false);


                setMessages(
                    (current) => [
                        ...current,

                        createChatMessage({
                            idPrefix: "reply",
                            sender: "them",
                            text:
                                "Nice! I'm into that too.",
                        }),
                    ]
                );

            }, 1400);
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
                        gap: 2,
                    }}
                >

                    <button
                        className="ix-btn"
                        type="button"
                        aria-label="Chat options"
                        onClick={() =>
                            setShowMenu(
                                (current) =>
                                    !current
                            )
                        }
                    >

                        <MoreHorizontal
                            size={16}
                            strokeWidth={1.75}
                        />

                    </button>

                </div>


                {showMenu && (

                    <div className="menu-pop">

                        <button
                            type="button"
                            onClick={endChat}
                        >
                            End chat
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                setShowMenu(false)
                            }
                        >
                            Report
                        </button>


                        <button
                            type="button"
                            className="danger"
                            onClick={() =>
                                setShowMenu(false)
                            }
                        >
                            Block
                        </button>

                    </div>

                )}

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

            </div>


            {/* ============================= */}
            {/* COMPOSER */}
            {/* ============================= */}

            <form
                className="composer"
                onSubmit={sendMessage}
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

                        <input
                            ref={messageInputRef}
                            value={message}
                            onChange={(event) =>
                                setMessage(
                                    event.target.value
                                )
                            }
                            onFocus={
                                handleMessageFocus
                            }
                            placeholder="Say hello..."
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
