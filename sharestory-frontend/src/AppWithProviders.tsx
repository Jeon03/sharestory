import App from "./App";
import { ChatProvider } from "./contexts/ChatContext";
import { FavoriteProvider } from "./contexts/FavoriteContext";
import { NotificationProvider } from "./contexts/NotificationProvider";

export default function AppWithProviders() {


    return (
        <NotificationProvider>
            <ChatProvider>
                <FavoriteProvider>
                    <App />
                </FavoriteProvider>
            </ChatProvider>
        </NotificationProvider>
    );
}
