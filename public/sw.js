// public/sw.js

self.addEventListener("push", function (event) {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: "Notification", body: event.data.text() };
      console.error("Error parsing push event data as JSON:", e);
    }
  }

  const title = payload.title || "Notification";
  const options = {
    body: payload.body || "",
    data: payload.url || payload.data?.url || "/",
    // you can add icon, badge, actions, etc.
    icon: payload.icon || "/icon.png",
    badge: payload.badge || "/badge.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If there's already a tab open with the url, focus it.
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
