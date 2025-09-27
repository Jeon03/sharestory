import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
    message: string | null;
}

export default function Toast({ message }: ToastProps) {
    return (
        <AnimatePresence>
            {message && (
// Toast.tsx
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        position: "fixed",
                        top: "170px",
                        left: "45%",
                        transform: "translateX(-50%)",
                        background: "#f5e166",
                        color: "black",
                        fontWeight: "bold",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        zIndex: 11000,
                    }}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
