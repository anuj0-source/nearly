import { MapPin } from "lucide-react";
import AnonymousAvatar from "../components/AnonymousAvatar";
import AnonymousFigure from "../components/AnonymousFigure";
import { anonymousPeople } from "../data/mockData";

function Nearby() {
    return (
        <div className="page">
            <header className="page-head">
                <div>
                    <p className="label">No exact pins, just possibility</p>
                    <h1>Who&apos;s <em>around</em>?</h1>
                    <p>Seven people are somewhere nearby. We keep the map fuzzy, because mystery is half the fun.</p>
                </div>
                <aside className="page-location"><MapPin size={12} /> Campus radius</aside>
            </header>

            <aside className="anon-frame nearby-radar" aria-hidden="true">
                <div className="anon-cap">
                    <small>campus · 7 nearby</small>
                    <span className="ix">live</span>
                </div>
                <div className="anon-figure nearby-radar-field">
                    <div className="nearby-figure-wrap">
                        <AnonymousFigure />
                    </div>
                    <span className="discover-pip radar-a" />
                    <span className="discover-pip radar-b" />
                    <span className="discover-pip radar-c" />
                </div>
                <div className="anon-foot">
                    <span className="anon-handle">Approximate location only.</span>
                    <small>~ 800m – 2.1km</small>
                </div>
            </aside>

            <div className="nearby-grid">
                {anonymousPeople.map((person) => (
                    <article className="nearby-card" key={person.id}>
                        <div className="nearby-top">
                            <div className="nearby-info">
                                <AnonymousAvatar type={person.avatar} online={person.status === "online"} />
                                <div className="nearby-copy">
                                    <h3>{person.name}</h3>
                                    <p>{person.description}</p>
                                </div>
                            </div>
                            <span className="dist">~ {person.distance}</span>
                        </div>
                        <div className="tags">
                            {person.interests.map((interest) => (
                                <span className="tag" key={interest}>{interest}</span>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default Nearby;
