import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, MoreHorizontal, RotateCw, Send, Shield, Sparkles, X } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import AnonymousFigure from "../components/AnonymousFigure";
import { anonymousPeople, interests as allInterests, starterMessages } from "../data/mockData";

function Chat() {
    const [chatState, setChatState] = useState("setup");
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [match, setMatch] = useState(anonymousPeople[0]);
    const [messages, setMessages] = useState(starterMessages);
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
            setMessages([{ ...starterMessages[0], id: `${next.id}-${Date.now()}` }]);
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
        setMessages((current) => [...current, { id: `sent-${Date.now()}`, sender: "me", text: trimmed, time: "Just now" }]);
        setMessage("");
        setIsTyping(true);
        replyTimerRef.current = window.setTimeout(() => {
            setIsTyping(false);
            setMessages((current) => [...current, { id: `reply-${Date.now()}`, sender: "them", text: "That sounds like a good reason to be here.", time: "Just now" }]);
        }, 1400);
    }

    /* ============ SETUP ============ */
    if (chatState === "setup") {
        return (
            <section className="chat-setup">
                <div className="mystery-side">
                    <div className="anon-frame chat-identity-card">
                        <div className="anon-cap">
                            <small>anon · looking around</small>
                            <span className="ix">now</span>
                        </div>
                        <div className="anon-figure">
                            <AnonymousFigure />
                        </div>
                        <div className="anon-foot">
                            <span className="anon-handle">Someone, somewhere.</span>
                            <small>~ 1.2km</small>
                        </div>
                    </div>
                </div>

                <div className="form-side">
                    <p className="label">Anonymous mode</p>
                    <h1>Who&apos;s <em>out</em> there?</h1>
                    <p className="lead">Someone nearby is also looking for someone to talk to. Give us a few clues — or keep it completely random.</p>

                    <div className="clue-card">
                        <div className="clue-head">
                            <div>
                                <h2>Give us a few clues</h2>
                                <p>Pick interests you vibe with. Optional.</p>
                            </div>
                            <span className="clue-num">{selectedInterests.length}/5</span>
                        </div>

                        <div className="chips">
                            {allInterests.map((interest) => {
                                const on = selectedInterests.includes(interest);
                                return (
                                    <button
                                        key={interest}
                                        type="button"
                                        className={`chip ${on ? "on" : ""}`}
                                        aria-pressed={on}
                                        disabled={!on && selectedInterests.length >= 5}
                                        onClick={() => toggleInterest(interest)}
                                    >
                                        {on ? <Check size={11} /> : null}
                                        {interest}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="clue-foot">
                            <span className="privacy"><Shield size={11} /> Your identity stays hidden.</span>
                            <button className="btn btn-primary" type="button" onClick={startMatching}>
                                Find someone <ArrowRight size={14} />
                            </button>
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
                    <p className="label">Looking around</p>
                    <h1>Who&apos;s out <em>there</em>...</h1>
                    <p className="lead">Finding someone nearby who might be a good match.</p>

                    <div className="match-visual" aria-label="Searching">
                        <div className="ring r3" />
                        <div className="ring r1" />
                        <div className="ring r2" />
                        <div className="core">?</div>
                    </div>

                    <p className="match-status">
                        <span className="pip" /> Searching nearby people
                    </p>
                    <div className="match-cancel">
                        <button className="btn btn-quiet" type="button" onClick={endChat}>
                            <X size={14} /> Cancel
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    /* ============ CHATTING ============ */
    return (
        <section className="conversation">
            <header className="conv-top">
                <div className="conv-person">
                    <AnonymousAvatar type={match.avatar} size="sm" online={match.status === "online"} />
                    <div>
                        <h3 className="conv-name">{match.name}</h3>
                        <p className="conv-meta">
                            <span className="status-dot" />
                            Online somewhere nearby
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    <button className="ix-btn" type="button" aria-label="Chat options" onClick={() => setShowMenu((c) => !c)}>
                        <MoreHorizontal size={16} />
                    </button>
                    <button className="ix-btn" type="button" aria-label="End chat" onClick={endChat}>
                        <X size={15} />
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
                <div className="notice">
                    <div className="notice-mark"><Sparkles size={13} strokeWidth={1.8} /></div>
                    <div>
                        <strong>You found someone nearby.</strong>
                        You&apos;re both here to meet someone new.
                    </div>
                </div>

                {messages.map((item) => (
                    <div key={item.id} className={`row ${item.sender === "me" ? "sent" : ""}`}>
                        {item.sender === "them" && <AnonymousAvatar type={match.avatar} size="sm" />}
                        <div className="bubble">
                            {item.text}
                            <small>{item.time}</small>
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
                <div className="composer-inner">
                    <button className="next-btn" type="button" onClick={nextMatch} aria-label="Next match">
                        <RotateCw size={13} /><span>Next match</span>
                    </button>
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
            </form>
        </section>
    );
}

export default Chat;
