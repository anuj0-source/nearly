import { ArrowUpRight, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnonymousAvatar from "../components/AnonymousAvatar";
import { previousMatches } from "../data/mockData";

function Matches() {
    const navigate = useNavigate();
    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="eyebrow"><span className="dot" /> People you&apos;ve met</p>
                    <h1 className="h1">People you&apos;ve met</h1>
                </div>
                <aside>{previousMatches.length} <span className="accent">so far</span></aside>
            </header>

            <div className="match-list">
                {previousMatches.map((person, i) => (
                    <article
                        key={person.id}
                        className="match-card"
                        onClick={() => navigate("/chat")}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/chat")}
                        role="button"
                        tabIndex={0}
                        style={{ "--i": i }}
                    >
                        <span className="match-rail" aria-hidden="true" />
                        <div className="match-avatar">
                            <AnonymousAvatar type={person.avatar} online={person.status === "online"} />
                        </div>

                        <div className="match-body">
                            <header className="match-head">
                                <div className="match-id">
                                    <span className="match-name">{person.name}</span>
                                    <span className="match-cid">#{person.id.toUpperCase()}-{(i + 1).toString().padStart(3, "0")}</span>
                                </div>
                                <span className="match-time">{person.time}</span>
                            </header>

                            <p className="match-quote">
                                <MessageSquare size={11} strokeWidth={1.8} />
                                <span>{person.lastMessage}</span>
                            </p>

                            <footer className="match-foot">
                                <ul className="match-tags">
                                    {person.interests.map((interest) => (
                                        <li className="match-tag" key={interest}>{interest}</li>
                                    ))}
                                </ul>
                                <span className="match-go" aria-hidden="true">
                                    <ArrowUpRight size={14} strokeWidth={1.75} />
                                </span>
                            </footer>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default Matches;
