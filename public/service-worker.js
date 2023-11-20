var staticCacheName = "spenny-piggy-" + new Date().getTime();
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then((cache) => {
            return cache && cache.addAll([
                "/offline",
            ]);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event?.respondWith(
        caches?.match(event?.request)
            .then((response) => {
                return response || fetch(event.request).catch(() => {
                    return caches?.match("offline");
                });
            })
            .catch((error) => {
                console.error("Fetch error:", error);
                return caches.match("offline");
            })
    );
});


self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames

                    .filter(cacheName => (cacheName.startsWith("spenny-piggy-")))

                    .filter(cacheName => (cacheName !== staticCacheName))

                    .map(cacheName => caches.delete(cacheName))

            );

        })

    );

});

self.addEventListener('push',event => {
    // const data = event.data.json();
    console.log("push-notify", event);
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        console.log('not-allowed');
        return;
    }
    var sendNotification = function(title, message, data, tag) {
        var title = title || "Thank You!",
            icon = '/favicon.png';
        message = message || 'Notificaions Enabled!';
        tag = tag || 'general';

        return self.registration.showNotification(title, {
            body: message,
            icon: icon,
            tag: tag,
            data: data
        });
    };

    if(event.data) {
        // console.log("event-data-d", event.data?.json() || "No Centent");
        var data = JSON.parse(event.data?.json());
        console.table("data-json", data)
        event.waitUntil(
            sendNotification(data.title, data.msg, data)
        );
    } else {
        sendNotification("Thank You", "Notificaions Enabled!");
    }
});


self.addEventListener("notificationclick", (event) => {
    // console.log("click-data", event?.data?.json() || event.notification?.data || event.notification)
    if(!event.notification?.data){
        event.notification.close();
        return;
    }
    const data = event.notification.data;
    if(data?.link || false){
        // console.log('ev-link', data.link);
        event.waitUntil(
            clients.openWindow(data.link)
        );
    }
    event.notification.close();
});