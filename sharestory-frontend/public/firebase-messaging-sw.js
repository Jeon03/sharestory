importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAHaJVEhYsc_4hDQmPTOSol1J0GKFCsKEY",
    authDomain: "sharestroy-bf74e.firebaseapp.com",
    projectId: "sharestroy-bf74e",
    messagingSenderId: "695058953412",
    appId: "1:695058953412:web:6d7599daa8407c9c480591",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] 📩 background message:", payload);
    const title = payload.data?.title || "알림";
    const body = payload.data?.body || "내용 없음";
    const clickAction = payload.data?.click_action || "/";

    self.registration.showNotification(title, {
        body,
        icon: "/logo192.png",
        data: { click_action: clickAction },
    });
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const clickAction = event.notification.data?.click_action || "/";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === clickAction && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(clickAction);
        })
    );
});
