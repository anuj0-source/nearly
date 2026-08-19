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
                        <div className="match-avatar">
                            <AnonymousAvatar type={person.avatar} size="lg" online={person.status === "online"} />
                        </div>

                        <div className="match-body">
                            <header className="match-head">
                                <span className="match-name">{person.name}</span>
                                <time className="match-time">{person.time}</time>
                            </header>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default Matches;
