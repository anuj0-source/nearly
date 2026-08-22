import { Moon, Sun } from "lucide-react";

function ThemeToggle({ darkMode, onToggle, icon = false }) {
    return (
        <button
            className={`theme-toggle secret-toggle ${darkMode ? "is-dark" : "is-light"} ${icon ? "icon" : "with-label"}`}
            type="button"
            onClick={onToggle}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={darkMode}
            data-tooltip={darkMode ? "Night mode active" : "Day mode active"}
        >
            <span className="secret-toggle-track" aria-hidden="true">
                <span className="secret-toggle-symbol secret-toggle-symbol-dark"><Moon /></span>
                <span className="secret-toggle-symbol secret-toggle-symbol-light"><Sun /></span>
                <span className="secret-toggle-seal">
                    <Moon className="secret-toggle-seal-moon" />
                    <Sun className="secret-toggle-seal-sun" />
                </span>
            </span>
            {!icon && <span className="secret-toggle-label">{darkMode ? "Night mode" : "Day mode"}</span>}
        </button>
    );
}

export default ThemeToggle;
