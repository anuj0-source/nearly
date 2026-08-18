import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnonymousAvatar from "../components/AnonymousAvatar";
import { previousMatches } from "../data/mockData";

function Matches() {
    const navigate = useNavigate();
    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="label">People you&apos;ve met</p>
                    <h1>Your little <em>archive</em>.</h1>
                    <p>Conversations that happened because you both happened to be here, at the same time.</p>
                </div>
                <aside>{previousMatches.length} so far</aside>
            </header>

            <div className="match-grid">
                <div className="match-list">
                    {previousMatches.map((person) => (
                        <button key={person.id} className="match-row" type="button" onClick={() => navigate("/chat")}>
                            <AnonymousAvatar type={person.avatar} online={person.status === "online"} />
                            <div className="body">
                                <h3>{person.name} <i>· {person.time}</i></h3>
                                <p>{person.lastMessage}</p>
                                <div className="tags">
                                    {person.interests.map((interest) => (
                                        <span className="tag" key={interest}>{interest}</span>
                                    ))}
                                </div>
                            </div>
                            <ArrowRight size={15} color="var(--faint)" />
                        </button>
                    ))}
                </div>

                <aside className="discover" aria-hidden="true">
                    <span className="discover-pip a" />
                    <span className="discover-pip b" />
                    <span className="discover-pip c" />
                    <div className="discover-copy">
                        <strong>Maybe next?</strong>
                        <span>There are always more people nearby.</span>
                        <button className="btn btn-primary" type="button" onClick={() => navigate("/chat")}>
                            Find someone <ArrowRight size={13} />
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default Matches;
