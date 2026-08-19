import { MapPin, Radio } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import GhostMark from "../components/GhostMark";
import { anonymousPeople } from "../data/mockData";

const STATUS_LABEL = {
    online: "Online",
    away: "Away",
    offline: "Offline",
};

function Nearby() {
    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="eyebrow"><span className="dot" /> Approximate location only</p>
                    <h1 className="h1">Who&apos;s around?</h1>
                </div>
                <aside>{anonymousPeople.length} <span className="accent">people nearby</span></aside>
            </header>

            <aside className="nearby-radar" aria-hidden="true">
                <div className="core"><GhostMark /></div>
                <div className="pip r1"><AnonymousAvatar type="fox" /></div>
                <div className="pip r2"><AnonymousAvatar type="panda" /></div>
                <div className="pip r3"><AnonymousAvatar type="owl" /></div>
                <div className="pip r4"><AnonymousAvatar type="ghost" /></div>
                <div className="pip r5"><AnonymousAvatar type="cat" /></div>
                <span className="dist-tag t1">~800m</span>
                <span className="dist-tag t2">~2.1km</span>
                <span className="dist-tag t3">~1.2km</span>
            </aside>

            <div className="nearby-grid">
                {anonymousPeople.map((person, i) => (
                    <article className="nearby-card" key={person.id} style={{ "--i": i }}>
                        <span className="nearby-fold" aria-hidden="true">
                            <Radio size={9} strokeWidth={2} />
                        </span>

                        <header className="nearby-head">
                            <span className="nearby-cid">№{person.id.toUpperCase()}-{(i + 1).toString().padStart(2, "0")}</span>
                            <span className={`nearby-status status-${person.status}`}>
                                <span className="nearby-status-pip" />
                                {STATUS_LABEL[person.status] || person.status}
                            </span>
                        </header>

                        <div className="nearby-identity">
                            <div className="nearby-avatar">
                                <AnonymousAvatar type={person.avatar} online={person.status === "online"} />
                            </div>
                            <div className="nearby-meta">
                                <h3>{person.name}</h3>
                                <p>{person.description}</p>
                            </div>
                        </div>

                        <div className="nearby-divider" aria-hidden="true">
                            <span />
                            <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true"><circle cx="3" cy="3" r="1" fill="currentColor" /></svg>
                            <span />
                        </div>

                        <footer className="nearby-foot">
                            <ul className="nearby-tags">
                                {person.interests.map((interest) => (
                                    <li className="nearby-tag" key={interest}>{interest}</li>
                                ))}
                            </ul>
                            <span className="nearby-dist">
                                <MapPin size={10} strokeWidth={2} />
                                {person.distance}
                            </span>
                        </footer>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default Nearby;
