import { motion } from "framer-motion";
import { useNotification } from "../contexts/useNotification.ts";

export default function NotificationPanel() {
    const { notifications } = useNotification();

    return (
        <motion.div
            className="absolute right-0 top-10 bg-white border rounded-xl shadow-lg w-80 p-3 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h3 className="text-base font-semibold mb-2">🔔 알림</h3>

            {notifications.length === 0 ? (
                <p className="text-gray-400 text-sm text-center">새로운 알림이 없습니다</p>
            ) : (
                <ul className="max-h-80 overflow-y-auto divide-y">
                    {notifications.map((n) => (
                        <li key={n.id} className="py-2 text-sm hover:bg-gray-50 transition">
                            <p className="font-medium text-gray-800">{n.type}</p>
                            <p className="text-gray-600">{n.message}</p>
                            <p className="text-gray-400 text-xs">{n.createdAt}</p>
                        </li>
                    ))}
                </ul>
            )}
        </motion.div>
    );
}
