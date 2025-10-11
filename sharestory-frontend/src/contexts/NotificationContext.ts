import { createContext } from "react";
import type { NotificationPayload } from "../types/notification";

export interface NotificationContextType {
    notifications: NotificationPayload[];
    markAsRead: (id: number) => Promise<void>;
    setNotifications: React.Dispatch<React.SetStateAction<NotificationPayload[]>>;
}

export const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    markAsRead: async () => {},
    setNotifications: () => {},
});