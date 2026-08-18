import { Check, Copy, MessageCircle, QrCode, Share2 } from "lucide-react";
import { useState } from "react";

function Invite() {
    const [copied, setCopied] = useState(false);
    function copyLink() {
        navigator.clipboard?.writeText("nearly.app/join/your-campus");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="label">Bring a little chaos to campus</p>
                    <h1>Bring your <em>people</em>.</h1>
                    <p>Imagine finding out your roommate was Anonymous Panda.</p>
                </div>
            </header>

            <div className="invite-grid">
                <section className="invite-hero">
                    <div>
                        <p className="label">Campus signal</p>
                        <h2>Your campus is more fun with <em style={{ fontStyle: "italic", fontFamily: "var(--serif)", fontWeight: 500 }}>friends.</em></h2>
                        <p>Start a secret little social layer with the people you already know — without making every conversation a big thing.</p>
                    </div>
                    <button className="btn" type="button" onClick={copyLink} style={{ alignSelf: "flex-start" }}>
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                        {copied ? "Link copied" : "Share your invite"}
                    </button>
                </section>

                <aside className="invite-stack">
                    <section className="invite-box">
                        <span className="label">Your invite link</span>
                        <code className="invite-code">nearly.app/join/your-campus</code>
                        <div className="invite-actions">
                            <button className="btn btn-ghost" type="button" onClick={copyLink}>
                                <Copy size={13} /> {copied ? "Copied" : "Copy link"}
                            </button>
                            <button className="btn btn-ghost" type="button">
                                <MessageCircle size={13} /> WhatsApp
                            </button>
                            <button className="btn btn-ghost" type="button">
                                <Share2 size={13} /> Story
                            </button>
                        </div>

                        <div className="qr-tile">
                            <QrCode size={20} />
                            <span>Scan to join</span>
                        </div>
                    </section>

                    <section className="invite-box">
                        <span className="label">Your signal</span>
                        <div className="stats">
                            <div><strong>12</strong><span>Invited</span></div>
                            <div><strong>7</strong><span>Joined</span></div>
                            <div><strong>3</strong><span>Online</span></div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

export default Invite;
