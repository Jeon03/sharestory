import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./css/App.css";
import { ChatProvider } from "./contexts/ChatContext";
import AuthProvider from "./contexts/AuthProvider";
import { BrowserRouter as Router } from "react-router-dom";
import { FavoriteProvider } from "./contexts/FavoriteContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Router>
            <AuthProvider>
                <ChatProvider>
                    <FavoriteProvider>
                        <App />
                    </FavoriteProvider>
                </ChatProvider>
            </AuthProvider>
        </Router>
    </React.StrictMode>
);
