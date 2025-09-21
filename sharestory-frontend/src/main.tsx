import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// import './index.css'
import './css/App.css'
import { ChatProvider } from "./contexts/ChatContext";


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChatProvider>
            <App />
        </ChatProvider>
    </React.StrictMode>,
)
