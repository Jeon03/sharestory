import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./css/App.css";
import { ChatProvider } from "./contexts/ChatContext";
import AuthProvider from "./contexts/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthProvider>
            <ChatProvider>
                <App />
            </ChatProvider>
        </AuthProvider>
    </React.StrictMode>
);
