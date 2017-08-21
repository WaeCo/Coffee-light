importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js');
importScripts('./firebase.js');

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

let notifications = {};
let userId = null;

self.addEventListener('message', function (msg) {
  if (msg.data.type === "notify") {
    if(!notifications[msg.data.data.ts] && msg.data.data.user_id !== userId)
      makeNotification(msg.data.data);
  } else if(msg.data.type === "setUser") {
    console.log("Set userId to" + msg.data.userId);
    userId = msg.data.userId;
  }
});

function makeNotification(data) {
  console.log('[firebase-messaging-sw.js] Received background message ', data);
  notifications[data.ts] = true;
  
  return self.registration.showNotification(data.notification_title, {
    body: data.notification_body,
    icon: data.notification_icon,
    data: data
  });
}

self.addEventListener('install', function () {
  console.log("Worker instelled");
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  console.log("Worker actived");
  event.waitUntil(self.clients.claim());
});

messaging.setBackgroundMessageHandler((payload) => makeNotification(payload.data));

self.addEventListener("notificationclick", function (event) {
  console.log("notfification clicked", event);

  event.notification.close();
  delete notifications[event.notification.data.ts];

  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll({
        type: "window"
      })
    })
    .then(function (clientList) {
      console.log(clientList);
      if (clientList.length > 0) {
        return clientList[0].focus()
          .then(() => clientList[0].navigate("./#" + event.notification.data.channel_name))
      }
      if (self.clients.openWindow)
        return self.clients.openWindow("./#" + event.notification.data.channel_name);
    }).catch(console.error)
  );
});