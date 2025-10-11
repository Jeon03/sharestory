import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotification } from "../contexts/useNotification.ts";
import NotificationPanel from "./NotificationPanel";

export default function NotificationButton() {
    const { notifications } = useNotification();
    const [open, setOpen] = useState(false);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="relative">
            <button
                className="relative flex items-center"
                onClick={() => setOpen((prev) => !prev)}
            >
                <Bell className="w-6 h-6 text-gray-700 hover:text-black transition" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
            {unreadCount}
          </span>
                )}
            </button>

            {open && <NotificationPanel />}
        </div>
    );
}
