import { useEffect, useRef, useState } from "react";
import { ArrowRight, MoreHorizontal, RotateCw, Send, Shield, Sparkles } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import GhostMark from "../components/GhostMark";
import { anonymousPeople, interests as allInterests, starterMessages } from "../data/mockData";

const messageTimeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
});

function createChatMessage({ idPrefix, sender, text }) {
    const createdAt = new Date();

    return {
        id: `${idPrefix}-${createdAt.getTime()}`,
        sender,
        text,
        createdAt: createdAt.toISOString(),
    };
}

function MatchNoticeIcon() {
    return (
        <svg className="notice-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
            <circle cx="10" cy="11" r="3.25" />
            <path d="M4.75 23.25c.55-3.35 2.6-5.25 5.25-5.25s4.7 1.9 5.25 5.25" />
            <circle cx="22" cy="11" r="3.25" />
            <path d="M16.75 23.25c.55-3.35 2.6-5.25 5.25-5.25s4.7 1.9 5.25 5.25" />
            <path className="notice-icon-link" d="M13.45 14.1h5.1" />
            <path className="notice-icon-spark" d="M16 4.25v2.1M14.95 5.3h2.1" />
        </svg>
    );
}

function Chat() {
    const [chatState, setChatState] = useState("setup");
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [match, setMatch] = useState(anonymousPeople[0]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const replyTimerRef = useRef(null);

    useEffect(() => () => window.clearTimeout(replyTimerRef.current), []);

    useEffect(() => {
        if (chatState !== "matching") return undefined;
        const timer = window.setTimeout(() => {
            const next = anonymousPeople[Math.floor(Math.random() * anonymousPeople.length)];
            setMatch(next);
            setMessages([createChatMessage({
                idPrefix: next.id,
                sender: starterMessages[0].sender,
                text: starterMessages[0].text,
            })]);
            setChatState("chatting");
        }, 3000);
        return () => window.clearTimeout(timer);
    }, [chatState]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping]);

    function toggleInterest(interest) {
        setSelectedInterests((current) => {
            if (current.includes(interest)) return current.filter((item) => item !== interest);
            if (current.length >= 5) return current;
            return [...current, interest];
        });
    }

    function stopTyping() {
        window.clearTimeout(replyTimerRef.current);
        setIsTyping(false);
    }

    function startMatching() { stopTyping(); setShowMenu(false); setChatState("matching"); }
    function endChat() { stopTyping(); setMessages([]); setMessage(""); setShowMenu(false); setChatState("setup"); }
    function nextMatch() { stopTyping(); setMessages([]); setMessage(""); setShowMenu(false); setChatState("matching"); }

    function sendMessage(event) {
        event.preventDefault();
        const trimmed = message.trim();
        if (!trimmed) return;
        setMessages((current) => [...current, createChatMessage({ idPrefix: "sent", sender: "me", text: trimmed })]);
        setMessage("");
        setIsTyping(true);
        replyTimerRef.current = window.setTimeout(() => {
            setIsTyping(false);
            setMessages((current) => [...current, createChatMessage({
                idPrefix: "reply",
                sender: "them",
                text: "Nice! I'm into that too.",
            })]);
        }, 1400);
    }

    /* ============ SETUP ============ */
    if (chatState === "setup") {
        return (
            <section className="chat-setup">
                <div className="chat-setup-visual" aria-hidden="true">
                    <div className="ring r3" />
                    <div className="ring r2" />
                    <div className="ring r1" />
                    <span className="pip p1" />
                    <span className="pip p2" />
                    <span className="pip p3" />
                    <span className="pip p4" />
                    <div className="core">
                        <GhostMark />
                    </div>
                </div>

                <div className="chat-setup-side">
                    <div className="chat-setup-title">
                        <h2>Who&apos;s out there?</h2>
                        <p>Someone nearby is also looking for someone to talk to.</p>
                    </div>

                    <div className="chat-setup-card">
                        <div className="chip-row">
                            <span className="label"><span className="dot" /> What are you into? <span className="optional">· optional</span></span>
                            <span className="chip-num">{selectedInterests.length}/5</span>
                        </div>

                        <div className="chips">
                            {allInterests.map((interest) => {
                                const on = selectedInterests.includes(interest.label);
                                return (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        className={`chip ${on ? "on" : ""}`}
                                        aria-pressed={on}
                                        disabled={!on && selectedInterests.length >= 5}
                                        onClick={() => toggleInterest(interest.label)}
                                    >
                                        <span className="chip-icon">{interest.icon}</span>
                                        {interest.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="chat-setup-foot">
                            <button className="btn btn-primary" type="button" onClick={startMatching}>
                                <Sparkles size={13} strokeWidth={2} /> Find someone <ArrowRight size={13} />
                            </button>
                            <span className="privacy"><Shield size={11} strokeWidth={1.8} /> Your identity stays hidden.</span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    /* ============ MATCHING ============ */
    if (chatState === "matching") {
        return (
            <section className="match-screen">
                <div className="match-wrap">
                    <p className="eyebrow"><span className="dot" /> Looking around</p>
                    <h1>Who&apos;s out <em>there</em>...</h1>
                    <p className="lead">Finding someone nearby who might be a good match.</p>

                    <div className="match-visual" aria-label="Searching">
                        <div className="ring r4" />
                        <div className="ring r3" />
                        <div className="ring r2" />
                        <div className="ring r1" />
                        <span className="sat s1" />
                        <span className="sat s2" />
                        <div className="core"><GhostMark /></div>
                    </div>

                    <p className="match-status">
                        <span className="pip" /> Searching nearby people
                    </p>
                    <div className="match-cancel">
                        <button className="btn btn-quiet" type="button" onClick={endChat}>
                            Cancel
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    /* ============ CHATTING ============ */
    return (
        <section className="conversation">
            <div className="conversation-wallpaper" aria-hidden="true">
                <span className="wallpaper-orbit orbit-a" />
                <span className="wallpaper-orbit orbit-b" />
                <span className="wallpaper-clue clue-a">?</span>
                <span className="wallpaper-clue clue-b">?</span>
                <GhostMark className="wallpaper-ghost ghost-a" />
                <GhostMark className="wallpaper-ghost ghost-b" />
                <GhostMark className="wallpaper-ghost ghost-c" />
            </div>

            <header className="conv-top">
                <div className="conv-person">
                    <AnonymousAvatar type={match.avatar} size="md" online />
                    <div>
                        <h3 className="conv-name">{match.name}</h3>
                        <p className="conv-meta">
                            <span className="status-dot" />
                            Online
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                    <button className="ix-btn" type="button" aria-label="Chat options" onClick={() => setShowMenu((c) => !c)}>
                        <MoreHorizontal size={16} strokeWidth={1.75} />
                    </button>
                </div>
                {showMenu && (
                    <div className="menu-pop">
                        <button type="button" onClick={endChat}>End chat</button>
                        <button type="button" onClick={() => setShowMenu(false)}>Report</button>
                        <button type="button" className="danger" onClick={() => setShowMenu(false)}>Block</button>
                    </div>
                )}
            </header>

            <div className="messages">
                <div className="notice" role="status">
                    <div className="notice-mark"><MatchNoticeIcon /></div>
                    <div className="notice-copy">
                        <strong>Matched with <span className="notice-name">{match.name}</span></strong>
                    </div>
                    <span className="notice-status" aria-hidden="true" />
                </div>

                {messages.map((item) => (
                    <div key={item.id} className={`row ${item.sender === "me" ? "sent" : ""}`}>
                        {item.sender === "them" && <AnonymousAvatar type={match.avatar} size="sm" />}
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

                {isTyping && (
                    <div className="row">
                        <AnonymousAvatar type={match.avatar} size="sm" />
                        <div className="typing"><i /><i /><i /></div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form className="composer" onSubmit={sendMessage}>
                <div className="composer-row">
                    <button className="next-btn" type="button" onClick={nextMatch} aria-label="Next match">
                        <RotateCw size={13} strokeWidth={1.8} /><span>Next match</span>
                    </button>
                    <div className="composer-inner">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Say hello..."
                            aria-label="Message"
                        />
                        <button className="send-btn" type="submit" aria-label="Send">
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}

export default Chat;
