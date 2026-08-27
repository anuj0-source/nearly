import { useState } from "react";
import { X, Save, Loader2, ChevronDown } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export default function EditProfileModal({ isOpen, onClose, profile, onSave }) {
    const [name, setName] = useState(profile?.name || "");
    const [language, setLanguage] = useState(profile?.language || "");
    const [gender, setGender] = useState(profile?.gender || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${BACKEND_URL}/api/profile/edit-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: name || undefined,
                    language: language || undefined,
                    gender: gender || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const updatedProfile = await response.json();
            onSave(updatedProfile);
            onClose();
        } catch (err) {
            console.error(err);
            setError("Something went wrong updating your profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button type="button" onClick={onClose} className="icon-pill">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <p className="modal-error">{error}</p>}
                    
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your secret identity"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="language">Language</label>
                        <input
                            id="language"
                            type="text"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            placeholder="e.g. hinglish"
                        />
                    </div>

                    <div className="form-group relative">
                        <label>Gender</label>
                        <div className="custom-select-wrapper">
                            <div 
                                className={`custom-select ${isGenderDropdownOpen ? "open" : ""}`}
                                onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                                tabIndex={0}
                                onBlur={() => setTimeout(() => setIsGenderDropdownOpen(false), 150)}
                            >
                                <span>{gender || "not-defined"}</span>
                                <ChevronDown size={15} />
                            </div>
                            
                            {isGenderDropdownOpen && (
                                <div className="custom-options-menu">
                                    {["not-defined", "male", "female"].map(opt => (
                                        <div 
                                            key={opt}
                                            className={`custom-option ${gender === opt ? "selected" : ""}`}
                                            onClick={() => {
                                                setGender(opt);
                                                setIsGenderDropdownOpen(false);
                                            }}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="spinner" /> : <Save size={16} />} 
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
