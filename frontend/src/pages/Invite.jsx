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
                    <p className="eyebrow">Invite people you trust</p>
                    <h1 className="h1">Bring your <em>people</em>.</h1>
                </div>
                <aside>3 <span className="accent">online now</span></aside>
            </header>

            <div className="invite-grid">
                <section className="invite-hero">
                    <p className="eyebrow">Invite your campus</p>
                    <h2>Nearly is better when your people are here.</h2>
                    <p>Start a quiet social layer without making every conversation a big thing.</p>
                    <button className="btn btn-primary" type="button" onClick={copyLink}>
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                        {copied ? "Link copied" : "Share invite"}
                    </button>
                </section>

                <aside className="invite-stack">
                    <section className="invite-box">
                        <span className="eyebrow">Your invite link</span>
                        <code className="invite-code">nearly.app/join/your-campus</code>
                        <div className="invite-actions">
                            <button className="btn btn-ghost" type="button" onClick={copyLink}>
                                <Copy size={12} strokeWidth={1.8} /> {copied ? "Copied" : "Copy link"}
                            </button>
                            <button className="btn btn-ghost" type="button">
                                <MessageCircle size={12} strokeWidth={1.8} /> WhatsApp
                            </button>
                            <button className="btn btn-ghost" type="button">
                                <Share2 size={12} strokeWidth={1.8} /> Story
                            </button>
                        </div>

                        <div className="qr-tile">
                            <QrCode size={20} strokeWidth={1.5} />
                            <span>Scan to join</span>
                        </div>
                    </section>

                    <section className="invite-box">
                        <span className="eyebrow">Invite activity</span>
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
