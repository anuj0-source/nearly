import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Invite from "./pages/Invite";
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import Nearby from "./pages/Nearby";
import Profile from "./pages/Profile";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("nearly-theme") === "light" ? false : true);
    useEffect(() => {
        localStorage.setItem("nearly-theme", darkMode ? "dark" : "light");
    }, [darkMode]);
    const toggleTheme = () => setDarkMode((current) => !current);

    return (
        <div className={darkMode ? "theme-dark" : "theme-light"}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home darkMode={darkMode} onToggleTheme={toggleTheme} />} />
                    <Route path="/login" element={<Login darkMode={darkMode} onToggleTheme={toggleTheme} />} />
                    <Route element={<DashboardLayout darkMode={darkMode} onToggleTheme={toggleTheme} />}>
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/matches" element={<Matches />} />
                        <Route path="/nearby" element={<Nearby />} />
                        <Route path="/profile" element={<Profile darkMode={darkMode} onToggleTheme={toggleTheme} />} />
                        <Route path="/invite" element={<Invite />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
